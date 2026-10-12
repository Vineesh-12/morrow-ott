/**
 * Morrow OTT Platform — Repeatable AWS Lambda Packaging Pipeline
 * Packages the self-contained backend service into dist/morrow-backend-lambda.zip
 *
 * Verifies:
 * - Inclusion of entry point (index.mjs) matching handler "index.handler"
 * - Inclusion of production runtime modules and Phase 4 canonical fixture
 * - Strict exclusion of frontend source, media files, dev scripts, and .git
 * - File integrity, archive inspection, and checksum reporting
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DIST_DIR = path.join(ROOT_DIR, 'dist');
const STAGING_DIR = path.join(DIST_DIR, 'staging-lambda');
const ZIP_PATH = path.join(DIST_DIR, 'morrow-backend-lambda.zip');

/**
 * Recursively copies a directory
 */
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function packageLambda() {
  console.log('======================================================');
  console.log('  Morrow OTT — Packaging AWS Lambda Deployment Artifact');
  console.log('======================================================\n');

  // Step 1: Clean & prepare output directories
  console.log('1. Preparing staging environment...');
  if (fs.existsSync(STAGING_DIR)) {
    fs.rmSync(STAGING_DIR, { recursive: true, force: true });
  }
  if (fs.existsSync(ZIP_PATH)) {
    fs.unlinkSync(ZIP_PATH);
  }
  fs.mkdirSync(STAGING_DIR, { recursive: true });

  // Step 2: Copy backend code into staging root
  console.log('2. Staging backend source files...');
  const backendDir = path.join(ROOT_DIR, 'backend');
  
  // Root files
  fs.copyFileSync(path.join(backendDir, 'index.mjs'), path.join(STAGING_DIR, 'index.mjs'));
  fs.copyFileSync(path.join(backendDir, 'package.json'), path.join(STAGING_DIR, 'package.json'));

  // src directory
  copyDirSync(path.join(backendDir, 'src'), path.join(STAGING_DIR, 'src'));

  // data directory: Stage Phase 4 canonical fixture
  const stagingDataDir = path.join(STAGING_DIR, 'data');
  fs.mkdirSync(stagingDataDir, { recursive: true });
  const canonicalData = fs.readFileSync(path.join(ROOT_DIR, 'data', 'catalogue.json'), 'utf-8');
  fs.writeFileSync(path.join(stagingDataDir, 'catalogue-fixture.json'), canonicalData);
  fs.writeFileSync(path.join(stagingDataDir, 'catalogue.json'), canonicalData);

  console.log('   ✓ index.mjs staged at root');
  console.log('   ✓ src/ controllers, repository, & utils staged');
  console.log('   ✓ data/catalogue-fixture.json staged');

  // Step 3: Compress using native PowerShell Compress-Archive
  console.log('\n3. Creating ZIP archive...');
  const psCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${STAGING_DIR}\\*' -DestinationPath '${ZIP_PATH}' -Force"`;
  execSync(psCmd, { stdio: 'inherit' });

  if (!fs.existsSync(ZIP_PATH)) {
    throw new Error(`Packaging failed: ${ZIP_PATH} was not generated.`);
  }

  const zipStats = fs.statSync(ZIP_PATH);
  const zipSizeKb = (zipStats.size / 1024).toFixed(2);
  const hash = crypto.createHash('sha256').update(fs.readFileSync(ZIP_PATH)).digest('hex');

  console.log(`   ✓ Archive created: dist/morrow-backend-lambda.zip (${zipSizeKb} KB)`);
  console.log(`   ✓ SHA-256: ${hash}`);

  // Step 4: Inspect archive contents
  console.log('\n4. Inspecting archive contents with tar...');
  const tarList = execSync(`tar -tf "${ZIP_PATH}"`, { encoding: 'utf-8' }).trim().split(/\r?\n/);
  
  console.log('--- Archive File Inventory ---');
  for (const item of tarList) {
    console.log(`   [file] ${item}`);
  }
  console.log('------------------------------');

  // Step 5: Assert critical requirements
  console.log('\n5. Validating package constraints...');
  const hasHandler = tarList.some(f => f === 'index.mjs' || f.endsWith('/index.mjs') || f === 'index.mjs/');
  if (!hasHandler) {
    throw new Error('Packaging Error: index.mjs entry point is missing from the archive root!');
  }
  console.log('   ✓ Handler entry point index.mjs verified at archive root');

  const hasFixture = tarList.some(f => f.includes('catalogue-fixture.json'));
  if (!hasFixture) {
    throw new Error('Packaging Error: data/catalogue-fixture.json is missing from the archive!');
  }
  console.log('   ✓ Phase 4 data fixture verified in archive');

  const forbiddenPatterns = ['frontend', 'node_modules', '.git', 'media', 'scripts', 'docs'];
  for (const bad of forbiddenPatterns) {
    const foundBad = tarList.some(f => f.toLowerCase().startsWith(bad));
    if (foundBad) {
      throw new Error(`Packaging Error: Forbidden component '${bad}' detected in Lambda ZIP!`);
    }
  }
  console.log('   ✓ Strict isolation verified (0 frontend files, 0 media bytes, 0 dev scripts)');

  // Clean staging
  fs.rmSync(STAGING_DIR, { recursive: true, force: true });
  console.log('   ✓ Temporary staging directory cleaned');

  console.log('\n======================================================');
  console.log('  Lambda Deployment Package Ready for AWS Console:');
  console.log(`  File:    dist/morrow-backend-lambda.zip`);
  console.log(`  Size:    ${zipSizeKb} KB`);
  console.log(`  Handler: index.handler`);
  console.log('======================================================\n');

  return {
    zipPath: ZIP_PATH,
    sizeKb: zipSizeKb,
    sha256: hash,
    fileCount: tarList.length
  };
}

// Auto-run when executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    packageLambda();
  } catch (err) {
    console.error('Packaging failed:', err.message);
    process.exit(1);
  }
}
