/**
 * Morrow OTT Platform — API Gateway HTTP API v2 Dispatcher
 * Processes HTTP requests, validates routes, dispatches to route controllers,
 * and formats standardized proxy responses with structured CloudWatch logging.
 */

import { handleHealthRoute } from './routes/health.mjs';
import { handleListVideos, handleGetVideoById } from './routes/videos.mjs';
import { handleListSeriesEpisodes } from './routes/series.mjs';
import {
  createErrorResponse,
  createCorsPreflightResponse
} from './utils/response.mjs';
import { ValidationError } from './utils/validator.mjs';
import { DataSourceUnavailableError } from './repository/catalogueRepository.mjs';

/**
 * Normalizes request path by removing trailing slash (unless root)
 * and stripping any API Gateway stage prefix if present.
 * @param {string} rawPath
 * @returns {string} Clean path e.g. '/api/videos'
 */
function normalizePath(rawPath = '') {
  let clean = rawPath.split('?')[0].trim();
  if (!clean.startsWith('/')) clean = '/' + clean;
  // If path begins with an arbitrary stage prefix, extract /api/*
  const apiIndex = clean.indexOf('/api/');
  if (apiIndex !== -1) {
    clean = clean.substring(apiIndex);
  }
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  return clean;
}

/**
 * Main Lambda execution handler for API Gateway HTTP API v2.
 * @param {Object} event - API Gateway HTTP API payload v2.0
 * @param {Object} [context={}] - AWS Lambda execution context
 * @returns {Promise<Object>} API Gateway HTTP API v2 proxy response
 */
export async function apiHandler(event = {}, context = {}) {
  const startTime = Date.now();
  const requestId = event.requestContext?.requestId || context.awsRequestId || 'local-req';

  // Extract HTTP method and path
  const method = (
    event.requestContext?.http?.method ||
    event.httpMethod ||
    'GET'
  ).toUpperCase();

  const rawPath = event.rawPath || event.path || '/';
  const path = normalizePath(rawPath);

  // Structured Request Log (no sensitive payload or auth tokens)
  console.log(JSON.stringify({
    level: 'INFO',
    type: 'REQUEST',
    method,
    path,
    requestId,
    timestamp: new Date().toISOString()
  }));

  let response;

  try {
    // 1. CORS Preflight Handling
    if (method === 'OPTIONS') {
      response = createCorsPreflightResponse();
      logResponse(method, path, response.statusCode, startTime, requestId);
      return response;
    }

    // 2. Health Route: GET /api/health
    if (path === '/api/health') {
      if (method !== 'GET') {
        response = createErrorResponse(
          'METHOD_NOT_ALLOWED',
          `Method ${method} not allowed on /api/health. Supported methods: GET.`,
          405
        );
      } else {
        response = await handleHealthRoute(event);
      }
      logResponse(method, path, response.statusCode, startTime, requestId);
      return response;
    }

    // 3. Videos Collection Route: GET /api/videos
    if (path === '/api/videos') {
      if (method !== 'GET') {
        response = createErrorResponse(
          'METHOD_NOT_ALLOWED',
          `Method ${method} not allowed on /api/videos. Supported methods: GET.`,
          405
        );
      } else {
        response = await handleListVideos(event);
      }
      logResponse(method, path, response.statusCode, startTime, requestId);
      return response;
    }

    // 4. Series Episodes Route: GET /api/series/{id}/episodes
    const seriesEpisodesMatch = path.match(/^\/api\/series\/([^\/]+)\/episodes$/);
    if (seriesEpisodesMatch) {
      if (method !== 'GET') {
        response = createErrorResponse(
          'METHOD_NOT_ALLOWED',
          `Method ${method} not allowed. Supported methods: GET.`,
          405
        );
      } else {
        const seriesId = seriesEpisodesMatch[1];
        response = await handleListSeriesEpisodes(event, seriesId);
      }
      logResponse(method, path, response.statusCode, startTime, requestId);
      return response;
    }

    // 5. Video Detail Route: GET /api/videos/{id}
    const videoDetailMatch = path.match(/^\/api\/videos\/([^\/]+)$/);
    if (videoDetailMatch) {
      if (method !== 'GET') {
        response = createErrorResponse(
          'METHOD_NOT_ALLOWED',
          `Method ${method} not allowed on /api/videos/{id}. Supported methods: GET.`,
          405
        );
      } else {
        const videoId = videoDetailMatch[1];
        response = await handleGetVideoById(event, videoId);
      }
      logResponse(method, path, response.statusCode, startTime, requestId);
      return response;
    }

    // 6. Unknown Route: HTTP 404
    response = createErrorResponse(
      'ROUTE_NOT_FOUND',
      `The requested resource '${path}' was not found on this API.`,
      404
    );
    logResponse(method, path, response.statusCode, startTime, requestId);
    return response;

  } catch (err) {
    if (err instanceof ValidationError) {
      response = createErrorResponse(err.code, err.message, err.statusCode);
      logResponse(method, path, response.statusCode, startTime, requestId, err.message);
      return response;
    }

    if (err instanceof DataSourceUnavailableError) {
      response = createErrorResponse(err.code, err.message, err.statusCode);
      logResponse(method, path, response.statusCode, startTime, requestId, err.message);
      return response;
    }

    if (err.name === 'DatabaseError' || err.code === 'TABLE_NOT_FOUND' || err.code === 'DATABASE_ACCESS_DENIED') {
      response = createErrorResponse(err.code || 'DATABASE_UNAVAILABLE', err.message, err.statusCode || 503);
      logResponse(method, path, response.statusCode, startTime, requestId, err.message);
      return response;
    }

    // Uncaught Internal Error — Do NOT leak stack trace or internal filesystem paths to client
    console.error(JSON.stringify({
      level: 'ERROR',
      type: 'EXCEPTION',
      errorName: err.name || 'Error',
      errorMessage: err.message,
      requestId,
      timestamp: new Date().toISOString()
    }));

    response = createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected internal server error occurred while processing the request.',
      500
    );
    logResponse(method, path, 500, startTime, requestId, err.message);
    return response;
  }
}

/**
 * Structured Response Logger for AWS CloudWatch
 */
function logResponse(method, path, statusCode, startTime, requestId, errorHint = null) {
  const latencyMs = Date.now() - startTime;
  const level = statusCode >= 500 ? 'ERROR' : (statusCode >= 400 ? 'WARN' : 'INFO');
  
  const payload = {
    level,
    type: 'RESPONSE',
    method,
    path,
    statusCode,
    latencyMs,
    requestId,
    timestamp: new Date().toISOString()
  };

  if (errorHint) {
    payload.error = errorHint;
  }

  console.log(JSON.stringify(payload));
}
