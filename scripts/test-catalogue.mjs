/**
 * Morrow OTT Platform — Automated Unit Test Suite
 * Tests catalogue integrity, validator accuracy on negative/invalid test fixtures,
 * normalizer backward compatibility, and asset manifest generation.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCatalogue } from './validate-catalogue.mjs';
import { normalizeTitle, normalizeCatalogue } from '../data/catalogue-adapter.js';
import { generateAssetManifest } from './generate-asset-manifest.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CATALOGUE_PATH = path.join(ROOT_DIR, 'data', 'catalogue.json');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    failedTests++;
  }
}

console.log('======================================================');
console.log('  Morrow OTT — Running Automated Catalogue Test Suite');
console.log('======================================================\n');

// ----------------------------------------------------------------------------
// Suite 1: Canonical Catalogue & Normalizer Tests
// ----------------------------------------------------------------------------
console.log('Suite 1: Canonical Catalogue & Normalizer');

const rawCatalogueData = JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf-8'));
const canonicalResult = validateCatalogue(rawCatalogueData, { checkFilesystem: true, rootDir: ROOT_DIR });
assert(canonicalResult.isValid === true, 'Canonical catalogue.json passes all 16 rules with 0 errors');
assert(canonicalResult.errors.length === 0, 'Canonical validation errors array is empty');

const sampleMovie = rawCatalogueData.catalogue.find(t => t.id === 'VID001');
const normalizedMovie = normalizeTitle(sampleMovie);

assert(normalizedMovie.id === 'VID001' && normalizedMovie.videoId === 'VID001', 'Normalizer maps both id and legacy videoId');
assert(normalizedMovie.contentType === 'movie' && normalizedMovie.type === 'movie', 'Normalizer maps contentType and legacy type');
assert(normalizedMovie.synopsis === normalizedMovie.description, 'Normalizer maps synopsis and legacy description');
assert(normalizedMovie.genres[0] === normalizedMovie.genre, 'Normalizer maps genres array and legacy singular genre');
assert(normalizedMovie.releaseYear === normalizedMovie.year, 'Normalizer maps releaseYear and legacy year');
assert(normalizedMovie.isPlayable === true, 'Available movie with verified video asset is marked isPlayable = true');

const sampleSeries = rawCatalogueData.catalogue.find(t => t.id === 'VID003');
const normalizedSeries = normalizeTitle(sampleSeries);
assert(Array.isArray(normalizedSeries.episodes) && normalizedSeries.episodes.length > 0, 'Normalizer flattens series seasons into episodes array');
assert(normalizedSeries.episodes[0].id === 'VID003-E1', 'Episode retains stable unique ID VID003-E1');
assert(normalizedSeries.episodes[0].isPlayable === true, 'Episode with verified asset is marked isPlayable = true');

const normalizedList = normalizeCatalogue(rawCatalogueData.catalogue);
assert(normalizedList.length === rawCatalogueData.catalogue.length, 'normalizeCatalogue successfully processes all items');

// ----------------------------------------------------------------------------
// Suite 2: Negative Validation Tests (Catches Deliberately Invalid Records)
// ----------------------------------------------------------------------------
console.log('\nSuite 2: Negative Fixture Tests (Validator Defenses)');

// Test: Missing ID
const badIdFixture = [{ title: 'No ID Film', contentType: 'movie', genres: ['Drama'], availabilityStatus: 'available' }];
const badIdResult = validateCatalogue(badIdFixture, { checkFilesystem: false });
assert(badIdResult.isValid === false && badIdResult.errors.some(e => e.rule === 1), 'Rule 1: Validator rejects record with missing ID');

// Test: Duplicate ID
const dupIdFixture = [
  { id: 'DUP001', title: 'Film 1', contentType: 'movie', genres: ['Drama'], availabilityStatus: 'available' },
  { id: 'DUP001', title: 'Film 2', contentType: 'movie', genres: ['Drama'], availabilityStatus: 'available' }
];
const dupIdResult = validateCatalogue(dupIdFixture, { checkFilesystem: false });
assert(dupIdResult.isValid === false && dupIdResult.errors.some(e => e.rule === 2), 'Rule 2: Validator detects duplicate title IDs');

// Test: Invalid contentType
const badTypeFixture = [{ id: 'TEST001', title: 'Invalid Type', contentType: 'podcast', genres: ['Talk'], availabilityStatus: 'available' }];
const badTypeResult = validateCatalogue(badTypeFixture, { checkFilesystem: false });
assert(badTypeResult.isValid === false && badTypeResult.errors.some(e => e.rule === 3), 'Rule 3: Validator rejects invalid contentType ("podcast")');

// Test: Empty genres
const badGenreFixture = [{ id: 'TEST002', title: 'No Genre', contentType: 'movie', genres: [], availabilityStatus: 'available' }];
const badGenreResult = validateCatalogue(badGenreFixture, { checkFilesystem: false });
assert(badGenreResult.isValid === false && badGenreResult.errors.some(e => e.rule === 4), 'Rule 4: Validator rejects empty genres array');

// Test: Negative duration
const badDurationFixture = [{ id: 'TEST003', title: 'Negative Runtime', contentType: 'movie', genres: ['Sci-Fi'], durationSeconds: -50, availabilityStatus: 'available' }];
const badDurationResult = validateCatalogue(badDurationFixture, { checkFilesystem: false });
assert(badDurationResult.isValid === false && badDurationResult.errors.some(e => e.rule === 5), 'Rule 5: Validator rejects negative durationSeconds');

// Test: Invalid releaseYear
const badYearFixture = [{ id: 'TEST004', title: 'Ancient Film', contentType: 'movie', genres: ['Drama'], releaseYear: 1820, availabilityStatus: 'available' }];
const badYearResult = validateCatalogue(badYearFixture, { checkFilesystem: false });
assert(badYearResult.isValid === false && badYearResult.errors.some(e => e.rule === 6), 'Rule 6: Validator rejects releaseYear outside 1900-2100');

// Test: Invalid availabilityStatus enum
const badStatusFixture = [{ id: 'TEST005', title: 'Unknown Status', contentType: 'movie', genres: ['Comedy'], availabilityStatus: 'in_theaters_only' }];
const badStatusResult = validateCatalogue(badStatusFixture, { checkFilesystem: false });
assert(badStatusResult.isValid === false && badStatusResult.errors.some(e => e.rule === 7), 'Rule 7: Validator rejects unrecognized availabilityStatus enum');

// Test: Episode with mismatched parentSeriesId
const brokenEpFixture = [
  {
    id: 'SERIES_A',
    title: 'Series A',
    contentType: 'series',
    genres: ['Mystery'],
    availabilityStatus: 'available',
    seasons: [
      {
        seasonNum: 1,
        episodes: [
          { id: 'EP_01', parentSeriesId: 'SERIES_WRONG', seasonNum: 1, episodeNum: 1, title: 'Ep 1', availabilityStatus: 'available' }
        ]
      }
    ]
  }
];
const brokenEpResult = validateCatalogue(brokenEpFixture, { checkFilesystem: false });
assert(brokenEpResult.isValid === false && brokenEpResult.errors.some(e => e.rule === 8), 'Rule 8: Validator detects episode referencing wrong parentSeriesId');

// Test: Available title with missing local playback asset
const missingAssetFixture = [
  {
    id: 'PHANTOM01',
    title: 'Phantom Movie',
    contentType: 'movie',
    genres: ['Action'],
    availabilityStatus: 'available',
    videoKey: 'media/videos/non-existent-ghost-file.mp4'
  }
];
const missingAssetResult = validateCatalogue(missingAssetFixture, { checkFilesystem: true, rootDir: ROOT_DIR });
assert(missingAssetResult.isValid === false && missingAssetResult.errors.some(e => e.rule === 13), 'Rule 13: Validator detects title marked "available" whose local video file does not exist');

// ----------------------------------------------------------------------------
// Suite 3: Asset Manifest Tests
// ----------------------------------------------------------------------------
console.log('\nSuite 3: Asset Manifest Verification');

const manifest = generateAssetManifest();
assert(manifest.totalAssets > 0, `Asset manifest contains entries (Total: ${manifest.totalAssets})`);
assert(manifest.verifiedLocalCount > 0, `Verified local assets exist on disk (Verified: ${manifest.verifiedLocalCount})`);
assert(manifest.missingLocalCount === 0, 'No assets required for available titles are missing locally');
assert(manifest.plannedRemoteCount > 0, `Planned remote assets recorded for upcoming titles (Planned: ${manifest.plannedRemoteCount})`);

// ----------------------------------------------------------------------------
// Suite 4: Phase 3 S3 Asset Planning & Prefix Validation
// ----------------------------------------------------------------------------
console.log('\nSuite 4: S3 Asset Planning & Security Validation (Phase 3)');

import { generateS3UploadPlan } from './s3-upload-plan.mjs';
const s3Plan = generateS3UploadPlan();
assert(s3Plan.totalFiles === 12, `S3 upload plan identifies exactly 12 destination objects (Found: ${s3Plan.totalFiles})`);
assert(s3Plan.rejectedItems.length === 0, 'S3 upload plan contains zero rejected or invalid items');
assert(s3Plan.candidates.every(c => s3Plan.approvedPrefixes.some(p => c.s3Key.startsWith(p))), 'Every candidate maps to an approved prefix (posters/, backdrops/, videos/, subtitles/)');
assert(s3Plan.candidates.every(c => !c.s3Key.includes('..') && !c.s3Key.startsWith('/')), 'Zero path traversal or absolute keys detected in S3 candidate list');
assert(s3Plan.candidates.filter(c => c.targetPrefix === 'videos/').every(c => c.mimeType === 'video/mp4'), 'All video upload candidates have verified video/mp4 MIME type');
assert(s3Plan.candidates.filter(c => c.targetPrefix === 'posters/' || c.targetPrefix === 'backdrops/').every(c => c.mimeType === 'image/svg+xml'), 'All poster/backdrop candidates have verified image/svg+xml MIME type');
assert(s3Plan.largeFileCount === 2, `Large files (>5MB) correctly flagged for multipart upload awareness (Flagged: ${s3Plan.largeFileCount})`);
assert(s3Plan.totalBytes < 50 * 1024 * 1024, `Total proposed demo payload is within lightweight academic threshold (Actual: ${s3Plan.totalFormatted})`);

// ----------------------------------------------------------------------------
// Summary
// ----------------------------------------------------------------------------
console.log('\n======================================================');
console.log(`  Tests Passed: ${passedTests}`);
console.log(`  Tests Failed: ${failedTests}`);
console.log('======================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
