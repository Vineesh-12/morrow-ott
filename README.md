# Morrow — A World of Stories

> **Premium OTT Entertainment Platform**  
> *Cloud Computing FT-III Academic Assessment (Course Code: 21CSE362T)*

[![Tests](https://img.shields.io/badge/Tests-33%20Passed-brightgreen)](file:///scripts/test-catalogue.mjs)
[![Validation](https://img.shields.io/badge/Validation-16%2F16%20Rules%20Passing-blue)](file:///scripts/validate-catalogue.mjs)
[![Phase 3](https://img.shields.io/badge/Phase%203-Amazon%20S3%20Prep%20Complete-orange)](file:///docs/s3-asset-architecture.md)
[![AWS S3](https://img.shields.io/badge/S3%20Region-ap--south--1%20(Mumbai)-purple)](file:///docs/s3-asset-architecture.md)
[![Security](https://img.shields.io/badge/S3%20Public%20Access-Blocked%20(Private%20Origin)-red)](file:///docs/s3-asset-architecture.md)

---

## 1. Project Overview

**Morrow** is a cinema-inspired Over-The-Top (OTT) media streaming web application designed to demonstrate a complete, production-grade cloud streaming architecture. Built with an editorial dark theme (charcoal `#111315`, deep slate `#1C1E20`, warm ivory `#F2EEE8`, and muted copper `#C87552`), Morrow delivers seamless video browsing, episode exploration, responsive native playback, watchlist tracking, and an AI-assisted entertainment concierge grounded in verified catalogue metadata.

### Target AWS Architecture
- **Amazon S3**: Private object storage for media assets (`posters/`, `backdrops/`, `videos/`, `subtitles/`).
- **Amazon CloudFront**: Global Content Delivery Network (CDN) with Origin Access Control (OAC) for secure, low-latency streaming.
- **Amazon API Gateway**: HTTP API routing requests to backend microservices.
- **AWS Lambda (Node.js)**: Serverless compute executing catalogue queries and business logic.
- **Amazon DynamoDB (`MorrowVideos`)**: NoSQL database holding metadata, seasons, and episodes.
- **Amazon CloudWatch**: End-to-end diagnostics, structured logs, and metrics.
- **Morrow AI Concierge**: Catalogue-grounded AI discovery assistant.

---

## 2. Phase 2 & 3 Milestones

### Phase 2: Catalogue & Data Design
1. **Frontend Audit**: Inspected existing routes, HTML5 video player, `localStorage` watch history, and media paths.
2. **Canonical Data Model**: Authoritative TypeScript/JSON schemas for movies, series, seasons, and episodes.
3. **Truth-in-Availability**: A strict availability engine ensuring titles are marked playable **only** when media assets exist and are verified on disk.
4. **Catalogue Normalizer & Adapter**: Backward-compatible layer (`data/catalogue-adapter.js`) preserving all legacy UI properties (`videoId`, `category`, `episodes`) while enforcing the canonical schema.
5. **Asset Manifest Generator**: Automated scanner (`scripts/generate-asset-manifest.mjs`) tracking 29 media assets (24 verified local, 5 planned remote).
6. **Automated Integrity Validator**: 16-point validator (`scripts/validate-catalogue.mjs`) ensuring zero duplicate IDs, valid durations, non-empty genres, and intact relationships.

### Phase 3: Amazon S3 Asset Preparation & Secure Storage
1. **S3 Object Key Convention**: Established strict prefix convention (`posters/`, `backdrops/`, `videos/`, `subtitles/`).
2. **Asset Manifest Mapping**: Deterministic mapping from local catalogue paths (`media/videos/...`, `media/thumbnails/...`) to S3 keys.
3. **Upload Dry-Run Planner**: Automated tool (`scripts/s3-upload-plan.mjs` / `npm run s3:plan`) validating paths, MIME types, and flagging files > 5MB.
4. **Upload Inventory**: 12 destination S3 objects derived from 8 verified local files (total payload: **11.96 MB**).
5. **AWS Console Runbook**: Step-by-step instructions for creating a private S3 bucket in `ap-south-1` (Mumbai) with Block Public Access enabled and SSE-S3 encryption.
6. **CloudFront OAC Integration Plan**: Documented SigV4 Origin Access Control policy and dynamic client URL resolution.

---

## 3. Canonical Catalogue Structure

The development catalogue is maintained in [`data/catalogue.json`](data/catalogue.json) and contains representative titles:

| ID | Title | Type | Status | S3 Video Key | IMDb |
|---|---|---|---|---|---|
| `VID001` | *The Cloud Paradox* | Movie | `available` | `videos/cloud-intro.mp4` (Verified) | 8.6 |
| `VID002` | *Beyond the Horizon* | Movie | `available` | `videos/big-buck-bunny.mp4` (Verified) | 8.2 |
| `VID003` | *Flora: The Secret Kingdom* | Series | `available` | `videos/botanical-life.mp4` (Ep 1 Verified) | 8.9 |
| `VID004` | *Metropolis Nights* | Series | `available` | `videos/urban-rhythm.mp4` (Ep 1 Verified) | 8.4 |
| `VID005` | *Solaris Drift* | Movie | `metadata_only` | `videos/solaris-drift.mp4` (Pending Ingestion) | 7.9 |
| `VID006` | *Silent Echoes* | Movie | `coming_soon` | `videos/silent-echoes.mp4` (Scheduled) | 8.1 |
| `VID007` | *The Quantum Rift* | Series | `coming_soon` | `videos/quantum-rift-e1.mp4` (Scheduled) | 8.5 |

### Availability State System
- **`available`**: Video file verified on disk. Playback is fully enabled.
- **`metadata_only`**: Information exists in the catalogue; cloud video upload pending. Playback is blocked with an informative message.
- **`coming_soon`**: Title scheduled for future release. Player is disabled with a "Coming Soon" badge.
- **`unavailable`**: Inactive title; cannot be streamed.

---

## 4. Repository Structure

```
morrow-ott/
├── data/
│   ├── catalogue.json              # Canonical catalogue dataset (7 titles)
│   ├── catalogue-adapter.js        # Normalizer & S3 key mapping adapter
│   └── asset-manifest.json         # Automated asset manifest with S3 metadata (29 entries)
├── docs/
│   ├── catalogue-data-design.md    # Phase 2 canonical data model & DynamoDB spec
│   └── s3-asset-architecture.md    # Phase 3 S3 asset architecture & AWS Console runbook
├── frontend/
│   ├── index.html                  # Cinema-first single-page app (SPA)
│   ├── styles.css                  # Custom styling (brand colors, layout, player)
│   ├── app.js                      # Application controller, routes, player, AI
│   ├── server.js                   # Node.js HTTP server (MIME, range requests)
│   └── media/                      # Local video clips & SVG thumbnail assets
├── media/                          # Source media repository
│   ├── videos/                     # MP4 video files
│   └── thumbnails/                 # SVG artwork posters
├── scripts/
│   ├── generate-asset-manifest.mjs # Scans media and outputs asset-manifest.json
│   ├── s3-upload-plan.mjs          # Phase 3 S3 dry-run planner & AWS CLI commands
│   ├── validate-catalogue.mjs      # 16-rule automated catalogue validator
│   ├── test-catalogue.mjs          # 33-test unit test suite
│   └── build.mjs                   # Verification build pipeline
├── .gitignore                      # Git ignore file (ignores large video binaries & AWS creds)
├── package.json                    # ES module manifest and npm script runner
└── README.md                       # Project documentation
```

---

## 5. Quick Start & Execution

### Prerequisites
- Node.js (v18+ recommended, tested on v22)

### 1. Start the Development Server
```bash
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to explore the platform.

### 2. View S3 Upload Plan (Phase 3 Dry-Run)
```bash
npm run s3:plan
```
Generates a dry-run summary with exact file sizes, MIME types, and copy-paste AWS CLI commands for S3 upload.

### 3. Run Catalogue Validation
```bash
npm run validate
```
Validates [`data/catalogue.json`](data/catalogue.json) against all 16 integrity constraints.

### 4. Generate Asset Manifest
```bash
npm run manifest
```
Re-scans physical media files and regenerates [`data/asset-manifest.json`](data/asset-manifest.json).

### 5. Run the Automated Unit Test Suite
```bash
npm test
```
Executes all 33 unit tests covering canonical schemas, negative defenses, manifest verification, and S3 upload security.

### 6. Run Verification Build
```bash
npm run build
```
Executes the full pipeline: catalogue validation, manifest generation, static frontend check, and S3 plan verification.

---

## 6. Target DynamoDB Schema (`MorrowVideos`)

For Phase 4 AWS deployment, the canonical schema maps to a single-table DynamoDB design:

- **Partition Key (PK)**: `TITLE#<id>` (Movies) or `SERIES#<id>` (Series)
- **Sort Key (SK)**: `METADATA` or `SEASON#<num>#EP#<num>`
- **GSI-1 (Content Type & Rating)**: `GSI1PK = TYPE#<movie|series>`, `GSI1SK = RATING#<imdbRating>`
- **GSI-2 (Genre Discovery)**: `GSI2PK = GENRE#<genre>`, `GSI2SK = YEAR#<releaseYear>`

---

## 7. Next Steps: Phase 4 (Amazon DynamoDB & AWS Lambda)

1. Provision Amazon DynamoDB table `MorrowVideos` with defined PK/SK and GSIs.
2. Develop AWS Lambda functions in Node.js for reading catalogue items and handling search.
3. Configure Amazon API Gateway HTTP API to expose backend endpoints.
4. Integrate frontend `catalogueService` to fetch from API Gateway in cloud environments.

---

## 8. Academic Evaluation Details
- **Student**: Vineesh
- **Course**: Cloud Computing (FT-III Assessment)
- **Course Code**: 21CSE362T
- **Project**: Morrow OTT Platform
