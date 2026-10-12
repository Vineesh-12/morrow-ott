/**
 * Morrow OTT Platform — Phase 5 Amazon DynamoDB Catalogue Repository
 * Concrete repository adapter backed by the Amazon DynamoDB table 'MorrowVideos'.
 *
 * Implements:
 * - O(1) GetItem lookup for titles by stable ID
 * - Bounded Scan with application-level filtering for content type, genre, and limit
 * - Deterministic series episode retrieval and sorting
 * - Truth-in-availability enforcement via canonical normalizer
 * - Defensive error shielding (no credential leakage, no silent fallback to fixture data)
 */

import { BaseCatalogueRepository } from './baseRepository.mjs';
import { normalizeTitleRecord } from '../utils/normalizer.mjs';

export class DatabaseError extends Error {
  constructor(message, code = 'DATABASE_UNAVAILABLE', statusCode = 503) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class DynamoDbCatalogueRepository extends BaseCatalogueRepository {
  /**
   * @param {Object} [docClient] - Optional injected DynamoDBDocumentClient instance (for testing)
   * @param {string} [tableName] - Target DynamoDB table name (defaults to MorrowVideos)
   * @param {string} [region] - Target AWS Region
   */
  constructor(
    docClient = null,
    tableName = process.env.TABLE_NAME || 'MorrowVideos',
    region = process.env.AWS_REGION || 'ap-southeast-2'
  ) {
    super();
    this.tableName = tableName;
    this.region = region;
    this.docClient = docClient;
    this._clientInitialized = Boolean(docClient);
  }

  /**
   * Lazily initializes AWS SDK DynamoDB DocumentClient.
   * AWS Lambda provides @aws-sdk/* in the global runtime environment.
   */
  async _getDocClient() {
    if (this.docClient) {
      return this.docClient;
    }

    try {
      const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
      const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb');

      const ddbClient = new DynamoDBClient({ region: this.region });
      this.docClient = DynamoDBDocumentClient.from(ddbClient, {
        marshallOptions: {
          removeUndefinedValues: true
        }
      });
      this._clientInitialized = true;
      return this.docClient;
    } catch (err) {
      console.error(JSON.stringify({
        level: 'ERROR',
        type: 'DYNAMODB_INIT_ERROR',
        message: err.message,
        timestamp: new Date().toISOString()
      }));
      throw new DatabaseError(
        `Failed to initialize DynamoDB client: ${err.message}`,
        'DATABASE_CLIENT_INIT_FAILED',
        503
      );
    }
  }

  /**
   * Translates native DynamoDB exceptions into safe application-level errors.
   * Ensures internal stack traces, connection strings, and credentials are never exposed.
   */
  _handleDynamoError(err, operation) {
    const errorName = err?.name || 'Error';
    const message = err?.message || 'Unknown DynamoDB error';

    console.error(JSON.stringify({
      level: 'ERROR',
      type: 'DYNAMODB_ERROR',
      operation,
      table: this.tableName,
      errorName,
      message,
      timestamp: new Date().toISOString()
    }));

    if (errorName === 'ResourceNotFoundException') {
      throw new DatabaseError(
        `DynamoDB table '${this.tableName}' was not found. Please verify table creation in Region ${this.region}.`,
        'TABLE_NOT_FOUND',
        503
      );
    }

    if (errorName === 'AccessDeniedException' || errorName === 'UnrecognizedClientException') {
      throw new DatabaseError(
        `IAM permission denied accessing DynamoDB table '${this.tableName}'. Verify Lambda execution role policy.`,
        'DATABASE_ACCESS_DENIED',
        503
      );
    }

    if (errorName === 'ProvisionedThroughputExceededException') {
      throw new DatabaseError(
        `DynamoDB request rate exceeded on table '${this.tableName}'. Please retry shortly.`,
        'DATABASE_THROTTLED',
        503
      );
    }

    // Generic AWS / Network Failure — Fail clearly and safely
    throw new DatabaseError(
      `DynamoDB operation '${operation}' failed on table '${this.tableName}'.`,
      'DATABASE_UNAVAILABLE',
      503
    );
  }

  /**
   * Retrieves a single title by its partition key ID.
   * Access Pattern 1: GetItem on table 'MorrowVideos' by 'id'.
   *
   * @param {string} id - Stable title ID (e.g. VID001)
   * @returns {Promise<Object|null>} Normalized canonical title or null if not found
   */
  async getVideoById(id) {
    if (!id) return null;

    try {
      const client = await this._getDocClient();
      const { GetCommand } = await import('@aws-sdk/lib-dynamodb');

      const response = await client.send(new GetCommand({
        TableName: this.tableName,
        Key: { id }
      }));

      if (!response.Item) {
        return null;
      }

      return normalizeTitleRecord(response.Item);
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      return this._handleDynamoError(err, 'GetItem');
    }
  }

  /**
   * Lists catalogue titles with optional filters.
   * Access Pattern 2: Bounded Scan with in-memory filtering.
   *
   * @param {{ type?: string, genre?: string, limit?: number }} [filters={}]
   * @returns {Promise<Array<Object>>}
   */
  async listVideos(filters = {}) {
    try {
      const client = await this._getDocClient();
      const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');

      const limit = typeof filters.limit === 'number' && filters.limit > 0 ? filters.limit : 50;

      // Scan up to 50 items (academic catalogue total is 7 items)
      const response = await client.send(new ScanCommand({
        TableName: this.tableName,
        Limit: 50
      }));

      let items = (response.Items || []).map(normalizeTitleRecord).filter(Boolean);

      // Filter by Content Type (movie / series)
      if (filters.type) {
        items = items.filter(item => item.contentType === filters.type);
      }

      // Filter by Genre (case-insensitive substring)
      if (filters.genre) {
        const g = filters.genre.toLowerCase();
        items = items.filter(item =>
          item.genres && item.genres.some(genre => genre.toLowerCase().includes(g) || g.includes(genre.toLowerCase()))
        );
      }

      return items.slice(0, limit);
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      return this._handleDynamoError(err, 'Scan');
    }
  }

  /**
   * Retrieves episodes for a series ordered deterministically.
   * Access Pattern 3: GetItem on parent series, extracting embedded episodes.
   *
   * @param {string} seriesId - Stable series ID (e.g. VID003)
   * @returns {Promise<{ isSeries: boolean, episodes: Array<Object> }|null>}
   */
  async listEpisodesBySeriesId(seriesId) {
    if (!seriesId) return null;

    try {
      const client = await this._getDocClient();
      const { GetCommand } = await import('@aws-sdk/lib-dynamodb');

      const response = await client.send(new GetCommand({
        TableName: this.tableName,
        Key: { id: seriesId }
      }));

      if (!response.Item) {
        return null;
      }

      const title = normalizeTitleRecord(response.Item);
      if (title.contentType !== 'series') {
        return { isSeries: false, episodes: [] };
      }

      const sortedEpisodes = [...(title.episodes || [])].sort((a, b) => {
        if (a.seasonNum !== b.seasonNum) return a.seasonNum - b.seasonNum;
        return a.episodeNum - b.episodeNum;
      });

      return {
        isSeries: true,
        episodes: sortedEpisodes
      };
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      return this._handleDynamoError(err, 'GetItem:Episodes');
    }
  }
}
