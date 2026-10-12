# Morrow OTT Platform — Phase 4 Backend API Architecture & AWS Deployment Guide

**Course:** Cloud Computing FT-III (21CSE362T)  
**Project:** Morrow — Design and Implementation of a Cloud-Based Video Streaming Platform  
**Phase:** 4 — Node.js Backend API, AWS Lambda & Amazon API Gateway HTTP API  
**Status:** Implementation Complete & Validated (Ready for AWS Console Deployment)  

---

## 1. Executive Summary & Architecture Overview

Phase 4 establishes the serverless REST-style API layer for Morrow. The backend runs on **AWS Lambda** (Node.js 24.x / 20.x ES Module runtime) and is exposed to clients through **Amazon API Gateway HTTP API** using a Lambda proxy integration (Payload format version 2.0).

```
+-----------------------------------------------------------------------------------------+
|                               MORROW OTT ARCHITECTURE                                   |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  [ Client Browser / Frontend UI ]                                                        |
|         |                                                                               |
|         v (HTTP /api/*)                                                                 |
|  +-----------------------------------------------------------------------------------+  |
|  | Amazon API Gateway HTTP API: "MorrowHttpApi"                                      |  |
|  | - Protocol: HTTP API                                                              |  |
|  | - Region: ap-southeast-2 (Sydney) / ap-south-1 (Mumbai)                             |  |
|  | - Stage: $default (Auto-Deploy)                                                   |  |
|  | - Routes: GET /api/health, GET /api/videos, GET /api/videos/{id}, series/episodes   |  |
|  +-----------------------------------------------------------------------------------+  |
|         | (Lambda Proxy Payload v2.0)                                                   |
|         v                                                                               |
|  +-----------------------------------------------------------------------------------+  |
|  | AWS Lambda: "MorrowCatalogApi"                                                    |  |
|  | - Runtime: nodejs24.x / nodejs20.x (ES Module)                                     |  |
|  | - Handler: index.handler                                                          |  |
|  | - Memory: 128 MB | Timeout: 10s                                                   |  |
|  | - IAM Role: AWSLambdaBasicExecutionRole (CloudWatch logs only)                    |  |
|  |                                                                                   |  |
|  |  +--------------------------+    +---------------------------------------------+  |  |
|  |  | Route Controllers        |    | Structured Logger                           |  |  |
|  |  | - /api/health            |    | - No sensitive credentials leaked           |  |  |
|  |  | - /api/videos (filters)  |    | - Latency & status logging to CloudWatch    |  |  |
|  |  | - /api/videos/{id}       |    +---------------------------------------------+  |  |
|  |  | - /api/series/episodes   |                                                     |  |
|  |  +--------------------------+                                                     |  |
|  |              |                                                                    |  |
|  |              v                                                                    |  |
|  |  +-----------------------------------------------------------------------------+  |  |
|  |  | Repository Factory Boundary (DATA_SOURCE=fixture)                           |  |  |
|  |  | - Phase 4: FixtureCatalogueRepository (Canonical Phase 2 dataset)            |  |  |
|  |  | - Phase 5 (Future): DynamoDbCatalogueRepository ('MorrowVideos' table)       |  |  |
|  |  | - Guard: Never silently falls back if DynamoDB fails or is missing          |  |  |
|  |  +-----------------------------------------------------------------------------+  |  |
|  +-----------------------------------------------------------------------------------+  |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

---

## 2. API Endpoint Contract

All endpoints return JSON responses conforming to the standard envelope contract:
- **Success:** `{ "success": true, "data": <payload> }`
- **Error:** `{ "success": false, "error": { "code": "<ERROR_CODE>", "message": "<HUMAN_MESSAGE>" } }`

All responses include standard CORS headers (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, OPTIONS`, `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With`).

