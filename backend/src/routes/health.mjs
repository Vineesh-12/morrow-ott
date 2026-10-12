/**
 * Morrow OTT Platform — Health Check Route
 * GET /api/health
 */

import { createSuccessResponse } from '../utils/response.mjs';

/**
 * Handles GET /api/health
 * Verifies that the Lambda function is alive and API Gateway can route to it.
 * Contains no secrets, internal file paths, or AWS account identifiers.
 *
 * @param {Object} event
 * @returns {Promise<Object>} API Gateway proxy response
 */
export async function handleHealthRoute(event) {
  return createSuccessResponse({
    status: 'ok',
    service: 'morrow-api'
  }, 200);
}
