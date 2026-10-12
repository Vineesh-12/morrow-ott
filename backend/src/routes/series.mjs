/**
 * Morrow OTT Platform — Series Episodes Route
 * GET /api/series/{id}/episodes
 */

import { getCatalogueRepository } from '../repository/catalogueRepository.mjs';
import { createSuccessResponse, createErrorResponse } from '../utils/response.mjs';
import { validateId } from '../utils/validator.mjs';

/**
 * Handles GET /api/series/{id}/episodes
 * Returns episodes for a series ordered deterministically by season and episode number.
 *
 * @param {Object} event - API Gateway HTTP API v2 event
 * @param {string} rawId - Series ID extracted from path
 * @returns {Promise<Object>} API Gateway proxy response
 */
export async function handleListSeriesEpisodes(event, rawId) {
  const validatedId = validateId(rawId, 'seriesId');
  const repository = getCatalogueRepository();

  const result = await repository.listEpisodesBySeriesId(validatedId);

  if (!result) {
    return createErrorResponse(
      'SERIES_NOT_FOUND',
      `The requested series with ID '${validatedId}' was not found.`,
      404
    );
  }

  if (!result.isSeries) {
    return createErrorResponse(
      'INVALID_CONTENT_TYPE',
      `Title '${validatedId}' is a movie, not a series. Episodes are only available for series content.`,
      400
    );
  }

  return createSuccessResponse(result.episodes, 200);
}