### 2.1 GET /api/health
- **Purpose:** Verifies Lambda execution, connectivity, and API Gateway integration.
- **Status:** `200 OK`
- **Example Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "morrow-api"
  }
}
```

### 2.2 GET /api/videos
- **Purpose:** Returns catalogue titles matching optional query filters.
- **Query Parameters:**
  | Parameter | Type | Allowed Values | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `type` | string | `movie`, `series` | None | Filters by content type. Rejects any other value with 400. |
  | `genre` | string | max 50 chars | None | Case-insensitive substring match against `genres` array. |
  | `limit` | integer | `1` to `50` | `50` | Bounded pagination limit. Rejects values < 1 or > 50 with 400. |
- **Status:** `200 OK`
- **Example Request:** `GET /api/videos?type=movie&genre=Sci-Fi&limit=10`
- **Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "VID001",
      "title": "The Cloud Paradox",
      "contentType": "movie",
      "synopsis": "When an experimental distributed intelligence becomes self-aware across orbital relay networks, a team of cybersecurity architects must isolate the core before humanity loses control.",
      "genres": ["Sci-Fi", "Thriller"],
      "releaseYear": 2026,
      "language": "en",
      "durationSeconds": 45,
      "imdbRating": "8.6",
      "rating": "U/A 16+",
      "quality": "4K UHD",
      "audio": "Dolby Atmos",
      "posterKey": "media/thumbnails/cloud-intro.svg",
      "backdropKey": "media/thumbnails/cloud-intro.svg",
      "videoKey": "media/videos/cloud-intro.mp4",
      "availabilityStatus": "available",
      "isPlayable": true,
      "featured": true,
      "createdAt": "2026-03-15T18:30:00Z"
    }
  ]
}
```

### 2.3 GET /api/videos/{id}
- **Purpose:** Returns complete detail record for a single title.
- **Path Parameters:** `id` (alphanumeric, hyphens, underscores; 1-64 chars).
- **Status:** `200 OK` (found) or `404 Not Found` (unknown title) or `400 Bad Request` (malformed ID).
- **Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "VID001",
    "title": "The Cloud Paradox",
    "contentType": "movie",
    "synopsis": "When an experimental distributed intelligence becomes self-aware...",
    "genres": ["Sci-Fi", "Thriller"],
    "releaseYear": 2026,
    "durationSeconds": 45,
    "isPlayable": true
  }
}
```
- **Example Response (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "VIDEO_NOT_FOUND",
    "message": "The requested title with ID 'VID999' was not found."
  }
}
```

### 2.4 GET /api/series/{id}/episodes
- **Purpose:** Returns episodes for a series ordered deterministically (`seasonNum` ASC, `episodeNum` ASC).
- **Status Codes:**
  - `200 OK`: Valid series, returns episode list.
  - `400 Bad Request`: Title exists but is a movie (`INVALID_CONTENT_TYPE`).
  - `404 Not Found`: Series ID does not exist (`SERIES_NOT_FOUND`).
- **Example Response (200 OK for VID003):**
```json
{
  "success": true,
  "data": [
    {
      "id": "VID003-E1",
      "parentSeriesId": "VID003",
      "seasonNum": 1,
      "episodeNum": 1,
      "title": "Canopy Awakening",
      "synopsis": "Microscopic optical lenses capture the dawn activation...",
      "durationSeconds": 5,
      "videoKey": "media/videos/botanical-life.mp4",
      "thumbnailKey": "media/thumbnails/botanical-life.svg",
      "availabilityStatus": "available",
      "isPlayable": true
    }
  ]
}
```

---

## 3. Status Code and Error Code Reference

| Status Code | Error Code | Description |
| :--- | :--- | :--- |
| `200 OK` | — | Successful request. |
| `204 No Content` | — | Successful CORS preflight (`OPTIONS`). |
| `400 Bad Request` | `VALIDATION_ERROR` | Invalid query parameter (e.g. `limit > 50`, `type=podcast`) or illegal ID characters. |
| `400 Bad Request` | `INVALID_CONTENT_TYPE` | Requested series episodes on a title that is a movie (`VID001`). |
| `404 Not Found` | `VIDEO_NOT_FOUND` | Video ID does not exist in the catalogue. |
| `404 Not Found` | `SERIES_NOT_FOUND` | Series ID does not exist in the catalogue. |
| `404 Not Found` | `ROUTE_NOT_FOUND` | The requested URL path does not match any known API route. |
| `405 Method Not Allowed` | `METHOD_NOT_ALLOWED` | Disallowed HTTP method (e.g. `POST`, `PUT`, `DELETE` on read-only endpoints). |
| `500 Internal Error` | `INTERNAL_SERVER_ERROR` | Unexpected runtime exception (stack traces shielded from client). |
| `503 Unavailable` | `DATA_SOURCE_UNAVAILABLE` | Explicit data source requested (e.g. `DATA_SOURCE=dynamodb`) is unconfigured in Phase 4. |

