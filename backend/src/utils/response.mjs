/**
 * Morrow OTT Platform — API Gateway HTTP API v2 Response Formatter
 * Standardizes API responses for AWS Lambda proxy integrations.
 */

const DEFAULT_ORIGIN = process.env.CORS_ALLOW_ORIGIN || '*';

/**
 * Common CORS and security headers for API Gateway responses.
 */
export function getStandardHeaders(customHeaders = {}) {
  return {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': DEFAULT_ORIGIN,
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization, X-Requested-With',
    'access-control-max-age': '86400',
    'x-content-type-options': 'nosniff',
    ...customHeaders
  };
}

/**
 * Formats a successful API Gateway HTTP API v2 response.
 * @param {*} data - Payload to return inside { success: true, data }
 * @param {number} [statusCode=200] - HTTP status code
 * @param {Object} [customHeaders={}] - Additional response headers
 * @returns {Object} API Gateway HTTP API v2 compatible proxy response
 */
export function createSuccessResponse(data, statusCode = 200, customHeaders = {}) {
  return {
    statusCode,
    headers: getStandardHeaders(customHeaders),
    body: JSON.stringify({
      success: true,
      data
    })
  };
}

/**
 * Formats an error API Gateway HTTP API v2 response.
 * Ensures internal details, stack traces, and credentials are never leaked.
 * @param {string} code - Machine-readable error code (e.g. VIDEO_NOT_FOUND)
 * @param {string} message - Human-readable, safe error message
 * @param {number} [statusCode=400] - HTTP status code
 * @param {Object} [customHeaders={}] - Additional response headers
 * @returns {Object} API Gateway HTTP API v2 compatible proxy response
 */
export function createErrorResponse(code, message, statusCode = 400, customHeaders = {}) {
  return {
    statusCode,
    headers: getStandardHeaders(customHeaders),
    body: JSON.stringify({
      success: false,
      error: {
        code,
        message
      }
    })
  };
}

/**
 * Formats a CORS preflight (OPTIONS) response.
 * @param {Object} [customHeaders={}]
 * @returns {Object}
 */
export function createCorsPreflightResponse(customHeaders = {}) {
  return {
    statusCode: 204,
    headers: getStandardHeaders(customHeaders),
    body: ''
  };
}
