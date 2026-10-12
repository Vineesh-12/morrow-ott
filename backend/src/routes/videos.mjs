/**
 * Morrow OTT Platform — Videos Catalogue Routes
 * GET /api/videos
 * GET /api/videos/{id}
 */

import { getCatalogueRepository } from '../repository/catalogueRepository.mjs';
import { createSuccessResponse, createErrorResponse } from '../utils/response.mjs';
import { validateId, validateVideoFilters } from '../utils/validator.mjs';

/**
 * Handles GET /api/videos
 * Returns catalogue titles matching optional filters (type, genre, limit).
 *
 * @param {Object} event - API Gateway HTTP API v2 event
 * @returns {Promise<Object>} API Gateway proxy response
 */
export async function handleListVideos(event) {
  const queryParams = event.queryStringParameters || {};
  const filters = validateVideoFilters(queryParams);
  const repository = getCatalogueRepository();

  const videos = await repository.listVideos(filters);
  return createSuccessResponse(videos, 200);
}

/**
 * Handles GET /api/videos/{id}
 * Returns a single canonical title by ID, or 404 Not Found if missing.
 *
 * @param {Object} event - API Gateway HTTP API v2 event
 * @param {string} rawId - ID extracted from path or pathParameters
 * @returns {Promise<Object>} API Gateway proxy response
 */
export async function handleGetVideoById(event, rawId) {
  const validatedId = validateId(rawId, 'id');
  const repository = getCatalogueRepository();

  const video = await repository.getVideoById(validatedId);
  if (!video) {
    return createErrorResponse(
      'VIDEO_NOT_FOUND',
      `The requested title with ID '${validatedId}' was not found.`,
      404
    );
  }

  return createSuccessResponse(video, 200);
}