---

## 4. Repository Abstraction & Phase 5 Boundary Guard

Phase 4 avoids prematurely hardcoding DynamoDB while guaranteeing that Phase 5 can swap in database persistence without rewriting routes.

1. **Explicit Setting:** Controlled via environment variable `DATA_SOURCE=fixture`.
2. **Phase 5 Guard:** If `DATA_SOURCE=dynamodb` is passed in Phase 4, the repository factory immediately throws:
   ```json
   {
     "success": false,
     "error": {
       "code": "DATA_SOURCE_UNAVAILABLE",
       "message": "DynamoDB data source is planned for Phase 5 and is not yet configured. Set DATA_SOURCE=fixture for the Phase 4 development adapter."
     }
   }
   ```
   **Critical Rule:** The backend *never* silently falls back from a failed or unconfigured database connection to fixture data.
3. **Availability Semantics:** Incomplete or unverified assets (`VID005` Solaris Drift, `VID006` Silent Echoes) maintain `availabilityStatus: "metadata_only"` and `isPlayable: false`. Unverified media is never claimed to be playable.

---

## 5. Lambda Deployment Package Specification

The automated packaging tool (`scripts/package-lambda.mjs`) builds a clean, lightweight ZIP archive:

- **Artifact Path:** `dist/morrow-backend-lambda.zip`
- **Compressed Size:** ~15.59 KB
- **File Count:** 13 files
- **Root Entry Point:** `index.mjs` (exports `handler`)
- **Package Contents:**
  ```
  dist/morrow-backend-lambda.zip
  ├── index.mjs                                 <-- Lambda entry point
  ├── package.json                              <-- ES Module declaration
  ├── data/
  │   ├── catalogue-fixture.json                <-- Canonical Phase 2 fixture
  │   └── catalogue.json
  └── src/
      ├── handler.mjs                           <-- Event router & logger
      ├── routes/
      │   ├── health.mjs                        <-- GET /api/health
      │   ├── videos.mjs                        <-- GET /api/videos, GET /api/videos/{id}
      │   └── series.mjs                        <-- GET /api/series/{id}/episodes
      ├── repository/
      │   ├── baseRepository.mjs                <-- Abstract contract & errors
      │   ├── catalogueRepository.mjs           <-- Repository factory & boundary guard
      │   └── fixtureRepository.mjs             <-- Phase 4 fixture implementation
      └── utils/
          ├── response.mjs                      <-- Proxy response formatter & CORS
          └── validator.mjs                     <-- Path and query validator
  ```
- **Strict Exclusions:**
  - 0 frontend source files (`frontend/`, `index.html`, `app.js`, `styles.css`)
  - 0 media video files or large SVG artwork (`media/`)
  - 0 development dependencies or test files (`scripts/`)
  - 0 `.git` repository files
  - 0 credentials, secrets, or AWS keys

---

## 6. AWS Console Deployment Guide (Step-by-Step)

Follow these manual steps in the AWS Console to deploy the backend.

### Prerequisites & Account Verification
1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. Verify your AWS Account ID (e.g. `754860800809`).
3. Select your designated AWS Region:
   - For this account: **Asia Pacific (Sydney) `ap-southeast-2`** (or **Asia Pacific (Mumbai) `ap-south-1`** for standard accounts).
4. Confirm you are well within AWS Free Tier limits (Lambda offers 1 million free requests/month; API Gateway HTTP API offers 1 million free calls/month for 12 months).

---

### Step 1: Create the Minimal IAM Execution Role
1. Navigate to **IAM** -> **Roles** -> **Create role**.
2. Select **Trusted entity type:** `AWS service`.
3. Select **Use case:** `Lambda`. Click **Next**.
4. In the **Permissions policies** filter, search for and check:
   - `AWSLambdaBasicExecutionRole` (Managed policy allowing CloudWatch Logs writes).
5. Click **Next**.
6. Set **Role name:** `MorrowCatalogApiExecutionRole`.
7. Set **Description:** `Minimal execution role for MorrowCatalogApi with basic CloudWatch logging permissions`.
8. Click **Create role**.

