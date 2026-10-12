/**
 * Morrow OTT Platform — Phase 5 DynamoDB Repository & Importer Test Suite
 * Validates the DynamoDB repository adapter using a fast in-memory mock client,
 * testing GetItem, bounded Scan, series episode extraction, error shielding,
 * and ensuring zero silent fallback to fixture data.
 */

import { DynamoDbCatalogueRepository, DatabaseError } from '../backend/src/repository/dynamoDbRepository.mjs';
import { getCatalogueRepository, resetRepositoryInstance, DataSourceUnavailableError } from '../backend/src/repository/catalogueRepository.mjs';
import { FixtureCatalogueRepository } from '../backend/src/repository/fixtureRepository.mjs';
import { prepareDynamoDbItems } from './import-catalogue-dynamodb.mjs';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, failureDetails = '') {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ [FAIL] ${testName}${failureDetails ? ' -> ' + failureDetails : ''}`);
    failedTests++;
  }
}

/**
 * Creates an in-memory mock DocumentClient that simulates AWS DynamoDB operations
 */
function createMockDocClient(initialItems = []) {
  const tableData = new Map();
  for (const item of initialItems) {
    tableData.set(item.id, { ...item });
  }

  let simulateError = null;

  return {
    setSimulatedError(err) {
      simulateError = err;
    },
    async send(command) {
      if (simulateError) {
        const errToThrow = simulateError;
        simulateError = null;
        throw errToThrow;
      }

      const cmdName = command.constructor.name;

      if (cmdName === 'GetCommand') {
        const id = command.input.Key.id;
        const item = tableData.get(id);
        return { Item: item ? { ...item } : undefined };
      }

      if (cmdName === 'ScanCommand') {
        const limit = command.input.Limit || 50;
        const allItems = Array.from(tableData.values()).slice(0, limit);
        return { Items: allItems };
      }

      if (cmdName === 'PutCommand') {
        const item = command.input.Item;
        tableData.set(item.id, { ...item });
        return {};
      }

      throw new Error(`Unsupported mock command: ${cmdName}`);
    }
  };
}

async function runDynamoDbTests() {
  console.log('======================================================');
  console.log('  Morrow OTT — Running Phase 5 DynamoDB Test Suite');
  console.log('======================================================\n');

  // Load canonical items for mock testing
  const canonicalItems = prepareDynamoDbItems();

  // ----------------------------------------------------------------------------
  // Suite 1: Single Item Retrieval (GetItem)
  // ----------------------------------------------------------------------------
  console.log('Suite 1: Single Item Retrieval (GetItem)');
  {
    const mockClient = createMockDocClient(canonicalItems);
    const repo = new DynamoDbCatalogueRepository(mockClient, 'MorrowVideos', 'ap-southeast-2');

    // Existing movie: VID001
    const movie = await repo.getVideoById('VID001');
    assert(Boolean(movie), 'GetItem returns title object for existing ID VID001');
    assert(movie.id === 'VID001' && movie.title === 'The Cloud Paradox', 'Returns correct movie title "The Cloud Paradox"');
    assert(movie.isPlayable === true, 'Verified available movie is marked isPlayable = true');
    assert(movie.contentType === 'movie', 'Content type is "movie"');
    assert(movie.videoId === 'VID001', 'Preserves backward-compatible legacy videoId alias');

    // Metadata-only title: VID005
    const pendingMovie = await repo.getVideoById('VID005');
    assert(pendingMovie.availabilityStatus === 'metadata_only', 'Solaris Drift availabilityStatus is "metadata_only"');
    assert(pendingMovie.isPlayable === false, 'Solaris Drift isPlayable is false (truth-in-availability preserved)');

    // Missing title: VID999
    const missing = await repo.getVideoById('VID999_MISSING');
    assert(missing === null, 'GetItem returns null for non-existent title ID');
  }

  // ----------------------------------------------------------------------------
  // Suite 2: Catalogue Listing & Multifaceted Filtering (Scan)
  // ----------------------------------------------------------------------------
  console.log('\nSuite 2: Catalogue Listing & Query Filters (Scan)');
  {
    const mockClient = createMockDocClient(canonicalItems);
    const repo = new DynamoDbCatalogueRepository(mockClient, 'MorrowVideos', 'ap-southeast-2');

    // Full scan
    const all = await repo.listVideos();
    assert(all.length === 7, `listVideos() returns all 7 items from DynamoDB (got ${all.length})`);

    // Filter by type: movie
    const movies = await repo.listVideos({ type: 'movie' });
    assert(movies.length === 4, `Filters by type=movie returning 4 items (got ${movies.length})`);
    assert(movies.every(m => m.contentType === 'movie'), 'Every returned item has contentType "movie"');

    // Filter by type: series
    const series = await repo.listVideos({ type: 'series' });
    assert(series.length === 3, `Filters by type=series returning 3 items (got ${series.length})`);
    assert(series.every(s => s.contentType === 'series'), 'Every returned item has contentType "series"');

    // Filter by genre: Sci-Fi
    const sciFi = await repo.listVideos({ genre: 'Sci-Fi' });
    assert(sciFi.length >= 2, `Filters by genre="Sci-Fi" returning matching titles (got ${sciFi.length})`);
    assert(sciFi.every(t => t.genres.some(g => g.toLowerCase().includes('sci-fi'))), 'All filtered titles contain "Sci-Fi"');

    // Bounded limit: limit=2
    const limited = await repo.listVideos({ limit: 2 });
    assert(limited.length === 2, `Respects bounded limit parameter (returned exactly 2 titles)`);
  }

  // ----------------------------------------------------------------------------
  // Suite 3: Series Episodes Retrieval & Ordering
  // ----------------------------------------------------------------------------
  console.log('\nSuite 3: Series Episodes Retrieval & Deterministic Ordering');
  {
    const mockClient = createMockDocClient(canonicalItems);
    const repo = new DynamoDbCatalogueRepository(mockClient, 'MorrowVideos', 'ap-southeast-2');

    // Valid series: VID003 (Flora: The Secret Kingdom)
    const seriesResult = await repo.listEpisodesBySeriesId('VID003');
    assert(Boolean(seriesResult), 'listEpisodesBySeriesId returns result object for VID003');
    assert(seriesResult.isSeries === true, 'seriesResult.isSeries is true');
    assert(Array.isArray(seriesResult.episodes) && seriesResult.episodes.length === 1, 'Returns 1 episode for VID003');
    assert(seriesResult.episodes[0].id === 'VID003-E1', 'Episode ID is VID003-E1');
    assert(seriesResult.episodes[0].title === 'Canopy Awakening', 'Episode title is "Canopy Awakening"');
    assert(seriesResult.episodes[0].isPlayable === true, 'Episode with video file is marked isPlayable = true');

    // Call series episodes on a movie (VID001)
    const movieResult = await repo.listEpisodesBySeriesId('VID001');
    assert(movieResult.isSeries === false, 'Calling series episodes on movie VID001 returns isSeries: false');
    assert(movieResult.episodes.length === 0, 'Returned episodes array is empty');

    // Missing series ID
    const missingResult = await repo.listEpisodesBySeriesId('VID999_NON_EXISTENT');
    assert(missingResult === null, 'Calling series episodes on non-existent ID returns null');
  }

  // ----------------------------------------------------------------------------
  // Suite 4: Error Handling & Defensive Isolation (No Silent Fallback)
  // ----------------------------------------------------------------------------
  console.log('\nSuite 4: Error Handling & Defensive Isolation (Zero Silent Fallback)');
  {
    const mockClient = createMockDocClient(canonicalItems);
    const repo = new DynamoDbCatalogueRepository(mockClient, 'MorrowVideos', 'ap-southeast-2');

    // Simulate Table Missing (ResourceNotFoundException)
    const notFoundError = new Error('Cannot do operations on a non-existent table');
    notFoundError.name = 'ResourceNotFoundException';
    mockClient.setSimulatedError(notFoundError);

    let caughtNotFound = null;
    try {
      await repo.getVideoById('VID001');
    } catch (err) {
      caughtNotFound = err;
    }
    assert(caughtNotFound instanceof DatabaseError, 'Missing table throws DatabaseError');
    assert(caughtNotFound.code === 'TABLE_NOT_FOUND', 'Error code is TABLE_NOT_FOUND');
    assert(caughtNotFound.statusCode === 503, 'HTTP status code is 503 Service Unavailable');

    // Simulate Access Denied (AccessDeniedException)
    const accessDeniedError = new Error('User is not authorized to perform: dynamodb:GetItem');
    accessDeniedError.name = 'AccessDeniedException';
    mockClient.setSimulatedError(accessDeniedError);

    let caughtAccessDenied = null;
    try {
      await repo.getVideoById('VID001');
    } catch (err) {
      caughtAccessDenied = err;
    }
    assert(caughtAccessDenied.code === 'DATABASE_ACCESS_DENIED', 'IAM access denied maps to DATABASE_ACCESS_DENIED');
    assert(caughtAccessDenied.statusCode === 503, 'Access denied maps to HTTP 503');

    // Simulate Throttling (ProvisionedThroughputExceededException)
    const throttledError = new Error('Throughput exceeded');
    throttledError.name = 'ProvisionedThroughputExceededException';
    mockClient.setSimulatedError(throttledError);

    let caughtThrottled = null;
    try {
      await repo.listVideos();
    } catch (err) {
      caughtThrottled = err;
    }
    assert(caughtThrottled.code === 'DATABASE_THROTTLED', 'Throttled request maps to DATABASE_THROTTLED');
  }

  // ----------------------------------------------------------------------------
  // Suite 5: Factory & Environment Configuration (DATA_SOURCE Selection)
  // ----------------------------------------------------------------------------
  console.log('\nSuite 5: Factory & Environment Configuration (DATA_SOURCE Selection)');
  {
    // Test DATA_SOURCE=fixture
    process.env.DATA_SOURCE = 'fixture';
    resetRepositoryInstance();
    const fixtureRepo = getCatalogueRepository();
    assert(fixtureRepo instanceof FixtureCatalogueRepository, 'DATA_SOURCE=fixture resolves to FixtureCatalogueRepository');

    // Test DATA_SOURCE=dynamodb
    process.env.DATA_SOURCE = 'dynamodb';
    resetRepositoryInstance();
    const ddbRepo = getCatalogueRepository();
    assert(ddbRepo instanceof DynamoDbCatalogueRepository, 'DATA_SOURCE=dynamodb resolves to DynamoDbCatalogueRepository');

    // Test unsupported DATA_SOURCE
    let caughtUnsupported = null;
    try {
      getCatalogueRepository('mongodb_invalid');
    } catch (err) {
      caughtUnsupported = err;
    }
    assert(caughtUnsupported instanceof DataSourceUnavailableError, 'Unsupported DATA_SOURCE throws DataSourceUnavailableError');

    // Restore fixture as default for local dev safety
    process.env.DATA_SOURCE = 'fixture';
    resetRepositoryInstance();
  }

  // ----------------------------------------------------------------------------
  // Suite 6: Catalogue Import Preparation Integrity
  // ----------------------------------------------------------------------------
  console.log('\nSuite 6: Catalogue Import Preparation Integrity');
  {
    const items = prepareDynamoDbItems();
    assert(items.length === 7, `Importer loads exactly 7 canonical items (got ${items.length})`);
    assert(items.every(item => Boolean(item.id)), 'Every prepared DynamoDB item has partition key "id"');
    assert(items.every(item => Boolean(item.title)), 'Every prepared DynamoDB item has "title"');
    assert(items.every(item => Boolean(item.contentType)), 'Every prepared DynamoDB item has "contentType"');
    assert(items.filter(i => i.isPlayable).length === 4, 'Exactly 4 titles are marked isPlayable = true');
    assert(items.filter(i => !i.isPlayable).length === 3, 'Exactly 3 titles are marked isPlayable = false (unverified preserved)');
  }

  // ----------------------------------------------------------------------------
  // Summary
  // ----------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`  Phase 5 DynamoDB Tests Passed: ${passedTests}`);
  console.log(`  Phase 5 DynamoDB Tests Failed: ${failedTests}`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runDynamoDbTests().catch(err => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
