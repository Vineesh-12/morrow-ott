/**
 * Morrow OTT Platform — Asset Manifest Generator
 * Inventories all media assets referenced by the canonical catalogue,
 * verifies local filesystem existence and sizes, and writes data/asset-manifest.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapAssetKeyToS3Key, MIME_TYPE_MAP } from '../data/catalogue-adapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CATALOGUE_PATH = path.join(ROOT_DIR, 'data', 'catalogue.json');
const MANIFEST_OUTPUT_PATH = path.join(ROOT_DIR, 'data', 'asset-manifest.json');

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return null;
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function generateAssetManifest() {
  if (!fs.existsSync(CATALOGUE_PATH)) {
    throw new Error(`Catalogue file not found at ${CATALOGUE_PATH}`);
  }

  const rawData = JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf-8'));
  const titles = rawData.catalogue || [];

  const assets = [];
  const processedKeys = new Set();

  function registerAsset(key, type, contentId, requiredForAvailability = false) {
    if (!key) return;
    const cleanKey = key.replace(/^\/+/, '');
    const assetId = `${type}:${cleanKey}:${contentId}`;
    if (processedKeys.has(assetId)) return;
    processedKeys.add(assetId);

    // Resolve path on disk (check root and frontend folder)
    let fullPath = path.join(ROOT_DIR, cleanKey);
    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(ROOT_DIR, 'frontend', cleanKey);
    }

    const existsLocal = fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
    let sizeBytes = null;
    let format = path.extname(cleanKey).replace('.', '').toLowerCase() || 'unknown';

    if (existsLocal) {
      sizeBytes = fs.statSync(fullPath).size;
    }

    let verificationState = 'planned_remote';
    if (existsLocal) {
      verificationState = 'verified_local';
    } else if (requiredForAvailability) {
      verificationState = 'missing_local';
    }

    const ext = path.extname(cleanKey).toLowerCase();
    const mimeType = MIME_TYPE_MAP[ext] || 'application/octet-stream';
    const s3Key = mapAssetKeyToS3Key(cleanKey, type);
    const isLargeFile = Boolean(existsLocal && sizeBytes && sizeBytes > 5 * 1024 * 1024);

    let notes = '';
    if (!existsLocal) {
      notes = requiredForAvailability 
        ? 'CRITICAL: Missing local file for available title' 
        : 'Planned remote asset for upcoming release';
    } else if (isLargeFile) {
      notes = 'Verified local media (Large file >5MB; candidate for multipart upload)';
    } else {
      notes = 'Verified local asset ready for S3 upload';
    }

    assets.push({
      logicalKey: cleanKey,
      s3Key,
      assetType: type,
      relativePath: cleanKey,
      contentId,
      format,
      mimeType,
      existsLocal,
      sizeBytes,
      sizeFormatted: formatBytes(sizeBytes),
      isLargeFile,
      verificationState,
      uploadStatus: 'not_uploaded',
      requiredForAvailability,
      isRequiredForDemo: requiredForAvailability,
      notes
    });
  }

  // Iterate all titles in canonical catalogue
  for (const item of titles) {
    const isAvail = item.availabilityStatus === 'available';

    // Poster & Backdrop
    if (item.posterKey) {
      registerAsset(item.posterKey, 'poster', item.id, false);
    }
    if (item.backdropKey) {
      registerAsset(item.backdropKey, 'backdrop', item.id, false);
    }

    // Movie Video Asset
    if (item.contentType === 'movie' && item.videoKey) {
      registerAsset(item.videoKey, 'video', item.id, isAvail);
    }

    // Subtitles
    if (item.subtitleKeys && typeof item.subtitleKeys === 'object') {
      for (const [lang, subKey] of Object.entries(item.subtitleKeys)) {
        registerAsset(subKey, `subtitle_${lang}`, item.id, false);
      }
    }

    // Series Seasons and Episodes
    if (Array.isArray(item.seasons)) {
      for (const season of item.seasons) {
        if (season.posterKey) {
          registerAsset(season.posterKey, 'season_poster', `${item.id}-S${season.seasonNum}`, false);
        }
        if (Array.isArray(season.episodes)) {
          for (const ep of season.episodes) {
            const epAvail = ep.availabilityStatus === 'available';
            if (ep.thumbnailKey) {
              registerAsset(ep.thumbnailKey, 'episode_thumbnail', ep.id, false);
            }
            if (ep.videoKey) {
              registerAsset(ep.videoKey, 'episode_video', ep.id, epAvail);
            }
          }
        }
      }
    }
  }

  // Calculate unique local size bytes
  const uniqueLocalFiles = new Map();
  for (const asset of assets) {
    if (asset.existsLocal && asset.sizeBytes) {
      uniqueLocalFiles.set(asset.relativePath, asset.sizeBytes);
    }
  }
  let totalVerifiedLocalSizeBytes = 0;
  for (const size of uniqueLocalFiles.values()) {
    totalVerifiedLocalSizeBytes += size;
  }

  const manifest = {
    version: '3.0.0',
    generatedAt: '2026-10-12T08:45:00.000Z',
    totalAssets: assets.length,
    verifiedLocalCount: assets.filter(a => a.existsLocal).length,
    missingLocalCount: assets.filter(a => !a.existsLocal && a.requiredForAvailability).length,
    plannedRemoteCount: assets.filter(a => !a.existsLocal && !a.requiredForAvailability).length,
    totalVerifiedLocalSizeBytes,
    totalVerifiedLocalSizeFormatted: formatBytes(totalVerifiedLocalSizeBytes),
    largeFilesCount: assets.filter(a => a.isLargeFile).length,
    s3Prefixes: ['posters/', 'backdrops/', 'videos/', 'subtitles/'],
    assets
  };

  fs.writeFileSync(MANIFEST_OUTPUT_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  return manifest;
}

// Direct CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const manifest = generateAssetManifest();
    console.log('======================================================');
    console.log('  Morrow OTT — Media Asset Manifest Generated (Phase 3)');
    console.log(`  Total Assets Catalogued:      ${manifest.totalAssets}`);
    console.log(`  Verified Local on Disk:       ${manifest.verifiedLocalCount}`);
    console.log(`  Missing Local (Required):     ${manifest.missingLocalCount}`);
    console.log(`  Planned Remote/Future:        ${manifest.plannedRemoteCount}`);
    console.log(`  Total Unique Local Media:     ${manifest.totalVerifiedLocalSizeFormatted} (${manifest.totalVerifiedLocalSizeBytes} bytes)`);
    console.log(`  Large Files (>5MB):           ${manifest.largeFilesCount}`);
    console.log(`  Target S3 Prefixes:           ${manifest.s3Prefixes.join(', ')}`);
    console.log(`  Output Path: ${MANIFEST_OUTPUT_PATH}`);
    console.log('======================================================');
  } catch (err) {
    console.error('Error generating asset manifest:', err);
    process.exit(1);
  }
}