> [!NOTE]
> Do not attach DynamoDB, S3 admin, Cognito, or Administrator policies. Least privilege is maintained.

---

### Step 2: Create the AWS Lambda Function
1. Navigate to **AWS Lambda** -> **Functions** -> **Create function**.
2. Select **Author from scratch**.
3. Configure Basic Information:
   - **Function name:** `MorrowCatalogApi`
   - **Runtime:** `Node.js 20.x` or `Node.js 22.x` / `Node.js 24.x` (ES Module supported).
   - **Architecture:** `x86_64`.
4. Under **Permissions**, expand **Change default execution role**:
   - Choose **Use an existing role**.
   - Select `MorrowCatalogApiExecutionRole`.
5. Click **Create function**.

---

### Step 3: Configure Lambda Settings & Environment
1. In the function details page, switch to the **Configuration** tab:
2. **General configuration** -> Click **Edit**:
   - **Memory:** `128 MB` (or `256 MB`).
   - **Timeout:** `10 seconds`.
   - Click **Save**.
3. **Environment variables** -> Click **Edit** -> **Add environment variable**:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production runtime flag |
   | `DATA_SOURCE` | `fixture` | Explicit Phase 4 development fixture mode |
   | `CORS_ALLOW_ORIGIN` | `*` | Allowed development origin (or your local URL) |
   - Click **Save**.
4. **Runtime settings** (below the code editor):
   - Confirm **Handler** is set to: `index.handler`.
   - If not, click **Edit** and change Handler to `index.handler`, then click **Save**.

---

### Step 4: Upload the Lambda ZIP Package
1. On the **Code** tab, click **Upload from** -> **.zip file**.
2. Click **Upload** and browse to:
   `c:\Users\vinee\Downloads\Cloud Computing Project\dist\morrow-backend-lambda.zip`
3. Click **Save**.
4. Once uploaded, the code tree will show `index.mjs`, `package.json`, `data/`, and `src/`.

---

### Step 5: Run a Test Event in AWS Lambda Console
1. Switch to the **Test** tab in the Lambda console.
2. Set **Event name:** `TestHealthEndpoint`.
3. In the Event JSON editor, paste:
   ```json
   {
     "version": "2.0",
     "routeKey": "GET /api/health",
     "rawPath": "/api/health",
     "requestContext": {
       "http": {
         "method": "GET",
         "path": "/api/health"
       }
     }
   }
   ```
4. Click **Test**.
5. **Expected Execution Result:** Status `Succeeded` with response:
   ```json
   {
     "statusCode": 200,
     "headers": {
       "content-type": "application/json; charset=utf-8",
       "access-control-allow-origin": "*",
       "access-control-allow-methods": "GET, OPTIONS",
       "access-control-allow-headers": "Content-Type, Authorization, X-Requested-With",
       "access-control-max-age": "86400",
       "x-content-type-options": "nosniff"
     },
     "body": "{\"success\":true,\"data\":{\"status\":\"ok\",\"service\":\"morrow-api\"}}"
   }
   ```

---

### Step 6: Create the Amazon API Gateway HTTP API
1. Navigate to **API Gateway** -> **Create API**.
2. Find **HTTP API** -> Click **Build**.
3. In **Step 1 — Create an API**:
   - Click **Add integration** -> Select **Lambda**.
   - **Lambda function:** Select `MorrowCatalogApi`.
   - **API name:** `MorrowHttpApi`.
   - Click **Next**.
4. In **Step 2 — Configure routes**:
   Create the following four routes (all integrated with `MorrowCatalogApi`):
   | Method | Resource Path | Integration Target |
   | :--- | :--- | :--- |
   | `GET` | `/api/health` | `MorrowCatalogApi` |
   | `GET` | `/api/videos` | `MorrowCatalogApi` |
   | `GET` | `/api/videos/{id}` | `MorrowCatalogApi` |
   | `GET` | `/api/series/{id}/episodes` | `MorrowCatalogApi` |
   - *(Optional greedy route: `ANY /{proxy+}` can also be added for development convenience).*
   - Click **Next**.
5. In **Step 3 — Define stages**:
   - Keep stage name: `$default`.
   - Ensure **Auto-deploy** is enabled (`ON`).
   - Click **Next**.
