# Morrow — Amazon CloudFront Deployment & Frontend Integration Guide (Phase 6)

> **Course**: Cloud Computing FT-III Academic Assessment (Course Code: 21CSE362T)  
> **Student**: Vineesh  
> **Component**: Amazon CloudFront Global CDN, Dual-Origin Architecture & Frontend Integration  
> **Target CloudFront Domain**: `https://d10on8fmafqm1i.cloudfront.net`  
> **CloudFront Distribution ID**: `E3CQS64ZH2JAM1`  
> **Assigned AWS Region**: `ap-southeast-2` (Sydney) *(Origin architecture portable to `ap-south-1` Mumbai)*

---

## 1. Executive Summary & Objective

In **Phase 6**, the entire Morrow OTT platform is unified under a single, production-grade **Amazon CloudFront** distribution. The browser accesses the website, streams MP4 video, loads SVG artwork, and queries the catalogue API through **one unified HTTPS CloudFront domain**.

```
                           User's Browser (Single Origin)
                                        │
                                        ▼
                     https://d10on8fmafqm1i.cloudfront.net
                                        │
                     ┌──────────────────┴──────────────────┐
                     │                                     │
             Path: /* (Default)                    Path: /api/*
                     │                                     │
                     ▼                                     ▼
        CloudFront Function (SPA Rewrite)       Cache Policy: CachingDisabled
                     │                          Origin Request Policy: AllViewerExceptHostHeader
                     ▼                                     │
           Private Amazon S3 Origin                        ▼
         (Origin Access Control - OAC)         Amazon API Gateway HTTP API
         s3://morrow-assets-vineesh-21cse362t  (2wz1iej67d.execute-api.ap-southeast-2.amazonaws.com)
         ├── index.html                                    │
         ├── styles.css                                    ▼
         ├── app.js                              AWS Lambda (Node.js 24.x)
         ├── posters/                            (MorrowCatalogApi)
         ├── backdrops/                                    │
         └── videos/                                       ▼
                                                 Amazon DynamoDB Table
                                                 (MorrowVideos)
```

### Key Architectural Accomplishments
1. **Single Entry Point**: All requests (web pages, media assets, API calls) share the single CloudFront domain `https://d10on8fmafqm1i.cloudfront.net`.
2. **Private S3 with OAC**: The S3 bucket `morrow-assets-vineesh-21cse362t` has **Block All Public Access** enabled. Direct access is strictly denied (`403 Forbidden`). Only the CloudFront distribution is authorized via AWS SigV4 Origin Access Control (`MorrowS3Oac`).
3. **Dual-Origin Path Routing**:
   - `/*` routes to private S3 for frontend SPA code (`index.html`, `styles.css`, `app.js`) and media assets (`posters/`, `backdrops/`, `videos/`).
   - `/api/*` routes to Amazon API Gateway HTTP API (`2wz1iej67d`), forwarding dynamic catalogue queries to Lambda and DynamoDB.
4. **Zero Cross-Origin Complexity**: Because the browser communicates with the same domain for frontend and API, CORS overhead is eliminated.
5. **SPA Deep-Link Routing**: A lightweight CloudFront Function (`MorrowSpaRouter`) rewrites extensionless routes (e.g. `/title/VID001`, `/movies`, `/my-list`) to `/index.html` on the default S3 behavior without touching `/api/*` or static files with extensions.

---

## 2. Deployed AWS Resource Inventory

| Resource Type | Resource Name / ID | Configuration / Endpoint |
|---|---|---|
| **CloudFront Distribution** | `E3CQS64ZH2JAM1` | **Domain:** `https://d10on8fmafqm1i.cloudfront.net` (Status: `Deployed`) |
| **Origin Access Control (OAC)** | `E3STZ204UN3KSM` | `Name: MorrowS3Oac`, SigV4, Always sign, S3 origin type |
| **CloudFront Function** | `MorrowSpaRouter` | `Runtime: cloudfront-js-2.0`, Event: `viewer-request` on default behavior |
| **S3 Asset & Web Origin** | `morrow-assets-vineesh-21cse362t` | Region: `ap-southeast-2`, Block All Public Access: `Enabled` |
| **API Gateway HTTP API** | `2wz1iej67d` (`MorrowHttpApi`) | Hostname: `2wz1iej67d.execute-api.ap-southeast-2.amazonaws.com` |
| **AWS Lambda Compute** | `MorrowCatalogApi` | Runtime: `nodejs24.x`, Environment: `DATA_SOURCE=dynamodb` |
| **Amazon DynamoDB** | `MorrowVideos` | Primary Key: `id` (String), Billing: `PAY_PER_REQUEST` |

---

## 3. Production Frontend Build & Staging

The Morrow frontend is built using standard web standards (HTML5, Vanilla CSS3, ES6 JavaScript) without heavyweight bundling overhead.

### 3.1 Build Command
```bash
npm run build
```
During the build pipeline, Step 7 validates the core frontend files and stages production assets into `dist/frontend/`:
- `dist/frontend/index.html` (58.8 KB)
- `dist/frontend/styles.css` (48.2 KB)
- `dist/frontend/app.js` (89.5 KB)

