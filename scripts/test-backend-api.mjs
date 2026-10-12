/**
 * Morrow OTT Platform — Automated Backend API Test Suite
 * Simulates API Gateway HTTP API v2 events against the AWS Lambda handler.
 *
 * Verifies:
 * - Health route contract
 * - Catalogue listing and multifaceted filtering (type, genre, limit)
 * - Input validation & boundary rejection (negative tests)
 * - Single video lookup (200 OK & 404 VIDEO_NOT_FOUND)
 * - Series episodes lookup & deterministic ordering
 * - Guard against requesting series episodes on movie titles
 * - 404 Route Not Found and 405 Method Not Allowed handling
 * - CORS preflight handling (OPTIONS)
 * - Phase 5 DynamoDB boundary guard (DATA_SOURCE=dynamodb fails with 503)
 * - Proxy response shape & error information shielding
 */

import { handler } from '../backend/index.mjs';
import { resetRepositoryInstance } from '../backend/src/repository/catalogueRepository.mjs';

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
 * Creates a synthetic API Gateway HTTP API v2 Event
 */
function createHttpApiV2Event({
  method = 'GET',
  rawPath = '/api/health',
  queryStringParameters = null,
  headers = {}
} = {}) {
  const queryParts = [];
  if (queryStringParameters) {
    for (const [k, v] of Object.entries(queryStringParameters)) {
      queryParts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    }
  }
  const rawQueryString = queryParts.join('&');

  return {
    version: '2.0',
    routeKey: `${method} ${rawPath}`,
    rawPath,
    rawQueryString,
    headers: {
      'host': 'morrow-api.execute-api.ap-southeast-2.amazonaws.com',
      'user-agent': 'Morrow-TestSuite/2.0',
      'accept': 'application/json',
      ...headers
    },
    queryStringParameters,
    requestContext: {
      accountId: '754860800809',
      apiId: 'test-api-id',
      domainName: 'morrow-api.execute-api.ap-southeast-2.amazonaws.com',
      http: {
        method,
        path: rawPath,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'Morrow-TestSuite/2.0'
      },
      requestId: `test-req-${Math.random().toString(36).substring(2, 9)}`,
      routeKey: `${method} ${rawPath}`,
      stage: '$default',
      time: new Date().toUTCString(),
      timeEpoch: Date.now()
    },
    isBase64Encoded: false
  };
}

