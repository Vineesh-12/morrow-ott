/**
 * Morrow OTT Platform — DynamoDB Catalogue Import & Migration Tool
 * Reads the canonical Phase 2 catalogue, validates records, preserves
 * truth-in-availability semantics, and loads items into 'MorrowVideos'.
 *
 * Usage:
 *   node scripts/import-catalogue-dynamodb.mjs             # Runs in safe DRY-RUN mode (default)
 *   node scripts/import-catalogue-dynamodb.mjs --dry-run   # Explicit dry-run verification
 *   node scripts/import-catalogue-dynamodb.mjs --execute   # Executes live batch upload to AWS DynamoDB
 *
 * Options:
 *   --table=<name>     Override table name (default: MorrowVideos)
 *   --region=<region>   Override target AWS Region (default: ap-southeast-2)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCatalogue } from './validate-catalogue.mjs';
import { normalizeTitleRecord } from '../backend/src/utils/normalizer.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CATALOGUE_PATH = path.join(ROOT_DIR, 'data', 'catalogue.json');

// Parse CLI arguments
const args = process.argv.slice(2);
const isExecute = args.includes('--execute');
const isDryRun = !isExecute || args.includes('--dry-run');

const tableArg = args.find(a => a.startsWith('--table='));
const TABLE_NAME = tableArg ? tableArg.split('=')[1] : (process.env.TABLE_NAME || 'MorrowVideos');

const regionArg = args.find(a => a.startsWith('--region='));
const AWS_REGION = regionArg ? regionArg.split('=')[1] : (process.env.AWS_REGION || 'ap-southeast-2');

/**
 * Validates and prepares DynamoDB Put items from canonical dataset.
 */
export function prepareDynamoDbItems() {
  if (!fs.existsSync(CATALOGUE_PATH)) {
    throw new Error(`Catalogue file not found at ${CATALOGUE_PATH}`);
  }

  const rawData = JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf-8'));

  // Step 1: Run 16-point canonical validator
  const validationResult = validateCatalogue(rawData, {
    checkFilesystem: true,
    rootDir: ROOT_DIR
  });

  if (!validationResult.isValid) {
    throw new Error(
      `Catalogue integrity check failed with ${validationResult.errors.length} error(s):\n` +
      validationResult.errors.join('\n')
    );
  }

  const catalogueList = Array.isArray(rawData) ? rawData : (rawData.catalogue || []);
  const preparedItems = [];
  const seenIds = new Set();

  for (const rawItem of catalogueList) {
    if (!rawItem.id) {
      throw new Error('Item missing required primary key "id"');
    }

    if (seenIds.has(rawItem.id)) {
      throw new Error(`Duplicate partition key detected: "${rawItem.id}"`);
    }
    seenIds.add(rawItem.id);

    // Normalize through Phase 2 availability rules
    const normalized = normalizeTitleRecord(rawItem);
    if (!normalized) {
      throw new Error(`Failed to normalize record with ID "${rawItem.id}"`);
    }

    // Build clean DynamoDB item payload (preserving document structure)
    const dynamoItem = {
      id: normalized.id,
      title: normalized.title,
      contentType: normalized.contentType,
      synopsis: normalized.synopsis,
      genres: normalized.genres,
      releaseYear: normalized.releaseYear,
      language: normalized.language,
      durationSeconds: normalized.durationSeconds,
      imdbRating: normalized.imdbRating,
      rating: normalized.rating,
      quality: normalized.quality,
      audio: normalized.audio,
      posterKey: normalized.posterKey,
      backdropKey: normalized.backdropKey,
      videoKey: normalized.videoKey,
      subtitleKeys: normalized.subtitleKeys,
      availabilityStatus: normalized.availabilityStatus,
      isPlayable: normalized.isPlayable,
      featured: normalized.featured,
      createdAt: normalized.createdAt,
      updatedAt: normalized.updatedAt,
      tags: normalized.tags,
      keywords: normalized.keywords,
      seasons: normalized.seasons,
      episodes: normalized.episodes,

      // UI Aliases for backward compatibility
      videoId: normalized.videoId,
      type: normalized.type,
      description: normalized.description,
      genre: normalized.genre,
      category: normalized.category,
      year: normalized.year,
      thumbnailKey: normalized.thumbnailKey,
      objectKey: normalized.objectKey,
      availability: normalized.availability
    };

    preparedItems.push(dynamoItem);
  }

  return preparedItems;
}

