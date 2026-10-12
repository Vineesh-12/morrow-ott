/**
 * Morrow OTT Platform — AWS Lambda Handler Entry Point
 * Configured in AWS Lambda Console as: index.handler
 * Supported Runtimes: Node.js 20.x / Node.js 22.x / Node.js 24.x (ES Module)
 */

import { apiHandler } from './src/handler.mjs';

/**
 * Standard AWS Lambda Handler
 * @param {Object} event - API Gateway HTTP API v2 Event
 * @param {Object} context - AWS Lambda Execution Context
 * @returns {Promise<Object>} API Gateway Proxy Response
 */
export const handler = async (event, context) => {
  return apiHandler(event, context);
};

export default handler;