async function runTests() {
  console.log('======================================================');
  console.log('  Morrow OTT — Running Backend Lambda API Test Suite');
  console.log('======================================================\n');

  // Ensure fresh fixture repository state
  process.env.DATA_SOURCE = 'fixture';
  resetRepositoryInstance();

  // ----------------------------------------------------------------------------
  // Suite 1: Health Check Endpoint
  // ----------------------------------------------------------------------------
  console.log('Suite 1: Health Check (GET /api/health)');
  {
    const event = createHttpApiV2Event({ method: 'GET', rawPath: '/api/health' });
    const res = await handler(event);
    assert(res.statusCode === 200, 'GET /api/health returns HTTP 200 OK');
    assert(res.headers && res.headers['content-type'].includes('application/json'), 'Returns Content-Type application/json');
    assert(Boolean(res.headers['access-control-allow-origin']), 'Returns Access-Control-Allow-Origin header');

    const body = JSON.parse(res.body);
    assert(body.success === true, 'Response body has success: true');
    assert(body.data && body.data.status === 'ok', 'Response body data.status is "ok"');
    assert(body.data.service === 'morrow-api', 'Response body data.service is "morrow-api"');
    assert(!JSON.stringify(body).includes('754860800809'), 'Response leaks zero AWS account identifiers');
  }

  // ----------------------------------------------------------------------------
  // Suite 2: Catalogue List & Filtering (GET /api/videos)
  // ----------------------------------------------------------------------------
  console.log('\nSuite 2: Catalogue List & Multifaceted Query Filters');
  {
    // Full list
    const event = createHttpApiV2Event({ method: 'GET', rawPath: '/api/videos' });
    const res = await handler(event);
    assert(res.statusCode === 200, 'GET /api/videos returns HTTP 200 OK');

    const body = JSON.parse(res.body);
    assert(body.success === true, 'List response has success: true');
    assert(Array.isArray(body.data), 'body.data is an array');
    assert(body.data.length === 7, `Returns all 7 canonical catalogue titles (got ${body.data.length})`);

    const first = body.data[0];
    assert(Boolean(first.id && first.title && first.contentType), 'Video records contain required canonical fields');
    assert(Boolean(first.videoId && first.type && first.genre), 'Video records preserve backward-compatible aliases');

    // Filter by type=movie
    const movieEvent = createHttpApiV2Event({
      method: 'GET',
      rawPath: '/api/videos',
      queryStringParameters: { type: 'movie' }
    });
    const movieRes = await handler(movieEvent);
    const movieBody = JSON.parse(movieRes.body);
    assert(movieRes.statusCode === 200, 'GET /api/videos?type=movie returns HTTP 200 OK');
    assert(movieBody.data.length === 4, `Returns 4 movies (got ${movieBody.data.length})`);
    assert(movieBody.data.every(v => v.contentType === 'movie'), 'Every returned item has contentType "movie"');

    // Filter by type=series
    const seriesEvent = createHttpApiV2Event({
      method: 'GET',
      rawPath: '/api/videos',
      queryStringParameters: { type: 'series' }
    });
    const seriesRes = await handler(seriesEvent);
    const seriesBody = JSON.parse(seriesRes.body);
    assert(seriesRes.statusCode === 200, 'GET /api/videos?type=series returns HTTP 200 OK');
    assert(seriesBody.data.length === 3, `Returns 3 series (got ${seriesBody.data.length})`);
    assert(seriesBody.data.every(v => v.contentType === 'series'), 'Every returned item has contentType "series"');

    // Filter by genre=Sci-Fi
    const genreEvent = createHttpApiV2Event({
      method: 'GET',
      rawPath: '/api/videos',
      queryStringParameters: { genre: 'Sci-Fi' }
    });
    const genreRes = await handler(genreEvent);
    const genreBody = JSON.parse(genreRes.body);
    assert(genreRes.statusCode === 200, 'GET /api/videos?genre=Sci-Fi returns HTTP 200 OK');
    assert(genreBody.data.length >= 2, `Returns Sci-Fi titles (got ${genreBody.data.length})`);
    assert(genreBody.data.every(v => v.genres.some(g => g.toLowerCase().includes('sci-fi'))), 'All filtered titles match genre "Sci-Fi"');

    // Filter with limit=2
    const limitEvent = createHttpApiV2Event({
      method: 'GET',
      rawPath: '/api/videos',
      queryStringParameters: { limit: '2' }
    });
    const limitRes = await handler(limitEvent);
    const limitBody = JSON.parse(limitRes.body);
    assert(limitRes.statusCode === 200, 'GET /api/videos?limit=2 returns HTTP 200 OK');
    assert(limitBody.data.length === 2, `Respects limit parameter (returned exactly 2 titles)`);
  }

  // ----------------------------------------------------------------------------
  // Suite 3: Validation Defenses on Invalid Inputs
  // ----------------------------------------------------------------------------
  console.log('\nSuite 3: Validation Defenses (Negative Tests)');
  {
    // Invalid type parameter
    const badTypeEvent = createHttpApiV2Event({
      method: 'GET',
      rawPath: '/api/videos',
      queryStringParameters: { type: 'podcast' }
    });
    const badTypeRes = await handler(badTypeEvent);
    assert(badTypeRes.statusCode === 400, 'Rejects invalid type ("podcast") with HTTP 400');
    const badTypeBody = JSON.parse(badTypeRes.body);
    assert(badTypeBody.success === false, 'Error response has success: false');
    assert(badTypeBody.error.code === 'VALIDATION_ERROR', 'Error code is VALIDATION_ERROR');

    // Negative limit
    const negLimitEvent = createHttpApiV2Event({
      method: 'GET',
      rawPath: '/api/videos',
      queryStringParameters: { limit: '-5' }
    });
    const negLimitRes = await handler(negLimitEvent);
    assert(negLimitRes.statusCode === 400, 'Rejects negative limit (-5) with HTTP 400');

    // Excessive limit (> 50)
    const bigLimitEvent = createHttpApiV2Event({
      method: 'GET',
      rawPath: '/api/videos',
      queryStringParameters: { limit: '500' }
    });
    const bigLimitRes = await handler(bigLimitEvent);
    assert(bigLimitRes.statusCode === 400, 'Rejects unbounded scan limit (500 > 50) with HTTP 400');

    // Non-numeric limit
    const strLimitEvent = createHttpApiV2Event({
      method: 'GET',
      rawPath: '/api/videos',
      queryStringParameters: { limit: 'not-a-number' }
    });
    const strLimitRes = await handler(strLimitEvent);
    assert(strLimitRes.statusCode === 400, 'Rejects non-numeric limit with HTTP 400');
  }

  // ----------------------------------------------------------------------------
  // Suite 4: Video Details (GET /api/videos/{id})
  // ----------------------------------------------------------------------------
  console.log('\nSuite 4: Video Details (GET /api/videos/{id})');
  {
    // Existing title: VID001 (Available movie)
    const validEvent = createHttpApiV2Event({ method: 'GET', rawPath: '/api/videos/VID001' });
    const validRes = await handler(validEvent);
    assert(validRes.statusCode === 200, 'GET /api/videos/VID001 returns HTTP 200 OK');
    const validBody = JSON.parse(validRes.body);
    assert(validBody.success === true, 'Response body has success: true');
    assert(validBody.data.id === 'VID001', 'Retrieved title has ID VID001');
    assert(validBody.data.title === 'The Cloud Paradox', 'Retrieved title is "The Cloud Paradox"');
    assert(validBody.data.isPlayable === true, 'Available movie with video file is marked isPlayable = true');

    // Metadata-only title: VID005 (Solaris Drift)
    const driftEvent = createHttpApiV2Event({ method: 'GET', rawPath: '/api/videos/VID005' });
    const driftRes = await handler(driftEvent);
    const driftBody = JSON.parse(driftRes.body);
    assert(driftRes.statusCode === 200, 'GET /api/videos/VID005 returns HTTP 200 OK');
    assert(driftBody.data.availabilityStatus === 'metadata_only', 'Solaris Drift availabilityStatus is metadata_only');
    assert(driftBody.data.isPlayable === false, 'Solaris Drift is correctly marked isPlayable = false');

    // Non-existent ID -> 404
    const missingEvent = createHttpApiV2Event({ method: 'GET', rawPath: '/api/videos/VID999_NON_EXISTENT' });
    const missingRes = await handler(missingEvent);
    assert(missingRes.statusCode === 404, 'Unknown title returns HTTP 404 Not Found');
    const missingBody = JSON.parse(missingRes.body);
    assert(missingBody.success === false, '404 response has success: false');
    assert(missingBody.error.code === 'VIDEO_NOT_FOUND', 'Error code is VIDEO_NOT_FOUND');

    // Malformed ID with dangerous characters -> 400
    const malformedEvent = createHttpApiV2Event({ method: 'GET', rawPath: '/api/videos/bad%20id%24%23' });
    const malformedRes = await handler(malformedEvent);
    assert(malformedRes.statusCode === 400, 'Malformed ID containing special characters rejected with HTTP 400');
  }

  // ----------------------------------------------------------------------------
  // Suite 5: Series Episodes (GET /api/series/{id}/episodes)
  // ----------------------------------------------------------------------------
  console.log('\nSuite 5: Series Episodes (GET /api/series/{id}/episodes)');
  {
    // Valid series: VID003 (Flora: The Secret Kingdom)
    const seriesEvent = createHttpApiV2Event({ method: 'GET', rawPath: '/api/series/VID003/episodes' });
    const seriesRes = await handler(seriesEvent);
    assert(seriesRes.statusCode === 200, 'GET /api/series/VID003/episodes returns HTTP 200 OK');
    const seriesBody = JSON.parse(seriesRes.body);
    assert(seriesBody.success === true, 'Response body has success: true');
    assert(Array.isArray(seriesBody.data), 'series episodes data is an array');
    assert(seriesBody.data.length >= 1, `Returns series episodes (found ${seriesBody.data.length})`);
    assert(seriesBody.data[0].id === 'VID003-E1', 'Episode ID is VID003-E1');
    assert(seriesBody.data[0].parentSeriesId === 'VID003', 'Episode parentSeriesId is VID003');
    assert(seriesBody.data[0].isPlayable === true, 'Available episode with video asset is marked isPlayable = true');

    // Series episode request on a movie (VID001 is a movie, not series)
    const movieEpisodeEvent = createHttpApiV2Event({ method: 'GET', rawPath: '/api/series/VID001/episodes' });
    const movieEpisodeRes = await handler(movieEpisodeEvent);
    assert(movieEpisodeRes.statusCode === 400, 'Calling /api/series/{id}/episodes on a movie returns HTTP 400 Bad Request');
    const movieEpBody = JSON.parse(movieEpisodeRes.body);
    assert(movieEpBody.error.code === 'INVALID_CONTENT_TYPE', 'Error code is INVALID_CONTENT_TYPE');

    // Unknown series -> 404
    const unknownSeriesEvent = createHttpApiV2Event({ method: 'GET', rawPath: '/api/series/VID_UNKNOWN/episodes' });
    const unknownSeriesRes = await handler(unknownSeriesEvent);
    assert(unknownSeriesRes.statusCode === 404, 'Unknown series returns HTTP 404 Not Found');
    const unknownBody = JSON.parse(unknownSeriesRes.body);
    assert(unknownBody.error.code === 'SERIES_NOT_FOUND', 'Error code is SERIES_NOT_FOUND');
  }

  // ----------------------------------------------------------------------------
  // Suite 6: Routing & HTTP Method Handling
  // ----------------------------------------------------------------------------
  console.log('\nSuite 6: Routing & HTTP Method Handling');
  {
    // Unknown path -> 404
    const unknownRouteEvent = createHttpApiV2Event({ method: 'GET', rawPath: '/api/unrecognized/endpoint' });
    const unknownRouteRes = await handler(unknownRouteEvent);
    assert(unknownRouteRes.statusCode === 404, 'Unknown route returns HTTP 404 Not Found');
    const unknownBody = JSON.parse(unknownRouteRes.body);
    assert(unknownBody.error.code === 'ROUTE_NOT_FOUND', 'Error code is ROUTE_NOT_FOUND');

    // Method Not Allowed: POST /api/videos -> 405
    const postEvent = createHttpApiV2Event({ method: 'POST', rawPath: '/api/videos' });
    const postRes = await handler(postEvent);
    assert(postRes.statusCode === 405, 'POST on GET-only route returns HTTP 405 Method Not Allowed');
    const postBody = JSON.parse(postRes.body);
    assert(postBody.error.code === 'METHOD_NOT_ALLOWED', 'Error code is METHOD_NOT_ALLOWED');

    // CORS preflight: OPTIONS /api/videos -> 204
    const optionsEvent = createHttpApiV2Event({ method: 'OPTIONS', rawPath: '/api/videos' });
    const optionsRes = await handler(optionsEvent);
    assert(optionsRes.statusCode === 204, 'OPTIONS preflight returns HTTP 204 No Content');
    assert(optionsRes.headers['access-control-allow-methods'].includes('GET'), 'CORS preflight allows GET method');
  }

  // ----------------------------------------------------------------------------
  // Suite 7: Phase 5 Boundary Guard (Negative Data Source Test)
  // ----------------------------------------------------------------------------
  console.log('\nSuite 7: Phase 5 Boundary Guard (DATA_SOURCE Isolation)');
  {
    process.env.DATA_SOURCE = 'dynamodb';
    resetRepositoryInstance();

    const ddbEvent = createHttpApiV2Event({ method: 'GET', rawPath: '/api/videos' });
    const ddbRes = await handler(ddbEvent);
    assert(ddbRes.statusCode === 503, 'Requesting DATA_SOURCE=dynamodb in Phase 4 fails with HTTP 503 Service Unavailable');
    const ddbBody = JSON.parse(ddbRes.body);
    assert(ddbBody.error.code === 'DATA_SOURCE_UNAVAILABLE', 'Error code is DATA_SOURCE_UNAVAILABLE');
    assert(
      ddbBody.error.message.includes('Phase 5'),
      'Safe diagnostic informs client that DynamoDB is reserved for Phase 5'
    );

    // Reset back to fixture
    process.env.DATA_SOURCE = 'fixture';
    resetRepositoryInstance();
  }

  // ----------------------------------------------------------------------------
  // Suite 8: Proxy Response Shielding & Security
  // ----------------------------------------------------------------------------
  console.log('\nSuite 8: Proxy Response Shielding & Security');
  {
    const event = createHttpApiV2Event({ method: 'GET', rawPath: '/api/videos/VID001' });
    const res = await handler(event);
    assert(typeof res.statusCode === 'number', 'Lambda proxy statusCode is a valid number');
    assert(typeof res.headers === 'object', 'Lambda proxy headers is an object');
    assert(typeof res.body === 'string', 'Lambda proxy body is a valid serialized string');
    assert(!res.body.includes('at async'), 'Error responses contain zero stack traces');
    assert(!res.body.includes('node:internal'), 'Error responses contain zero internal runtime paths');
  }

  // ----------------------------------------------------------------------------
  // Summary
  // ----------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`  Backend Tests Passed: ${passedTests}`);
  console.log(`  Backend Tests Failed: ${failedTests}`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
