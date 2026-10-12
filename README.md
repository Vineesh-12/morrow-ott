# Morrow — A World of Stories

> **Premium OTT Entertainment Platform**  
> *Cloud Computing FT-III Academic Assessment (Course Code: 21CSE362T)*

[![Tests](https://img.shields.io/badge/Tests-168%20Passed-brightgreen)](file:///scripts/test-phase-6-cloudfront.mjs)
[![Validation](https://img.shields.io/badge/Validation-16%2F16%20Rules%20Passing-blue)](file:///scripts/validate-catalogue.mjs)
[![Phase 6 Live](https://img.shields.io/badge/Phase%206-CloudFront%20Live%20Deployed-brightgreen)](https://d10on8fmafqm1i.cloudfront.net)
[![CloudFront](https://img.shields.io/badge/CloudFront-d10on8fmafqm1i.cloudfront.net-orange)](https://d10on8fmafqm1i.cloudfront.net)
[![AWS Region](https://img.shields.io/badge/AWS%20Region-ap--southeast--2%20(Sydney)-purple)](file:///docs/phase-6-cloudfront-deployment.md)
[![Runtime](https://img.shields.io/badge/Runtime-Node.js%2024.x%20%2F%2020.x%20ESM-green)](file:///backend/index.mjs)

---

## 1. Project Overview

**Morrow** is a cinema-inspired Over-The-Top (OTT) media streaming web application designed to demonstrate a complete, production-grade cloud streaming architecture. Built with an editorial dark theme (charcoal `#111315`, deep slate `#1C1E20`, warm ivory `#F2EEE8`, and muted copper `#C87552`), Morrow delivers seamless video browsing, episode exploration, responsive native playback, watchlist tracking, and an AI-assisted entertainment concierge grounded in verified catalogue metadata.

### Live Production Deployment
- **Global CloudFront URL**: **[`https://d10on8fmafqm1i.cloudfront.net`](https://d10on8fmafqm1i.cloudfront.net)**
- **CloudFront Distribution ID**: `E3CQS64ZH2JAM1`
- **Origin Access Control (OAC)**: `E3STZ204UN3KSM` (`MorrowS3Oac`, SigV4 signing)
- **API Gateway HTTP API**: `https://2wz1iej67d.execute-api.ap-southeast-2.amazonaws.com`
- **AWS Lambda Function**: `MorrowCatalogApi` (Node.js 24.x / 20.x ESM, `index.handler`)
- **Amazon DynamoDB Table**: `MorrowVideos` (On-Demand `PAY_PER_REQUEST`, 7 records)
- **Private Amazon S3 Bucket**: `morrow-assets-vineesh-21cse362t` (`ap-southeast-2`, Block All Public Access enabled)

---

## 2. Project Milestones & Implementation History

### Phase 2: Catalogue & Data Design
1. **Frontend Audit**: Inspected existing routes, HTML5 video player, `localStorage` watch history, and media paths.
2. **Canonical Data Model**: Authoritative TypeScript/JSON schemas for movies, series, seasons, and episodes.
3. **Truth-in-Availability**: Strict availability engine ensuring titles are marked playable **only** when media assets exist and are verified on disk.
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
8. **Live Cloud Migration**: 7 canonical items successfully populated into live AWS DynamoDB table `MorrowVideos` in `ap-southeast-2`.

### Phase 6: Amazon CloudFront Deployment & Frontend Integration (Completed & Live)
1. **Dual-Origin Global Architecture**: Created a single Amazon CloudFront CDN distribution (`E3CQS64ZH2JAM1`) unifying the static SPA, media assets, and backend API under one HTTPS domain (`https://d10on8fmafqm1i.cloudfront.net`).
2. **Origin Access Control (OAC)**: Replaced legacy OAI with AWS-recommended OAC (`E3STZ204UN3KSM`, SigV4 signing). Attached a strict bucket policy to `morrow-assets-vineesh-21cse362t` granting `s3:GetObject` solely to CloudFront distribution `E3CQS64ZH2JAM1`. Block All Public Access remains enabled; direct S3 access returns HTTP 403 Forbidden.
3. **Same-Origin Relative Routing (Zero CORS)**: Refactored frontend API calls to use relative same-origin paths (`/api/health`, `/api/videos`, `/api/videos/{id}`). Both UI and API reside on the same CloudFront host, completely eliminating cross-origin overhead and preflight requests.
4. **CloudFront Function for SPA Client-Side Routing**: Authored, published, and associated `MorrowSpaRouter` CloudFront Function (`scripts/cf-spa-function.js`) to viewer-request on the default S3 behavior. Extensionless SPA deep links (such as `/title/VID001` or `/my-list`) are rewritten to `/index.html` while preserving file requests (`.svg`, `.mp4`, `.css`, `.js`).
5. **Dynamic Media Key Resolution**: Enhanced `mediaService.resolveUrl` to deterministically map canonical media keys (`posters/*`, `videos/*`, `backdrops/*`) to CloudFront root paths, safely handling legacy paths without creating duplicate slashes or false playable URLs.
6. **Zero Silent Mock Fallback**: Production frontend renders a clear error banner with a retry button on API failure instead of silently substituting mock fixtures.
7. **Automated Test Suite (168 Tests Total)**: Authored 26 Phase 6 tests (`scripts/test-phase-6-cloudfront.mjs`) covering URL mappings, SPA rewriting, secrets auditing, and distribution specifications. All 168 tests pass with zero failures.
8. **Deployment Guide & Automation**: Complete runbook in [`docs/phase-6-cloudfront-deployment.md`](docs/phase-6-cloudfront-deployment.md) documenting S3 root asset staging, CloudFront dual-origin setup, cache policies, and cache invalidation workflows.

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
- **`available`**: Video file verified on disk and S3. Native HTML5 playback is fully enabled.
- **`metadata_only`**: Information exists in the catalogue; video upload pending. Playback blocked with descriptive banner.
- **`coming_soon`**: Title scheduled for future release. Player disabled with a "Coming Soon" badge.
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
│   ├── frontend/                   # Staged production SPA build for S3 bucket root
│   │   ├── index.html              # Clean single-page application entry point
│   │   ├── styles.css              # Editorial brand styles
│   │   └── app.js                  # Frontend client with relative API routing
│   └── morrow-backend-lambda.zip   # Generated AWS Lambda deployment package (~18.75 KB)
├── docs/
│   ├── catalogue-data-design.md    # Phase 2 canonical data model & schema spec
│   ├── s3-asset-architecture.md    # Phase 3 S3 asset architecture & AWS Console runbook
│   ├── backend-api-architecture.md # Phase 4 Lambda API architecture & AWS deployment guide
│   ├── dynamodb-catalogue-architecture.md # Phase 5 DynamoDB architecture & migration guide
│   └── phase-6-cloudfront-deployment.md  # Phase 6 CloudFront CDN & frontend integration guide
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
│   ├── build.mjs                   # Verification build & frontend staging pipeline
│   ├── package-lambda.mjs          # AWS Lambda deployment packager
│   ├── generate-asset-manifest.mjs # Scans media and outputs asset-manifest.json
│   ├── s3-upload-plan.mjs          # Phase 3 S3 dry-run planner & AWS CLI commands
│   ├── import-catalogue-dynamodb.mjs# Phase 5 DynamoDB catalogue migration & import tool
│   ├── validate-catalogue.mjs      # 16-rule automated catalogue validator
│   ├── test-catalogue.mjs          # 33-test catalogue integrity suite
│   ├── test-backend-api.mjs        # 69-test backend Lambda API & isolation suite
│   ├── test-dynamodb-repository.mjs# 40-test DynamoDB mock repository suite
│   ├── test-phase-6-cloudfront.mjs # 26-test CloudFront integration & SPA router suite
│   ├── cf-spa-function.js          # CloudFront Function for SPA deep-link routing
│   ├── cloudfront-distribution.json# Dual-origin CloudFront distribution specification
│   └── s3-oac-policy.json          # Private S3 bucket policy for CloudFront OAC
├── .gitignore                      # Git ignore file (ignores large videos & AWS creds)
├── package.json                    # Root manifest and npm script runner
└── README.md                       # Authoritative project documentation
```

---

## 5. Quick Start & Execution

### Prerequisites
- Node.js (v18+ recommended, tested on v22)

### 1. Start the Local Development Server
```bash
npm start
```
Starts the local development server at **`http://localhost:3000`** with integrated Lambda backend routing (`/api/*`).

### 2. Run the Complete Test Suite (168 Tests)
```bash
npm test
```
Executes all four automated test suites with 100% pass rate:
- **33 tests**: Catalogue & manifest validation (`test-catalogue.mjs`)
- **69 tests**: Backend Lambda API & defensive isolation (`test-backend-api.mjs`)
- **40 tests**: DynamoDB DocumentClient repository operations (`test-dynamodb-repository.mjs`)
- **26 tests**: Phase 6 CloudFront integration, SPA rewriting & media URLs (`test-phase-6-cloudfront.mjs`)

### 3. Run Phase 6 CloudFront Tests Only
```bash
npm run test:cloudfront
```
Runs 26 automated tests verifying media key resolution, SPA route rewriting, secret auditing, and CloudFront distribution specifications.

### 4. Build & Stage Production Frontend
```bash
npm run build
```
Executes the full pipeline: catalogue validation, manifest generation, static frontend check, S3 upload verification, Lambda packaging, and stages production frontend assets into `dist/frontend/` ready for S3 root upload.

---

## 6. CloudFront Verification Matrix

| Endpoint | Method | Destination / Origin | Expected Result | Live Status |
|---|---|---|---|---|
| `https://d10on8fmafqm1i.cloudfront.net/` | `GET` | S3 Origin (via OAC) | Serves `index.html` (HTTP 200) | **Verified (200 OK)** |
| `https://d10on8fmafqm1i.cloudfront.net/api/health` | `GET` | API Gateway -> Lambda | `{"success":true,"data":{"status":"ok"}}` | **Verified (200 OK)** |
| `https://d10on8fmafqm1i.cloudfront.net/api/videos` | `GET` | API Gateway -> Lambda -> DynamoDB | 7 catalogue items JSON | **Verified (200 OK)** |
| `https://d10on8fmafqm1i.cloudfront.net/api/videos/VID001` | `GET` | API Gateway -> Lambda -> DynamoDB | Title details for *The Cloud Paradox* | **Verified (200 OK)** |
| `https://d10on8fmafqm1i.cloudfront.net/posters/cloud-intro.svg` | `GET` | S3 Origin (via OAC) | SVG poster image | **Verified (200 OK)** |
| `https://d10on8fmafqm1i.cloudfront.net/videos/cloud-intro.mp4` | `GET` | S3 Origin (via OAC) | MP4 video byte-stream | **Verified (200 OK)** |
| `https://d10on8fmafqm1i.cloudfront.net/title/VID001` | `GET` | CloudFront Function -> S3 `/index.html` | SPA entry point on refresh | **Verified (200 OK)** |
| `https://morrow-assets-vineesh-21cse362t.s3.../index.html` | `GET` | Direct Amazon S3 | Access Denied | **Verified (403 Forbidden)** |

---

## 7. Next Step: Phase 7 (Amazon Cognito Authentication & User Profiles)

1. **Amazon Cognito User Pool & App Client**:
   - Establish managed authentication for user registration, email verification, and secure JWT issuance.
2. **Authenticated API Gateway Routes**:
   - Secure personal user actions (`POST /api/user/watchlist`, `POST /api/user/progress`) using Cognito JWT authorizer.
3. **Multi-User DynamoDB Persistence**:
   - Introduce user-scoped tables (`MorrowUsers`, `MorrowWatchlist`) for cloud-persisted cross-device watch history.
4. **CloudFront Signed URLs / Cookies (Protected Media)**:
   - Restrict full-length video playback URLs to authenticated, active sessions using CloudFront signed cookies.

---

## 8. Academic Evaluation Details
- **Student**: Vineesh
- **Course**: Cloud Computing (FT-III Assessment)
- **Course Code**: 21CSE362T
- **Project**: Morrow OTT Platform
