/**
 * Morrow OTT Platform — Asset Manifest Generator
 * Inventories all media assets referenced by the canonical catalogue,
 * verifies local filesystem existence and sizes, and writes data/asset-manifest.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CATALOGUE_PATH = path.join(ROOT_DIR, 'data', 'catalogue.json');
const MANIFEST_OUTPUT_PATH = path.join(ROOT_DIR, 'data', 'asset-manifest.json');

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

    assets.push({
      logicalKey: cleanKey,
      assetType: type,
      relativePath: cleanKey,
      contentId,
      format,
      existsLocal,
      sizeBytes,
      verificationState,
      requiredForAvailability
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

  const manifest = {
    version: '2.0.0',
    generatedAt: new Date().toISOString(),
    totalAssets: assets.length,
    verifiedLocalCount: assets.filter(a => a.existsLocal).length,
    missingLocalCount: assets.filter(a => !a.existsLocal && a.requiredForAvailability).length,
    plannedRemoteCount: assets.filter(a => !a.existsLocal && !a.requiredForAvailability).length,
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
    console.log('  Morrow OTT — Media Asset Manifest Generated');
    console.log(`  Total Assets Catalogued: ${manifest.totalAssets}`);
    console.log(`  Verified Local on Disk:  ${manifest.verifiedLocalCount}`);
    console.log(`  Missing Local (Required): ${manifest.missingLocalCount}`);
    console.log(`  Planned Remote/Future:   ${manifest.plannedRemoteCount}`);
    console.log(`  Output Path: ${MANIFEST_OUTPUT_PATH}`);
    console.log('======================================================');
  } catch (err) {
    console.error('Error generating asset manifest:', err);
    process.exit(1);
  }
}
