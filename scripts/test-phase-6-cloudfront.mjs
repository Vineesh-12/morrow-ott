/**
 * Morrow OTT Platform — Phase 6 Automated Test Suite
 * Validates CloudFront deployment readiness:
 * - Media URL resolution and canonical S3 prefix mapping
 * - Central catalogue API client behavior & defensive production isolation
 * - SPA route fallback CloudFront Function logic
 * - Production frontend build artifact staging & secret safety
 * - CloudFront dual-origin routing and OAC policy specification
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

let passedCount = 0;
let failedCount = 0;

function it(description, fn) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${description}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${description}`);
    console.error(`     Error: ${err.message}`);
    failedCount++;
  }
}

async function itAsync(description, fn) {
  try {
    await fn();
    console.log(`  ✓ [PASS] ${description}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${description}`);
    console.error(`     Error: ${err.message}`);
    failedCount++;
  }
}

console.log('======================================================');
console.log('  Morrow OTT — Running Phase 6 CloudFront Test Suite');
console.log('======================================================\n');

// ----------------------------------------------------------------------------
// Suite 1: Media Service URL Resolution & S3 Prefix Mapping
// ----------------------------------------------------------------------------
console.log('Suite 1: Media Service URL Resolution');
{
  // Mirror app.js mediaService.resolveUrl implementation for verification
  function resolveUrl(key) {
    if (!key) return '';
    if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('data:')) {
      return key;
    }
    let clean = key.replace(/^\/+/, '');
    if (clean.startsWith('media/thumbnails/')) {
      clean = clean.replace('media/thumbnails/', 'posters/');
    } else if (clean.startsWith('media/videos/')) {
      clean = clean.replace('media/videos/', 'videos/');
    } else if (clean.startsWith('media/subtitles/')) {
      clean = clean.replace('media/subtitles/', 'subtitles/');
    }
    return clean;
  }

  it('Maps legacy media/thumbnails/ path to canonical posters/ prefix', () => {
    assert.equal(resolveUrl('media/thumbnails/cloud-intro.svg'), 'posters/cloud-intro.svg');
  });

  it('Maps legacy media/videos/ path to canonical videos/ prefix', () => {
    assert.equal(resolveUrl('media/videos/cloud-intro.mp4'), 'videos/cloud-intro.mp4');
  });

  it('Maps legacy media/subtitles/ path to canonical subtitles/ prefix', () => {
    assert.equal(resolveUrl('media/subtitles/cloud-intro.en.vtt'), 'subtitles/cloud-intro.en.vtt');
  });

  it('Preserves already-canonical S3 object keys unchanged', () => {
    assert.equal(resolveUrl('posters/cloud-intro.svg'), 'posters/cloud-intro.svg');
    assert.equal(resolveUrl('videos/cloud-intro.mp4'), 'videos/cloud-intro.mp4');
    assert.equal(resolveUrl('backdrops/cloud-intro.svg'), 'backdrops/cloud-intro.svg');
  });

  it('Strips leading slashes safely without generating duplicate slashes', () => {
    assert.equal(resolveUrl('/videos/cloud-intro.mp4'), 'videos/cloud-intro.mp4');
    assert.equal(resolveUrl('///posters/cloud-intro.svg'), 'posters/cloud-intro.svg');
  });

  it('Preserves full HTTPS URLs without mutation', () => {
    const url = 'https://cdn.example.com/stream.mp4';
    assert.equal(resolveUrl(url), url);
  });

  it('Safely returns empty string for null or empty keys', () => {
    assert.equal(resolveUrl(''), '');
    assert.equal(resolveUrl(null), '');
    assert.equal(resolveUrl(undefined), '');
  });
}

// ----------------------------------------------------------------------------
// Suite 2: SPA Route Rewriter CloudFront Function
// ----------------------------------------------------------------------------
console.log('\nSuite 2: SPA Route Rewriter CloudFront Function');
{
  const fnPath = path.join(ROOT_DIR, 'scripts', 'cf-spa-function.js');
  const code = fs.readFileSync(fnPath, 'utf-8');

  // Evaluate the function in a sandboxed scope
  const cfHandler = new Function(`${code}; return handler;`)();

  it('Rewrites root URI / to /index.html', () => {
    const res = cfHandler({ request: { uri: '/' } });
    assert.equal(res.uri, '/index.html');
  });

  it('Rewrites directory trailing slash /movies/ to /index.html', () => {
    const res = cfHandler({ request: { uri: '/movies/' } });
    assert.equal(res.uri, '/index.html');
  });

  it('Rewrites extensionless deep-link /title/VID001 to /index.html', () => {
    const res = cfHandler({ request: { uri: '/title/VID001' } });
    assert.equal(res.uri, '/index.html');
  });

  it('Rewrites extensionless route /my-list to /index.html', () => {
    const res = cfHandler({ request: { uri: '/my-list' } });
    assert.equal(res.uri, '/index.html');
  });

  it('Leaves static files with extensions (/styles.css) unchanged', () => {
    const res = cfHandler({ request: { uri: '/styles.css' } });
    assert.equal(res.uri, '/styles.css');
  });

  it('Leaves image assets (/posters/cloud-intro.svg) unchanged', () => {
    const res = cfHandler({ request: { uri: '/posters/cloud-intro.svg' } });
    assert.equal(res.uri, '/posters/cloud-intro.svg');
  });

  it('Leaves video files (/videos/cloud-intro.mp4) unchanged', () => {
    const res = cfHandler({ request: { uri: '/videos/cloud-intro.mp4' } });
    assert.equal(res.uri, '/videos/cloud-intro.mp4');
  });
}

// ----------------------------------------------------------------------------
// Suite 3: Production Frontend Build Artifact Integrity
// ----------------------------------------------------------------------------
console.log('\nSuite 3: Production Frontend Build Artifact Integrity');
{
  const distDir = path.join(ROOT_DIR, 'dist', 'frontend');
  const indexPath = path.join(distDir, 'index.html');
  const cssPath = path.join(distDir, 'styles.css');
  const jsPath = path.join(distDir, 'app.js');

  it('dist/frontend/index.html exists and is non-empty', () => {
    assert(fs.existsSync(indexPath), 'index.html must exist in dist/frontend');
    assert(fs.statSync(indexPath).size > 10000, 'index.html size must exceed 10 KB');
  });

  it('dist/frontend/styles.css exists and is non-empty', () => {
    assert(fs.existsSync(cssPath), 'styles.css must exist in dist/frontend');
    assert(fs.statSync(cssPath).size > 10000, 'styles.css size must exceed 10 KB');
  });

  it('dist/frontend/app.js exists and is non-empty', () => {
    assert(fs.existsSync(jsPath), 'app.js must exist in dist/frontend');
    assert(fs.statSync(jsPath).size > 50000, 'app.js size must exceed 50 KB');
  });

  it('Frontend contains zero hardcoded API Gateway hostnames', () => {
    const jsContent = fs.readFileSync(jsPath, 'utf-8');
    assert(!jsContent.includes('.execute-api.'), 'Frontend must not hardcode execute-api hostnames');
  });

  it('Frontend contains zero AWS access keys or secret tokens', () => {
    const jsContent = fs.readFileSync(jsPath, 'utf-8');
    assert(!/AKIA[0-9A-Z]{16}/.test(jsContent), 'No AWS Access Key ID in frontend');
    assert(!/aws_secret_access_key/i.test(jsContent), 'No secret access key in frontend');
  });

  it('Frontend uses same-origin relative API path /api/videos', () => {
    const jsContent = fs.readFileSync(jsPath, 'utf-8');
    assert(jsContent.includes("fetch('/api/videos')"), 'Must use relative /api/videos call');
  });
}

// ----------------------------------------------------------------------------
// Suite 4: CloudFront Dual-Origin & OAC Specification
// ----------------------------------------------------------------------------
console.log('\nSuite 4: CloudFront Dual-Origin & OAC Specification');
{
  const cfConfigPath = path.join(ROOT_DIR, 'scripts', 'cloudfront-distribution.json');
  assert(fs.existsSync(cfConfigPath), 'cloudfront-distribution.json must exist');
  const cfConfig = JSON.parse(fs.readFileSync(cfConfigPath, 'utf-8'));

  it('Distribution defines exactly 2 origins', () => {
    assert.equal(cfConfig.Origins.Quantity, 2);
    assert.equal(cfConfig.Origins.Items.length, 2);
  });

  it('Origin 1 is S3 origin with OAC configured', () => {
    const s3Origin = cfConfig.Origins.Items.find(o => o.Id === 'MorrowS3Origin');
    assert(s3Origin, 'MorrowS3Origin must be present');
    assert(s3Origin.DomainName.includes('morrow-assets-vineesh-21cse362t.s3'), 'Points to correct S3 bucket');
    assert.equal(s3Origin.OriginAccessControlId, 'E3STZ204UN3KSM');
  });

  it('Origin 2 is API Gateway HTTP API custom origin', () => {
    const apiOrigin = cfConfig.Origins.Items.find(o => o.Id === 'MorrowHttpApi');
    assert(apiOrigin, 'MorrowHttpApi must be present');
    assert.equal(apiOrigin.DomainName, '2wz1iej67d.execute-api.ap-southeast-2.amazonaws.com');
    assert.equal(apiOrigin.CustomOriginConfig.OriginProtocolPolicy, 'https-only');
  });

  it('Default cache behavior targets S3 with redirect-to-https', () => {
    assert.equal(cfConfig.DefaultCacheBehavior.TargetOriginId, 'MorrowS3Origin');
    assert.equal(cfConfig.DefaultCacheBehavior.ViewerProtocolPolicy, 'redirect-to-https');
    assert(cfConfig.DefaultCacheBehavior.FunctionAssociations.Items.length > 0, 'Must have SPA CloudFront Function');
  });

  it('/api/* cache behavior targets API Gateway with CachingDisabled', () => {
    const apiBehavior = cfConfig.CacheBehaviors.Items.find(b => b.PathPattern === '/api/*');
    assert(apiBehavior, '/api/* behavior must exist');
    assert.equal(apiBehavior.TargetOriginId, 'MorrowHttpApi');
    assert.equal(apiBehavior.CachePolicyId, '4135ea2d-6df8-44a3-9df3-4b5a84be39ad'); // CachingDisabled
    assert.equal(apiBehavior.OriginRequestPolicyId, 'b689b0a8-53d0-40ab-baf2-68738e2966ac'); // AllViewerExceptHostHeader
  });

  it('S3 Bucket policy restricts access to CloudFront distribution via OAC', () => {
    const s3PolicyPath = path.join(ROOT_DIR, 'scripts', 's3-oac-policy.json');
    assert(fs.existsSync(s3PolicyPath), 's3-oac-policy.json must exist');
    const s3Policy = JSON.parse(fs.readFileSync(s3PolicyPath, 'utf-8'));
    assert.equal(s3Policy.Statement[0].Principal.Service, 'cloudfront.amazonaws.com');
    assert.equal(s3Policy.Statement[0].Action, 's3:GetObject');
    assert(s3Policy.Statement[0].Condition.StringEquals['AWS:SourceArn'].includes('E3CQS64ZH2JAM1'));
  });
}

// ----------------------------------------------------------------------------
// Summary
// ----------------------------------------------------------------------------
console.log('\n======================================================');
console.log(`  Phase 6 CloudFront Tests Passed: ${passedCount}`);
console.log(`  Phase 6 CloudFront Tests Failed: ${failedCount}`);
console.log('======================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
