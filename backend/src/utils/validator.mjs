/**
 * Morrow OTT Platform — Request Input Validator
 * Validates path parameters and query strings to defend against injection,
 * unbounded scans, and malformed inputs.
 */

const SAFE_ID_REGEX = /^[A-Za-z0-9_-]{1,64}$/;
const ALLOWED_CONTENT_TYPES = new Set(['movie', 'series']);
const MAX_LIMIT = 50;

export class ValidationError extends Error {
  constructor(message, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.statusCode = 400;
  }
}

/**
 * Validates an ID path parameter (e.g. VID001, VID003-E1).
 * @param {string} id
 * @param {string} [paramName='id']
 * @returns {string} Sanitized ID
 */
export function validateId(id, paramName = 'id') {
  if (!id || typeof id !== 'string') {
    throw new ValidationError(`The path parameter '${paramName}' is required and must be a string.`);
  }

  const trimmed = id.trim();
  if (!SAFE_ID_REGEX.test(trimmed)) {
    throw new ValidationError(
      `Invalid '${paramName}': must contain only alphanumeric characters, hyphens, or underscores (1-64 chars).`
    );
  }

  return trimmed;
}

/**
 * Validates and normalizes query parameters for GET /api/videos.
 * @param {Object} [queryParams={}]
 * @returns {{ type?: string, genre?: string, limit: number }}
 */
export function validateVideoFilters(queryParams = {}) {
  const filters = {
    limit: MAX_LIMIT
  };

  if (!queryParams || typeof queryParams !== 'object') {
    return filters;
  }

  // Type Filter
  if (queryParams.type !== undefined && queryParams.type !== null && queryParams.type !== '') {
    const typeStr = String(queryParams.type).toLowerCase().trim();
    if (!ALLOWED_CONTENT_TYPES.has(typeStr)) {
      throw new ValidationError(
        `Invalid 'type' filter: '${queryParams.type}'. Allowed values are: 'movie', 'series'.`
      );
    }
    filters.type = typeStr;
  }

  // Genre Filter
  if (queryParams.genre !== undefined && queryParams.genre !== null && queryParams.genre !== '') {
    const genreStr = String(queryParams.genre).trim();
    if (genreStr.length > 50) {
      throw new ValidationError("The 'genre' filter must not exceed 50 characters.");
    }
    filters.genre = genreStr;
  }

  // Limit Filter
  if (queryParams.limit !== undefined && queryParams.limit !== null && queryParams.limit !== '') {
    const parsedLimit = Number(queryParams.limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
      throw new ValidationError("The 'limit' parameter must be a positive integer greater than or equal to 1.");
    }
    if (parsedLimit > MAX_LIMIT) {
      throw new ValidationError(`The 'limit' parameter cannot exceed ${MAX_LIMIT}.`);
    }
    filters.limit = parsedLimit;
  }

  return filters;
}