### 3.2 Uploading Frontend Build to S3 Root
The production build contents are copied directly to the **root** of the S3 bucket:

```bash
# Upload core web files to S3 root
aws s3 cp dist/frontend/index.html s3://morrow-assets-vineesh-21cse362t/index.html --content-type "text/html; charset=utf-8" --region ap-southeast-2
aws s3 cp dist/frontend/styles.css s3://morrow-assets-vineesh-21cse362t/styles.css --content-type "text/css; charset=utf-8" --region ap-southeast-2
aws s3 cp dist/frontend/app.js s3://morrow-assets-vineesh-21cse362t/app.js --content-type "application/javascript; charset=utf-8" --region ap-southeast-2
```

> **Crucial Guardrail**: Do NOT delete or overwrite existing media objects under `posters/`, `backdrops/`, or `videos/`.

---

## 4. CloudFront Distribution Architecture

The distribution configuration is maintained in `scripts/cloudfront-distribution.json`.

### 4.1 Origin 1: Private Amazon S3 Origin (`MorrowS3Origin`)
- **Domain Name**: `morrow-assets-vineesh-21cse362t.s3.ap-southeast-2.amazonaws.com`
- **Origin Access**: Origin Access Control (OAC ID: `E3STZ204UN3KSM`)
- **S3 Bucket Policy**:
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "AllowCloudFrontServicePrincipalReadOnly",
        "Effect": "Allow",
        "Principal": {
          "Service": "cloudfront.amazonaws.com"
        },
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::morrow-assets-vineesh-21cse362t/*",
        "Condition": {
          "StringEquals": {
            "AWS:SourceArn": "arn:aws:cloudfront::754860800809:distribution/E3CQS64ZH2JAM1"
          }
        }
      }
    ]
  }
  ```

### 4.2 Origin 2: API Gateway HTTP API Origin (`MorrowHttpApi`)
- **Domain Name**: `2wz1iej67d.execute-api.ap-southeast-2.amazonaws.com`
- **Origin Protocol Policy**: `https-only`
- **Origin Path**: *(Empty string for `$default` stage)*
- **SSL Protocols**: `TLSv1.2`

### 4.3 Cache Behaviors

#### A. `/api/*` Behavior (High Priority)
- **Path Pattern**: `/api/*`
- **Target Origin**: `MorrowHttpApi`
- **Viewer Protocol Policy**: `redirect-to-https`
- **Allowed HTTP Methods**: `GET, HEAD, OPTIONS`
- **Cache Policy**: `Managed-CachingDisabled` (`4135ea2d-6df8-44a3-9df3-4b5a84be39ad`)
- **Origin Request Policy**: `Managed-AllViewerExceptHostHeader` (`b689b0a8-53d0-40ab-baf2-68738e2966ac`)
- **Compression**: `true`

#### B. Default Behavior (`/*` targeting S3)
- **Target Origin**: `MorrowS3Origin`
- **Viewer Protocol Policy**: `redirect-to-https`
- **Allowed HTTP Methods**: `GET, HEAD`
- **Cache Policy**: `Managed-CachingOptimized` (`658327ea-f89d-4fab-a63d-7e88639e58f6`)
- **Function Association**: `MorrowSpaRouter` on `viewer-request`
- **Compression**: `true`

---

## 5. Client-Side SPA Route Rewriter (CloudFront Function)

To support deep links and browser refreshes on routes such as `https://d10on8fmafqm1i.cloudfront.net/title/VID001` or `/movies`, a lightweight CloudFront Function (`scripts/cf-spa-function.js`) rewrites extensionless URLs to `/index.html`.

```javascript
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Serve the app entry point at the root
    if (uri === "/" || uri.endsWith("/")) {
        request.uri = "/index.html";
        return request;
    }
    
    // Keep real files, images, videos, and generated assets unchanged
    var lastSegment = uri.substring(uri.lastIndexOf("/") + 1);
    
    // Rewrite extensionless client-side routes to the SPA entry point
    if (lastSegment.indexOf(".") === -1) {
        request.uri = "/index.html";
    }
    
    return request;
}
```

### Why this design is superior to custom error 404 redirects
- **No Masked Errors**: If an asset with a file extension (e.g. `/posters/missing.jpg`) or an API route fails, it correctly returns `404 Not Found` or `503 Service Unavailable` rather than deceptively returning HTML.
- **Sub-millisecond Latency**: Executes at the CloudFront edge in <1 ms before hitting origin storage.

---

## 6. Verification and Testing Runbook

### 6.1 Automated Test Suites (168 Total Tests Passing)
Run all project test suites locally:
```bash
npm test
```
- **Catalogue Integrity**: 33 tests passing ([`scripts/test-catalogue.mjs`](file:///scripts/test-catalogue.mjs))
- **Backend API & Proxy**: 69 tests passing ([`scripts/test-backend-api.mjs`](file:///scripts/test-backend-api.mjs))
- **DynamoDB DocumentClient**: 40 tests passing ([`scripts/test-dynamodb-repository.mjs`](file:///scripts/test-dynamodb-repository.mjs))
- **Phase 6 CloudFront Suite**: 26 tests passing ([`scripts/test-phase-6-cloudfront.mjs`](file:///scripts/test-phase-6-cloudfront.mjs))

### 6.2 Live Endpoint Verification Commands

```powershell
$CF = "https://d10on8fmafqm1i.cloudfront.net"

# 1. Verify Website Home Page (Expect HTTP 200 OK, Content-Type text/html)
curl.exe -I "$CF/"

# 2. Verify API Health Check (Expect HTTP 200 OK, JSON)
curl.exe -s "$CF/api/health"

# 3. Verify Dynamic Catalogue from DynamoDB (Expect 7 items)
curl.exe -s "$CF/api/videos"

# 4. Verify Point Lookup for Movie VID001
curl.exe -s "$CF/api/videos/VID001"

# 5. Verify Series Episodes (VID003)
curl.exe -s "$CF/api/series/VID003/episodes"

# 6. Verify Poster Delivery from S3
curl.exe -I "$CF/posters/cloud-intro.svg"

# 7. Verify Video Streaming with HTTP Range Support
curl.exe -I -r 0-1024 "$CF/videos/cloud-intro.mp4"

# 8. Verify SPA Route Refresh (Expect HTTP 200 OK serving index.html)
curl.exe -I "$CF/title/VID001"

# 9. Verify S3 Direct Access is Blocked (Expect HTTP 403 Forbidden)
curl.exe -I "https://morrow-assets-vineesh-21cse362t.s3.ap-southeast-2.amazonaws.com/index.html"
```

---

## 7. CloudFront Cache Invalidation Runbook

Whenever frontend source files (`index.html`, `styles.css`, `app.js`) are modified and uploaded to S3, invalidate the CloudFront edge caches:

```bash
aws cloudfront create-invalidation --distribution-id E3CQS64ZH2JAM1 --paths "/index.html" "/styles.css" "/app.js"
```

To invalidate all web content:
```bash
aws cloudfront create-invalidation --distribution-id E3CQS64ZH2JAM1 --paths "/*"
```

---

## 8. Troubleshooting Matrix

| Problem | Root Cause | Resolution |
|---|---|---|
| **HTTP 403 on Homepage** | S3 bucket policy missing CloudFront OAC permission | Reapply bucket policy in `scripts/s3-oac-policy.json` linking `AWS:SourceArn`. |
| **`/api/health` returns HTML** | CloudFront behavior priority incorrect | Ensure `/api/*` behavior has higher precedence than default `/*`. |
| **CORS Error in Browser** | Frontend calling absolute API Gateway URL | Use relative paths (`/api/videos`). Same-origin CloudFront requests never trigger CORS. |
| **Movie detail page 404 on refresh** | CloudFront Function not attached | Check default behavior has `MorrowSpaRouter` attached to `viewer-request`. |
| **Video does not stream** | Missing `Accept-Ranges` or videoKey null | Check DynamoDB item `videoKey` and verify MP4 file exists in S3 `videos/` prefix. |

---

## 9. Phase 6 Acceptance Checklist (13 of 13 Verified)

- [x] **1. Antigravity audit completed & functionality preserved**: Palette, UI layout, My List intact.
- [x] **2. Production frontend build succeeds**: Generated clean `dist/frontend/` assets.
- [x] **3. Frontend build uploaded to S3 bucket root**: Verified `index.html`, `styles.css`, `app.js` at root.
- [x] **4. S3 bucket remains private with OAC**: Direct access returns `403 Forbidden`.
- [x] **5. CloudFront distribution has S3 and API Gateway origins**: Verified dual-origin setup.
- [x] **6. `/api/*` uses API Gateway origin with caching disabled**: Verified `CachingDisabled` & `AllViewerExceptHostHeader`.
- [x] **7. CloudFront website URL loads over HTTPS**: `https://d10on8fmafqm1i.cloudfront.net` active.
- [x] **8. Catalogue endpoints return JSON from DynamoDB**: Live test verified.
- [x] **9. Posters and backdrops load through CloudFront**: `200 OK` on `/posters/cloud-intro.svg`.
- [x] **10. Real playable sample video works**: `200 OK` with byte-range support on `/videos/cloud-intro.mp4`.
- [x] **11. Refreshing an application route works**: `/title/VID001` successfully rewrites to `/index.html`.
- [x] **12. S3 direct access is denied while CloudFront delivery works**: Verified live.
- [x] **13. Browser console & deployment documentation reviewed**: Complete and documented.

---

## 10. Next Steps: Phase 7 (Authentication & Personalization)

Now that Morrow is accessible worldwide through a single CloudFront domain, Phase 7 will introduce:
1. **Amazon Cognito User Pools**: Secure user registration, login, and JWT token issuance.
2. **User Profile & Viewing State**: Account-backed Watchlist, viewing progress synchronization, and personalised continue watching rows in DynamoDB.
3. **Protected Media Playback**: CloudFront Signed URLs or Signed Cookies for premium subscribers.