/**
 * Main importer orchestrator
 */
export async function runImporter() {
  console.log('======================================================');
  console.log('  Morrow OTT — Amazon DynamoDB Catalogue Importer');
  console.log('======================================================\n');
  console.log(`Target Table:   ${TABLE_NAME}`);
  console.log(`Target Region:  ${AWS_REGION}`);
  console.log(`Execution Mode: ${isExecute ? 'LIVE EXECUTION' : 'DRY RUN (Safe Simulation)'}\n`);

  console.log('1. Validating canonical Phase 2 catalogue...');
  const items = prepareDynamoDbItems();
  console.log(`   ✓ Catalogue validated successfully (${items.length} titles).\n`);

  console.log('2. Inspecting Candidate Item Inventory:');
  console.log('------------------------------------------------------------------------------------------------');
  console.log('ID       Type    Status           Playable  S3 Video Key                   Title');
  console.log('------------------------------------------------------------------------------------------------');
  for (const item of items) {
    const id = item.id.padEnd(8);
    const type = item.contentType.padEnd(7);
    const status = item.availabilityStatus.padEnd(16);
    const playable = String(item.isPlayable).padEnd(9);
    const videoKey = (item.videoKey || 'None').padEnd(30);
    console.log(`${id} ${type} ${status} ${playable} ${videoKey} ${item.title}`);
  }
  console.log('------------------------------------------------------------------------------------------------\n');

  if (isDryRun) {
    console.log('======================================================');
    console.log('  DRY-RUN SIMULATION COMPLETE (0 network calls made)');
    console.log(`  Items Verified:   ${items.length}`);
    console.log(`  Playable Titles:  ${items.filter(i => i.isPlayable).length}`);
    console.log(`  Metadata Only:    ${items.filter(i => i.availabilityStatus === 'metadata_only').length}`);
    console.log(`  Coming Soon:      ${items.filter(i => i.availabilityStatus === 'coming_soon').length}`);
    console.log('======================================================');
    console.log('\nTo execute live upload to AWS DynamoDB, run:');
    console.log(`  node scripts/import-catalogue-dynamodb.mjs --execute --table=${TABLE_NAME} --region=${AWS_REGION}\n`);
    return { success: true, mode: 'dry-run', count: items.length };
  }

  // Live Execution Mode
  console.log(`3. Executing live batch import to table '${TABLE_NAME}' in '${AWS_REGION}'...`);
  const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
  const { DynamoDBDocumentClient, PutCommand } = await import('@aws-sdk/lib-dynamodb');

  const ddbClient = new DynamoDBClient({ region: AWS_REGION });
  const docClient = DynamoDBDocumentClient.from(ddbClient, {
    marshallOptions: { removeUndefinedValues: true }
  });

  let importedCount = 0;
  for (const item of items) {
    process.stdout.write(`   Uploading ${item.id} (${item.title})... `);
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));
    process.stdout.write('✓ OK\n');
    importedCount++;
  }

  console.log('\n======================================================');
  console.log(`  SUCCESSFULLY IMPORTED ${importedCount} ITEMS INTO DYNAMODB TABLE '${TABLE_NAME}'`);
  console.log('======================================================\n');
  return { success: true, mode: 'execute', count: importedCount };
}

// Execute when run from CLI directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runImporter().catch(err => {
    console.error('\nImport Failed:', err.message);
    process.exit(1);
  });
}
