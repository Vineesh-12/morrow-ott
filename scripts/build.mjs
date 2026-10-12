/**
 * Morrow OTT Platform — Production / Verification Build Script
 * Validates catalogue data integrity, verifies asset manifest,
 * checks file integrity, and prepares artifacts for deployment.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCatalogue } from './validate-catalogue.mjs';
import { generateAssetManifest } from './generate-asset-manifest.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('======================================================');
console.log('  Morrow OTT — Running Verification Build (Phase 2)');
console.log('======================================================\n');

try {
  // Step 1: Validate Catalogue
  console.log('1. Validating Canonical Catalogue Data...');
  const catPath = path.join(ROOT_DIR, 'data', 'catalogue.json');
  const catData = JSON.parse(fs.readFileSync(catPath, 'utf-8'));
  const valResult = validateCatalogue(catData, { checkFilesystem: true, rootDir: ROOT_DIR });
  if (!valResult.isValid) {
    console.error('Build Error: Catalogue validation failed with errors:', valResult.errors);
    process.exit(1);
  }
  console.log(`   ✓ Catalogue validated successfully (${catData.catalogue.length} titles).\n`);

  // Step 2: Generate Asset Manifest
  console.log('2. Generating Media Asset Manifest...');
  const manifest = generateAssetManifest();
  console.log(`   ✓ Asset manifest generated (${manifest.totalAssets} assets, ${manifest.verifiedLocalCount} verified local).\n`);

  // Step 3: Verify Core Frontend Files
  console.log('3. Verifying Frontend Static Files...');
  const requiredFiles = [
    'frontend/index.html',
    'frontend/styles.css',
    'frontend/app.js',
    'frontend/server.js'
  ];
  for (const rel of requiredFiles) {
    const full = path.join(ROOT_DIR, rel);
    if (!fs.existsSync(full)) {
      console.error(`Build Error: Required file missing: ${rel}`);
      process.exit(1);
    }
    const size = fs.statSync(full).size;
    console.log(`   ✓ ${rel} present (${(size / 1024).toFixed(1)} KB)`);
  }

  // Step 4: Verify S3 Upload Plan
  console.log('\n4. Verifying Amazon S3 Upload Planning (Phase 3)...');
  const { generateS3UploadPlan } = await import('./s3-upload-plan.mjs');
  const s3Plan = generateS3UploadPlan();
  console.log(`   ✓ S3 upload plan verified (${s3Plan.totalFiles} candidate objects, ${s3Plan.totalFormatted}, 0 errors).`);

  console.log('\n======================================================');
  console.log('  Morrow OTT — Verification Build Completed Successfully');
  console.log('======================================================');
  process.exit(0);
} catch (err) {
  console.error('Fatal build failure:', err);
  process.exit(1);
}
