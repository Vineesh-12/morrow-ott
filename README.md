# Morrow — A World of Stories

> **Premium OTT Entertainment Platform**  
> *Cloud Computing FT-III Academic Assessment (Course Code: 21CSE362T)*

[![Tests](https://img.shields.io/badge/Tests-142%20Passed-brightgreen)](file:///scripts/test-dynamodb-repository.mjs)
[![Validation](https://img.shields.io/badge/Validation-16%2F16%20Rules%20Passing-blue)](file:///scripts/validate-catalogue.mjs)
[![Phase 3](https://img.shields.io/badge/Phase%203-Amazon%20S3%20Live%20Verified-brightgreen)](file:///docs/s3-asset-architecture.md)
[![Phase 4](https://img.shields.io/badge/Phase%204-Lambda%20%26%20API%20Gateway%20Ready-brightgreen)](file:///docs/backend-api-architecture.md)
[![Phase 5](https://img.shields.io/badge/Phase%205-DynamoDB%20Integration%20Ready-brightgreen)](file:///docs/dynamodb-catalogue-architecture.md)
[![AWS Region](https://img.shields.io/badge/AWS%20Region-ap--southeast--2%20(Sydney)-purple)](file:///docs/dynamodb-catalogue-architecture.md)
[![Runtime](https://img.shields.io/badge/Runtime-Node.js%2024.x%20%2F%2020.x%20ESM-green)](file:///backend/index.mjs)

---

## 1. Project Overview

**Morrow** is a cinema-inspired Over-The-Top (OTT) media streaming web application designed to demonstrate a complete, production-grade cloud streaming architecture. Built with an editorial dark theme (charcoal `#111315`, deep slate `#1C1E20`, warm ivory `#F2EEE8`, and muted copper `#C87552`), Morrow delivers seamless video browsing, episode exploration, responsive native playback, watchlist tracking, and an AI-assisted entertainment concierge grounded in verified catalogue metadata.

### Target AWS Architecture
- **Amazon S3**: Private object storage for media assets (`posters/`, `backdrops/`, `videos/`, `subtitles/`).
- **Amazon CloudFront**: Global Content Delivery Network (CDN) with Origin Access Control (OAC) for secure, low-latency streaming.
- **Amazon API Gateway**: HTTP API routing requests to backend microservices.
- **AWS Lambda (Node.js)**: Serverless compute executing catalogue queries and business logic.
- **Amazon DynamoDB (`MorrowVideos`)**: Serverless NoSQL database storing catalogue records, seasons, and episodes.
- **Amazon CloudWatch**: End-to-end diagnostics, structured logs, and metrics.
- **Morrow AI Concierge**: Catalogue-grounded AI discovery assistant.

---

## 2. Project Milestones & Implementation History

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
5. **AWS Console Runbook**: Step-by-step instructions for creating a private S3 bucket in `ap-southeast-2` (Sydney) with Block Public Access enabled and SSE-S3 encryption.
6. **CloudFront OAC Integration Plan**: Documented SigV4 Origin Access Control policy and dynamic client URL resolution.

### Phase 4: Node.js Backend API, AWS Lambda & API Gateway HTTP API
1. **Serverless Lambda Service**: Developed lightweight Node.js ES Module Lambda service in `backend/` (`index.handler`).
2. **Standard REST Endpoints**: Implemented `GET /api/health`, `GET /api/videos` (with `type`, `genre`, and `limit` filtering), `GET /api/videos/{id}`, and `GET /api/series/{id}/episodes`.
3. **Phase 4 Development Fixture Repository**: Concrete repository adapter backed by the Phase 2 canonical dataset (`DATA_SOURCE=fixture`).
4. **Defensive Isolation Guard**: Strict data source verification ensuring unconfigured sources fail safely with HTTP 503 instead of silent fallback.
5. **Input Validation & Security**: Rigorous validation on query and path parameters to prevent injection or unbounded scans.
6. **Automated Test Suite**: 67 automated unit and simulated API Gateway v2 integration tests.
7. **Repeatable Packaging Pipeline**: `npm run backend:package` generates isolated deployment artifact (`dist/morrow-backend-lambda.zip`, ~18.75 KB).
8. **AWS Deployment Guide**: Comprehensive runbook in [`docs/backend-api-architecture.md`](docs/backend-api-architecture.md).

### Phase 5: Amazon DynamoDB Catalogue Integration
1. **Access Pattern Audit**: Evaluated query patterns for point lookups (`/api/videos/{id}`), filtered listings (`/api/videos`), and series episodes (`/api/series/{id}/episodes`).
2. **Justified Table Design**: Selected simple primary key schema with partition key `id` (String) and on-demand capacity (`PAY_PER_REQUEST`) on table `MorrowVideos`. Avoided speculative GSIs to minimize AWS costs.
3. **Atomic Series & Episode Storage**: Embedded canonical `seasons` and `episodes` arrays directly inside series documents, enabling single-read (1 RRU) deterministic episode retrieval.
4. **Production Repository Layer**: Implemented `DynamoDbCatalogueRepository` (`backend/src/repository/dynamoDbRepository.mjs`) using AWS SDK v3 `DynamoDBDocumentClient`.
5. **Zero Silent Fallback**: Verified that missing tables, IAM permission denials, or throttling strictly return HTTP 503 `DatabaseError` without exposing credentials or falling back to mock fixtures.
6. **Catalogue Migration & Import Tooling**: Created repeatable script (`scripts/import-catalogue-dynamodb.mjs`) supporting default `--dry-run` inspection and live `--execute` batch writing.
7. **Least-Privilege IAM Policy**: Formulated strict read-only execution policy (`dynamodb:GetItem`, `dynamodb:Scan`, `dynamodb:DescribeTable`) scoped solely to `MorrowVideos`.
8. **142 Automated Tests**: Comprehensive test coverage across catalogue rules, API endpoints, and mock DocumentClient operations with zero failures.
9. **Authoritative Architecture Guide**: Complete operational runbook in [`docs/dynamodb-catalogue-architecture.md`](docs/dynamodb-catalogue-architecture.md).

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
├── backend/                        # AWS Lambda Microservice (Node.js ES Module)
│   ├── index.mjs                   # AWS Lambda entry point (index.handler)
│   ├── package.json                # Standalone ES Module declaration
│   └── src/
│       ├── handler.mjs             # API Gateway HTTP API v2 event router & logger
│       ├── routes/                 # Controllers (/api/health, /api/videos, /api/series)
│       ├── repository/             # Repository boundary (DynamoDB & fixture adapters)
│       │   ├── baseRepository.mjs     # Abstract ICatalogueRepository interface
│       │   ├── catalogueRepository.mjs# Environment-driven factory (fixture / dynamodb)
│       │   ├── dynamoDbRepository.mjs # AWS SDK v3 DocumentClient production repository
│       │   └── fixtureRepository.mjs  # Local development fixture repository
│       └── utils/                  # Normalizer, response formatters & input validators
│           ├── normalizer.mjs         # Truth-in-availability & UI backward compatibility
│           ├── response.mjs           # HTTP response formatters & error shielding
│           └── validator.mjs          # Query & path parameter validation
├── data/
│   ├── catalogue.json              # Canonical catalogue dataset (7 titles)
│   ├── catalogue-adapter.js        # Normalizer & S3 key mapping adapter
│   └── asset-manifest.json         # Automated asset manifest with S3 metadata (29 entries)
├── dist/
│   └── morrow-backend-lambda.zip   # Generated AWS Lambda deployment package (~18.75 KB)
├── docs/
│   ├── catalogue-data-design.md    # Phase 2 canonical data model & schema spec
│   ├── s3-asset-architecture.md    # Phase 3 S3 asset architecture & AWS Console runbook
│   ├── backend-api-architecture.md # Phase 4 Lambda API architecture & AWS deployment guide
│   └── dynamodb-catalogue-architecture.md # Phase 5 DynamoDB architecture & migration guide
├── frontend/
│   ├── index.html                  # Cinema-first single-page app (SPA)
│   ├── styles.css                  # Custom styling (brand colors, layout, player)
│   ├── app.js                      # Application controller, routes, player, AI
│   ├── server.js                   # Node.js dev server with integrated Lambda backend
│   └── media/                      # Local video clips & SVG thumbnail assets
├── media/                          # Source media repository
│   ├── videos/                     # MP4 video files
│   └── thumbnails/                 # SVG artwork posters
├── scripts/
│   ├── generate-asset-manifest.mjs # Scans media and outputs asset-manifest.json
│   ├── s3-upload-plan.mjs          # Phase 3 S3 dry-run planner & AWS CLI commands
│   ├── validate-catalogue.mjs      # 16-rule automated catalogue validator
│   ├── test-catalogue.mjs          # 33-test catalogue integrity suite
│   ├── test-backend-api.mjs        # 69-test backend Lambda API & isolation suite
│   ├── test-dynamodb-repository.mjs# 40-test DynamoDB mock repository suite
│   ├── import-catalogue-dynamodb.mjs# Phase 5 DynamoDB catalogue migration & import tool
│   ├── package-lambda.mjs          # AWS Lambda deployment packager
│   └── build.mjs                   # Verification build pipeline
├── .gitignore                      # Git ignore file (ignores large videos & AWS creds)
├── package.json                    # Root manifest and npm script runner
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
Starts the local development server at **`http://localhost:3000`** with integrated Lambda backend routing (`/api/*`).

### 2. Run the Complete Test Suite (142 Tests)
```bash
npm test
```
Executes all three test suites:
- 33 catalogue & manifest tests (`test-catalogue.mjs`)
- 69 backend Lambda API & defensive isolation tests (`test-backend-api.mjs`)
- 40 DynamoDB DocumentClient repository tests (`test-dynamodb-repository.mjs`)

### 3. Run DynamoDB Repository Tests Only
```bash
npm run dynamodb:test
```
Runs 40 automated tests verifying `GetItem`, `Scan`, filters, series episode ordering, and AWS SDK exception shielding.

### 4. Run Catalogue Import Dry-Run
```bash
npm run dynamodb:import
```
Validates the canonical catalogue and previews the 7 DynamoDB items to be written without modifying cloud resources.

### 5. Package AWS Lambda Deployment Artifact
```bash
npm run backend:package
```
Generates and inspects `dist/morrow-backend-lambda.zip` (~18.75 KB) ready for AWS Lambda upload.

### 6. Run Verification Build
```bash
npm run build
```
Executes the full pipeline: catalogue validation, manifest generation, static frontend check, S3 upload verification, Lambda packaging, and DynamoDB import readiness.

---

## 6. Finalized DynamoDB Schema (`MorrowVideos`)

For the Phase 5 AWS deployment, the canonical schema maps to a simple, cost-effective primary key design:

- **Table Name**: `MorrowVideos`
- **Partition Key (PK)**: `id` (String) — e.g. `VID001` through `VID007`
- **Sort Key**: *None*
- **Capacity Mode**: `PAY_PER_REQUEST` (On-Demand)
- **Secondary Indexes**: *None* (Controlled scan across 7 items consumes exactly 1 RRU)
- **Embedded Document Design**: Series records store full `seasons` and `episodes` arrays directly in the item, allowing deterministic single-query episode resolution without multi-table joins.

---

## 7. Next Step: Phase 6 (Amazon CloudFront & Full Integration)

1. **Amazon CloudFront Distribution**:
   - Establish CloudFront distribution as the main public entry point for the Morrow OTT platform.
   - Configure Origin Access Control (OAC) to securely serve private S3 media assets and frontend SPA files.
2. **Unified API Gateway Origin**:
   - Route `/api/*` requests through CloudFront to Amazon API Gateway (`MorrowHttpApi`), eliminating CORS overhead.
3. **End-to-End Playback**:
   - Stream cloud video assets seamlessly from CloudFront CDN using metadata retrieved dynamically from Amazon DynamoDB.

---

## 8. Academic Evaluation Details
- **Student**: Vineesh
- **Course**: Cloud Computing (FT-III Assessment)
- **Course Code**: 21CSE362T
- **Project**: Morrow OTT Platform
