# Morrow — A World of Stories

> **Premium OTT Entertainment Platform**  
> *Cloud Computing FT-III Academic Assessment (Course Code: 21CSE362T)*

[![Tests](https://img.shields.io/badge/Tests-25%20Passed-brightgreen)](file:///scripts/test-catalogue.mjs)
[![Validation](https://img.shields.io/badge/Validation-16%2F16%20Rules%20Passing-blue)](file:///scripts/validate-catalogue.mjs)
[![Phase](https://img.shields.io/badge/Phase%202-Catalogue%20%26%20Data%20Design%20Complete-orange)](file:///docs/catalogue-data-design.md)
[![Architecture](https://img.shields.io/badge/Cloud%20Architecture-AWS%20Serverless-purple)](file:///docs/catalogue-data-design.md)

---

## 1. Project Overview

**Morrow** is a cinema-inspired Over-The-Top (OTT) media streaming web application designed to demonstrate a complete, production-grade cloud streaming architecture. Built with an editorial dark theme (charcoal `#111315`, deep slate `#1C1E20`, warm ivory `#F2EEE8`, and muted copper `#C87552`), Morrow delivers seamless video browsing, episode exploration, responsive native playback, watchlist tracking, and an AI-assisted entertainment concierge grounded in verified catalogue metadata.

### Proposed AWS Architecture
- **Amazon S3**: Object storage for media assets, posters, backdrops, and video streams.
- **Amazon CloudFront**: Global Content Delivery Network (CDN) for low-latency video streaming.
- **Amazon API Gateway**: HTTP API routing requests to backend microservices.
- **AWS Lambda (Node.js)**: Serverless compute executing catalogue queries and business logic.
- **Amazon DynamoDB (`MorrowVideos`)**: NoSQL database holding metadata, seasons, and episodes.
- **Amazon CloudWatch**: End-to-end diagnostics, structured logs, and metrics.
- **Morrow AI Concierge**: Catalogue-grounded AI discovery assistant.

---

## 2. Phase 2: Catalogue & Data Design

Phase 2 establishes the canonical data foundation for movies, series, seasons, episodes, and media assets before deploying AWS resources.

### Key Deliverables Completed:
1. **Frontend Audit**: Inspected existing routes, HTML5 video player, `localStorage` watch history, and media paths.
2. **Canonical Data Model**: Authoritative TypeScript/JSON schemas for movies, series, seasons, and episodes.
3. **Truth-in-Availability**: A strict availability engine ensuring titles are marked playable **only** when media assets exist and are verified on disk.
4. **Catalogue Normalizer & Adapter**: Backward-compatible layer (`data/catalogue-adapter.js`) preserving all legacy UI properties (`videoId`, `category`, `episodes`) while enforcing the canonical schema.
5. **Asset Manifest Generator**: Automated scanner (`scripts/generate-asset-manifest.mjs`) tracking 29 media assets (24 verified local, 5 planned remote).
6. **Automated Integrity Validator**: 16-point validator (`scripts/validate-catalogue.mjs`) ensuring zero duplicate IDs, valid durations, non-empty genres, and intact relationships.
7. **Comprehensive Test Suite**: 25 unit tests (`scripts/test-catalogue.mjs`) validating models, fixtures, manifest generation, and negative edge cases.

---

## 3. Canonical Catalogue Structure

The development catalogue is maintained in [`data/catalogue.json`](data/catalogue.json) and contains representative titles:

| ID | Title | Type | Status | Video Asset | IMDb |
|---|---|---|---|---|---|
| `VID001` | *The Cloud Paradox* | Movie | `available` | `media/videos/cloud-intro.mp4` (Verified) | 8.6 |
| `VID002` | *Beyond the Horizon* | Movie | `available` | `media/videos/big-buck-bunny.mp4` (Verified) | 8.2 |
| `VID003` | *Flora: The Secret Kingdom* | Series | `available` | `media/videos/botanical-life.mp4` (Ep 1 Verified) | 8.9 |
| `VID004` | *Metropolis Nights* | Series | `available` | `media/videos/urban-rhythm.mp4` (Ep 1 Verified) | 8.4 |
| `VID005` | *Solaris Drift* | Movie | `metadata_only` | `media/videos/solaris-drift.mp4` (Pending Phase 3) | 7.9 |
| `VID006` | *Silent Echoes* | Movie | `coming_soon` | `media/videos/silent-echoes.mp4` (Scheduled) | 8.1 |
| `VID007` | *The Quantum Rift* | Series | `coming_soon` | `media/videos/quantum-rift-e1.mp4` (Scheduled) | 8.5 |

### Availability State System
- **`available`**: Video file verified on disk. Playback is fully enabled.
- **`metadata_only`**: Information exists in the catalogue; video upload pending in Phase 3. Playback is blocked with an informative message.
- **`coming_soon`**: Title scheduled for future release. Player is disabled with a "Coming Soon" badge.
- **`unavailable`**: Inactive title; cannot be streamed.

---

## 4. Repository Structure

```
morrow-ott/
├── data/
│   ├── catalogue.json              # Canonical catalogue dataset (7 titles)
│   ├── catalogue-adapter.js        # Normalizer & backward-compatibility adapter
│   └── asset-manifest.json         # Automated asset manifest (29 entries)
├── docs/
│   └── catalogue-data-design.md    # Detailed Phase 2 data model & DynamoDB spec
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
│   ├── validate-catalogue.mjs      # 16-rule automated catalogue validator
│   ├── test-catalogue.mjs          # 25-test unit test suite
│   └── build.mjs                   # Verification build pipeline
├── .gitignore                      # Git ignore file
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

### 2. Run Catalogue Validation
```bash
npm run validate
```
Validates [`data/catalogue.json`](data/catalogue.json) against all 16 integrity constraints.

### 3. Generate Asset Manifest
```bash
npm run manifest
```
Re-scans physical media files and regenerates [`data/asset-manifest.json`](data/asset-manifest.json).

### 4. Run the Unit Test Suite
```bash
npm test
```
Executes all 25 unit tests covering canonical schemas, negative defenses, and manifest verification.

### 5. Run Verification Build
```bash
npm run build
```
Executes the full pipeline: validation, manifest generation, and static asset integrity check.

---

## 6. Target DynamoDB Schema (`MorrowVideos`)

For Phase 4 AWS deployment, the canonical schema maps to a single-table DynamoDB design:

- **Partition Key (PK)**: `TITLE#<id>` (Movies) or `SERIES#<id>` (Series)
- **Sort Key (SK)**: `METADATA` or `SEASON#<num>#EP#<num>`
- **GSI-1 (Content Type & Rating)**: `GSI1PK = TYPE#<movie|series>`, `GSI1SK = RATING#<imdbRating>`
- **GSI-2 (Genre Discovery)**: `GSI2PK = GENRE#<genre>`, `GSI2SK = YEAR#<releaseYear>`

---

## 7. Next Steps: Phase 3 (Amazon S3 Setup)

1. Provision Amazon S3 media bucket with appropriate IAM policies.
2. Mirror folder structure (`videos/`, `posters/`, `backdrops/`, `subtitles/`).
3. Ingest high-definition video objects for pending titles (`VID005`, `VID006`, `VID007`).
4. Set up Amazon CloudFront distribution with Origin Access Control (OAC).
5. Update `mediaService` to resolve asset keys to CloudFront CDN endpoints.

---

## 8. Academic Evaluation Details
- **Student**: Vineesh
- **Course**: Cloud Computing (FT-III Assessment)
- **Course Code**: 21CSE362T
- **Project**: Morrow OTT Platform
