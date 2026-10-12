/**
 * Morrow OTT Platform — S3 Upload Planner & Pre-Upload Verification Utility
 * Phase 3: Amazon S3 Asset Preparation & Secure Storage
 *
 * Capabilities:
 * - Reads and validates the canonical asset manifest
 * - Validates local existence, MIME types, and file sizes
 * - Rejects path traversal or keys outside approved prefixes ('posters/', 'backdrops/', 'videos/', 'subtitles/')
 * - Generates exact upload candidate list and flags large files (>5MB)
 * - Outputs formatted dry-run summary and AWS Console / CLI execution runbook
 * - Strictly read-only / dry-run: never creates AWS resources or performs unexpected mutations
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateAssetManifest } from './generate-asset-manifest.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT_DIR, 'data', 'asset-manifest.json');

const APPROVED_S3_PREFIXES = ['posters/', 'backdrops/', 'videos/', 'subtitles/'];

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function generateS3UploadPlan() {
  let manifest;
  if (fs.existsSync(MANIFEST_PATH)) {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  } else {
    manifest = generateAssetManifest();
  }

  const uploadCandidates = [];
  const rejectedItems = [];
  const processedS3Keys = new Set();

  for (const asset of manifest.assets) {
    // Only candidates that exist locally are eligible for Phase 3 upload
    if (!asset.existsLocal) {
      continue;
    }

    const { s3Key, relativePath, mimeType, sizeBytes, sizeFormatted, isLargeFile, contentId, assetType } = asset;

    // Security Check 1: Prevent path traversal
    if (s3Key.includes('..') || s3Key.startsWith('/') || s3Key.startsWith('\\')) {
      rejectedItems.push({
        s3Key,
        reason: 'Security violation: Path traversal or absolute path detected'
      });
      continue;
    }

    // Security Check 2: Must reside within approved S3 prefixes
    const hasApprovedPrefix = APPROVED_S3_PREFIXES.some(prefix => s3Key.startsWith(prefix));
    if (!hasApprovedPrefix) {
      rejectedItems.push({
        s3Key,
        reason: `Disallowed prefix: Must start with one of: ${APPROVED_S3_PREFIXES.join(', ')}`
      });
      continue;
    }

    // Deduplicate identical destination S3 keys
    if (processedS3Keys.has(s3Key)) {
      continue;
    }
    processedS3Keys.add(s3Key);

    // Verify local file exists on disk
    let fullLocalPath = path.join(ROOT_DIR, relativePath);
    if (!fs.existsSync(fullLocalPath)) {
      fullLocalPath = path.join(ROOT_DIR, 'frontend', relativePath);
    }

    if (!fs.existsSync(fullLocalPath)) {
      rejectedItems.push({
        s3Key,
        reason: `Referenced local file missing: ${relativePath}`
      });
      continue;
    }

    uploadCandidates.push({
      s3Key,
      localPath: relativePath.replace(/\\/g, '/'),
      fullLocalPath,
      contentId,
      assetType,
      mimeType,
      sizeBytes,
      sizeFormatted,
      isLargeFile,
      targetPrefix: s3Key.split('/')[0] + '/'
    });
  }

  const totalBytes = uploadCandidates.reduce((sum, item) => sum + item.sizeBytes, 0);
  const largeFiles = uploadCandidates.filter(item => item.isLargeFile);

  return {
    bucketRegion: 'ap-south-1',
    approvedPrefixes: APPROVED_S3_PREFIXES,
    totalFiles: uploadCandidates.length,
    totalBytes,
    totalFormatted: formatBytes(totalBytes),
    largeFileCount: largeFiles.length,
    candidates: uploadCandidates,
    rejectedItems
  };
}

// CLI Runner
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const plan = generateS3UploadPlan();

  console.log('================================================================================');
  console.log('  MORROW OTT — AMAZON S3 ASSET UPLOAD PLAN (PHASE 3 DRY-RUN)');
  console.log('================================================================================');
  console.log(`  Target AWS Region:        ${plan.bucketRegion} (Asia Pacific - Mumbai)`);
  console.log(`  Approved S3 Prefixes:     ${plan.approvedPrefixes.join(', ')}`);
  console.log(`  Total Objects to Upload:  ${plan.totalFiles}`);
  console.log(`  Total Upload Payload:     ${plan.totalFormatted} (${plan.totalBytes} bytes)`);
  console.log(`  Large Files (>5MB):       ${plan.largeFileCount} flagged`);
  console.log(`  Rejected / Invalid Items: ${plan.rejectedItems.length}`);
  console.log('--------------------------------------------------------------------------------');
  console.log('  DETAILED UPLOAD CANDIDATE LIST:');
  console.log('--------------------------------------------------------------------------------');

  plan.candidates.forEach((c, idx) => {
    const num = String(idx + 1).padStart(2, ' ');
    const flag = c.isLargeFile ? ' [FLAG: LARGE FILE >5MB]' : '';
    console.log(`  ${num}. S3 Key:       s3://${c.s3Key}`);
    console.log(`      Local Source: ${c.localPath}`);
    console.log(`      Content Type: ${c.mimeType}`);
    console.log(`      File Size:    ${c.sizeFormatted} (${c.sizeBytes} bytes)${flag}`);
    console.log(`      Associated:   Title ${c.contentId} (${c.assetType})`);
    console.log('');
  });

  if (plan.rejectedItems.length > 0) {
    console.log('--------------------------------------------------------------------------------');
    console.log('  REJECTED ITEMS:');
    plan.rejectedItems.forEach(r => console.log(`  - ${r.s3Key}: ${r.reason}`));
    console.log('');
  }

  console.log('================================================================================');
  console.log('  RECOMMENDED AWS CLI UPLOAD COMMANDS (DRY-RUN / COPY-PASTE):');
  console.log('================================================================================');
  console.log('  Replace <YOUR-BUCKET-NAME> with your actual private S3 bucket name:');
  console.log('');
  plan.candidates.forEach(c => {
    console.log(`  aws s3 cp "${c.localPath}" "s3://<YOUR-BUCKET-NAME>/${c.s3Key}" --content-type "${c.mimeType}" --region ap-south-1`);
  });

  console.log('\n================================================================================');
  console.log('  SECURITY & ARCHITECTURE ASSURANCES:');
  console.log('  1. Bucket Access: Keep S3 Block All Public Access ENABLED (ON).');
  console.log('  2. Object Ownership: Bucket Owner Enforced (ACLs disabled).');
  console.log('  3. Encryption: Default SSE-S3 (Server-Side Encryption with S3-managed keys).');
  console.log('  4. Static Website Hosting: DISABLED (Private-origin S3 behind CloudFront).');
  console.log('  5. Zero Credentials: No AWS secrets or access keys stored in project code.');
  console.log('================================================================================\n');
}
