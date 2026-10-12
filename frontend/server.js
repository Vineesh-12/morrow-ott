/**
 * Morrow OTT Platform — Local Development Server (ES Module)
 * Zero-dependency Node.js HTTP server supporting:
 * - Proper MIME types (HTML, CSS, JS, SVG, MP4, JSON)
 * - HTTP 206 Partial Content (Range requests) for video seeking
 * - Mock API endpoints: GET /api/health and GET /api/videos (reads canonical catalogue)
 * - Static file serving for frontend/, media/, and data/
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeCatalogue } from '../data/catalogue-adapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const PROJECT_DIR = path.resolve(__dirname, '..');
const MEDIA_DIR = PROJECT_DIR;
const DATA_DIR = path.join(PROJECT_DIR, 'data');
const CATALOGUE_JSON_PATH = path.join(DATA_DIR, 'catalogue.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.vtt': 'text/vtt; charset=utf-8',
  '.ico': 'image/x-icon'
};

function getCanonicalCatalogue() {
  try {
    if (fs.existsSync(CATALOGUE_JSON_PATH)) {
      const raw = JSON.parse(fs.readFileSync(CATALOGUE_JSON_PATH, 'utf-8'));
      return normalizeCatalogue(raw.catalogue || raw);
    }
  } catch (err) {
    console.error('Error reading canonical catalogue:', err);
  }
  return [];
}

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  // API Route: GET /api/health
  if (urlPath === '/api/health' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify({ status: 'ok', service: 'morrow-catalogue-dev' }));
  }

  // API Route: GET /api/videos (reads canonical catalogue)
  if (urlPath === '/api/videos' && req.method === 'GET') {
    const videos = getCanonicalCatalogue();
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify({ count: videos.length, videos }));
  }

  // Static File Resolution
  let safePath = urlPath === '/' ? '/index.html' : urlPath;
  let filePath = path.join(ROOT_DIR, safePath);

  // If path starts with /data/, resolve from project data directory
  if (safePath.startsWith('/data/')) {
    filePath = path.join(PROJECT_DIR, safePath);
  }

  // If path starts with /media/, resolve from project media directory if not found in frontend
  if (!fs.existsSync(filePath) && safePath.startsWith('/media/')) {
    filePath = path.join(MEDIA_DIR, safePath);
  }

  // Check if file exists
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end(`404 Not Found: ${safePath}`);
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // HTTP Range Request Handling (Crucial for MP4 seeking)
  const range = req.headers.range;

  if (range && ext === '.mp4') {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunkSize = (end - start) + 1;

    const fileStream = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    return fileStream.pipe(res);
  }

  // Full file streaming
  res.writeHead(200, {
    'Content-Length': stat.size,
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Access-Control-Allow-Origin': '*'
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  Morrow OTT Local Dev Server Running`);
  console.log(`  Local URL:   http://localhost:${PORT}`);
  console.log(`  Health API:  http://localhost:${PORT}/api/health`);
  console.log(`  Videos API:  http://localhost:${PORT}/api/videos`);
  console.log(`  Catalogue:   http://localhost:${PORT}/data/catalogue.json`);
  console.log(`  Manifest:    http://localhost:${PORT}/data/asset-manifest.json`);
  console.log(`======================================================\n`);
});