6. In **Step 4 — Review and create**:
   - Click **Create**.
7. AWS API Gateway will automatically grant the necessary `lambda:InvokeFunction` permission to the HTTP API.

---

### Step 7: Configure CORS in API Gateway
1. In the left navigation of `MorrowHttpApi`, click **CORS**.
2. Click **Configure**:
   - **Access-Control-Allow-Origin:** `*` (or `http://localhost:3000`).
   - **Access-Control-Allow-Methods:** `GET`, `OPTIONS`.
   - **Access-Control-Allow-Headers:** `Content-Type`, `Authorization`, `X-Requested-With`.
   - **Access-Control-Max-Age:** `86400`.
3. Click **Save**.

---

### Step 8: Test Deployed API via PowerShell
The live API Gateway HTTP API has been provisioned and verified:
- **API ID:** `2wz1iej67d`
- **Invoke Base URL:** `https://2wz1iej67d.execute-api.ap-southeast-2.amazonaws.com`

You can test directly in PowerShell:

```powershell
# Set the real deployed API Gateway invoke URL
$baseUrl = "https://2wz1iej67d.execute-api.ap-southeast-2.amazonaws.com"

# 1. Health Endpoint Test (Expected: 200 OK)
Invoke-RestMethod "$baseUrl/api/health"

# 2. Catalogue Listing Test (Expected: 7 items)
(Invoke-RestMethod "$baseUrl/api/videos").data.Count

# 3. Filtering Test: Movies Only (Expected: 4 movies)
(Invoke-RestMethod "$baseUrl/api/videos?type=movie").data.Count

# 4. Existing Video Detail Test (VID001: The Cloud Paradox)
(Invoke-RestMethod "$baseUrl/api/videos/VID001").data.title

# 5. Series Episodes Test (VID003: Flora: The Secret Kingdom)
(Invoke-RestMethod "$baseUrl/api/series/VID003/episodes").data

# 6. Unknown Title (Expected: 404 Error)
try {
    Invoke-RestMethod "$baseUrl/api/videos/non-existent-id"
} catch {
    Write-Host "Caught Expected 404:" $_.Exception.Response.StatusCode.value__
}
```

---

## 7. CloudWatch Logs and Diagnostics

Logs are automatically emitted to Amazon CloudWatch under the log group:
`/aws/lambda/MorrowCatalogApi`

### Log Characteristics:
- **Format:** Structured JSON lines (`level`, `type`, `method`, `path`, `statusCode`, `latencyMs`, `requestId`).
- **Data Protection:** No authentication tokens, client IP addresses, video streams, or AWS secrets are written to logs.
- **Errors:** Handled validation errors log as `WARN`; unexpected exceptions log as `ERROR` with error names and safe diagnostics.

---

## 8. Verification & Local Testing Commands

All commands run with zero cloud credentials and 100% reproducibility:

```bash
# 1. Run full test suite (Catalogue integrity + Backend API tests)
npm test

# 2. Run backend API tests only (67 unit and simulated v2 proxy tests)
npm run backend:test

# 3. Package and verify Lambda deployment artifact
npm run backend:package

# 4. Run verification build (Phase 2 catalogue + Phase 3 S3 plan + Phase 4 Lambda ZIP)
npm run build

# 5. Start local server with integrated Lambda backend
npm start
```

---

## 9. Phase 5 & Phase 6 Forward Compatibility

| Aspect | Phase 4 (Current) | Phase 5 (Next Phase) | Phase 6 (Final Integration) |
| :--- | :--- | :--- | :--- |
| **Data Source** | `DATA_SOURCE=fixture` | `DATA_SOURCE=dynamodb` | DynamoDB backed |
| **Data Storage** | `data/catalogue-fixture.json` | Amazon DynamoDB table `MorrowVideos` | DynamoDB + DAX/Cache |
| **IAM Scope** | `AWSLambdaBasicExecutionRole` | Add `dynamodb:GetItem`, `dynamodb:Query`, `dynamodb:Scan` | Least privilege preserved |
| **Public Entry** | Direct API Gateway endpoint | Direct API Gateway endpoint | Amazon CloudFront `/api/*` origin |
| **Browser CORS** | Explicit CORS origin headers | Explicit CORS origin headers | Same-origin through CloudFront |
