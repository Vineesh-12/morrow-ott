# Morrow OTT Platform — Amazon S3 Asset Architecture & Secure Storage (Phase 3)

**Course**: Cloud Computing (FT-III Academic Assessment)  
**Course Code**: 21CSE362T  
**Project**: Morrow — Premium OTT Entertainment Platform  
**Target AWS Region**: `ap-south-1` (Asia Pacific — Mumbai)  
**Phase Status**: Phase 3 Completed (S3 Asset Preparation, Manifest Mapping & Secure Runbook)

---

## 1. Architectural Context & Security Principles

In Morrow's cloud architecture, Amazon S3 serves as the **private object storage tier** for video streams, portrait posters, and landscape backdrops. 

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Phase 3 & Phase 6 Delivery Path                           │
├────────────────────────────────┬───────────────────────────────────────────────────────┤
│    Phase 3 (Current Prep)      │         Phase 6 (Deployment with CloudFront CDN)       │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ • Verified local media files   │ • Amazon CloudFront (Global Edge Cache)               │
│ • Canonical asset manifest     │ • Origin Access Control (OAC) Signing                 │
│ • Strict S3 key prefixes       │ • S3 Bucket Policy: Only CloudFront OAC Principal     │
│ • Private S3 Bucket (Mumbai)   │ • S3 Block Public Access: 100% ENABLED (ON)           │
│ • Dry-run upload planner tool  │ • Direct public S3 access: FORBIDDEN                  │
└────────────────────────────────┴───────────────────────────────────────────────────────┘
```

### Security Invariants
1. **Zero Public Access**: Block All Public Access is **ENABLED**. No public bucket policies or public ACLs are ever created.
2. **Bucket Owner Enforced**: S3 Object Ownership is set to *Bucket owner enforced* (Access Control Lists disabled).
3. **Default Server-Side Encryption**: Standard SSE-S3 (`AES-256`) encryption at rest without additional KMS overhead.
4. **No Static Website Hosting**: The S3 bucket remains a private storage origin. Static website hosting is explicitly **DISABLED**.
5. **Zero Credentials in Code**: No AWS access keys, secret keys, or temporary session tokens are committed to source control.

---

## 2. S3 Object-Key Convention

To avoid clutter and maintain predictable CDN routing, media assets are partitioned into four strict prefixes:

```
s3://<your-bucket-name>/
├── posters/                     # Portrait artwork for browse cards & details hero
│   ├── cloud-intro.svg
│   ├── big-buck-bunny.svg
│   ├── botanical-life.svg
│   └── urban-rhythm.svg
├── backdrops/                   # Landscape 16:9 banner artwork for hero carousels
│   ├── cloud-intro.svg
│   ├── big-buck-bunny.svg
│   ├── botanical-life.svg
│   └── urban-rhythm.svg
├── videos/                      # Approved sample MP4 video streams
│   ├── cloud-intro.mp4
│   ├── big-buck-bunny.mp4
│   ├── botanical-life.mp4
│   └── urban-rhythm.mp4
└── subtitles/                   # WebVTT subtitle tracks (future ingestion)
    ├── cloud-intro.en.vtt
    └── big-buck-bunny.en.vtt
```

> [!NOTE]
> Later in **Phase 6 (Deployment)**, the production frontend build (`index.html`, `styles.css`, `app.js`) will reside at the root of the frontend deployment bucket. Media remains under `posters/`, `backdrops/`, and `videos/`.

---

## 3. Catalogue Asset Mapping to S3 Object Keys

The table below documents the exact deterministic mapping between catalogue asset references and their destination S3 object keys:

| Content ID | Title | Catalogue Key | Intended S3 Object Key | Content-Type | Size | Status |
|---|---|---|---|---|---|---|
| `VID001` | *The Cloud Paradox* | `media/thumbnails/cloud-intro.svg` | `posters/cloud-intro.svg` | `image/svg+xml` | 3.12 KB | Verified Local |
| `VID001` | *The Cloud Paradox* | `media/thumbnails/cloud-intro.svg` | `backdrops/cloud-intro.svg` | `image/svg+xml` | 3.12 KB | Verified Local |
| `VID001` | *The Cloud Paradox* | `media/videos/cloud-intro.mp4` | `videos/cloud-intro.mp4` | `video/mp4` | 5.11 MB | Verified Local (Large >5MB) |
| `VID001` | *The Cloud Paradox* | `media/subtitles/cloud-intro.en.vtt` | `subtitles/cloud-intro.en.vtt` | `text/vtt` | — | Planned Remote |
| `VID002` | *Beyond the Horizon* | `media/thumbnails/big-buck-bunny.svg` | `posters/big-buck-bunny.svg` | `image/svg+xml` | 2.69 KB | Verified Local |
| `VID002` | *Beyond the Horizon* | `media/thumbnails/big-buck-bunny.svg` | `backdrops/big-buck-bunny.svg` | `image/svg+xml` | 2.69 KB | Verified Local |
| `VID002` | *Beyond the Horizon* | `media/videos/big-buck-bunny.mp4` | `videos/big-buck-bunny.mp4` | `video/mp4` | 5.26 MB | Verified Local (Large >5MB) |
| `VID002` | *Beyond the Horizon* | `media/subtitles/big-buck-bunny.en.vtt` | `subtitles/big-buck-bunny.en.vtt` | `text/vtt` | — | Planned Remote |
| `VID003` | *Flora: The Secret Kingdom* | `media/thumbnails/botanical-life.svg` | `posters/botanical-life.svg` | `image/svg+xml` | 2.95 KB | Verified Local |
| `VID003` | *Flora: The Secret Kingdom* | `media/thumbnails/botanical-life.svg` | `backdrops/botanical-life.svg` | `image/svg+xml` | 2.95 KB | Verified Local |
| `VID003-E1`| *Canopy Awakening* (Ep 1) | `media/videos/botanical-life.mp4` | `videos/botanical-life.mp4` | `video/mp4` | 1.08 MB | Verified Local |
| `VID004` | *Metropolis Nights* | `media/thumbnails/urban-rhythm.svg` | `posters/urban-rhythm.svg` | `image/svg+xml` | 3.23 KB | Verified Local |
| `VID004` | *Metropolis Nights* | `media/thumbnails/urban-rhythm.svg` | `backdrops/urban-rhythm.svg` | `image/svg+xml` | 3.23 KB | Verified Local |
| `VID004-E1`| *Neon Skyline* (Ep 1) | `media/videos/urban-rhythm.mp4` | `videos/urban-rhythm.mp4` | `video/mp4` | 503.12 KB | Verified Local |
| `VID005` | *Solaris Drift* | `media/videos/solaris-drift.mp4` | `videos/solaris-drift.mp4` | `video/mp4` | — | Planned Remote (`metadata_only`) |
| `VID006` | *Silent Echoes* | `media/videos/silent-echoes.mp4` | `videos/silent-echoes.mp4` | `video/mp4` | — | Planned Remote (`coming_soon`) |
| `VID007-E1`| *The Anomaly* (Ep 1) | `media/videos/quantum-rift-e1.mp4` | `videos/quantum-rift-e1.mp4` | `video/mp4` | — | Planned Remote (`coming_soon`) |

---

## 4. Exact S3 Upload Candidate Inventory

The Phase 3 candidate set consists of **12 destination objects** derived from **8 unique local source files**:

### 4.1 Sample Videos (`videos/`)
1. `media/videos/cloud-intro.mp4` &rarr; `videos/cloud-intro.mp4`  
   *Content-Type*: `video/mp4` | *Size*: 5,360,323 bytes (**5.11 MB**) | *Flag*: Large File (>5MB)
2. `media/videos/big-buck-bunny.mp4` &rarr; `videos/big-buck-bunny.mp4`  
   *Content-Type*: `video/mp4` | *Size*: 5,510,872 bytes (**5.26 MB**) | *Flag*: Large File (>5MB)
3. `media/videos/botanical-life.mp4` &rarr; `videos/botanical-life.mp4`  
   *Content-Type*: `video/mp4` | *Size*: 1,128,375 bytes (**1.08 MB**)
4. `media/videos/urban-rhythm.mp4` &rarr; `videos/urban-rhythm.mp4`  
   *Content-Type*: `video/mp4` | *Size*: 515,198 bytes (**503.12 KB**)

*Subtotal Videos*: **12,514,768 bytes (~11.93 MB)**

### 4.2 Posters (`posters/`)
1. `media/thumbnails/cloud-intro.svg` &rarr; `posters/cloud-intro.svg`  
   *Content-Type*: `image/svg+xml` | *Size*: 3,195 bytes (3.12 KB)
2. `media/thumbnails/big-buck-bunny.svg` &rarr; `posters/big-buck-bunny.svg`  
   *Content-Type*: `image/svg+xml` | *Size*: 2,750 bytes (2.69 KB)
3. `media/thumbnails/botanical-life.svg` &rarr; `posters/botanical-life.svg`  
   *Content-Type*: `image/svg+xml` | *Size*: 3,016 bytes (2.95 KB)
4. `media/thumbnails/urban-rhythm.svg` &rarr; `posters/urban-rhythm.svg`  
   *Content-Type*: `image/svg+xml` | *Size*: 3,310 bytes (3.23 KB)

*Subtotal Posters*: **12,271 bytes (~11.98 KB)**

### 4.3 Backdrops (`backdrops/`)
1. `media/thumbnails/cloud-intro.svg` &rarr; `backdrops/cloud-intro.svg`  
   *Content-Type*: `image/svg+xml` | *Size*: 3,195 bytes (3.12 KB)
2. `media/thumbnails/big-buck-bunny.svg` &rarr; `backdrops/big-buck-bunny.svg`  
   *Content-Type*: `image/svg+xml` | *Size*: 2,750 bytes (2.69 KB)
3. `media/thumbnails/botanical-life.svg` &rarr; `backdrops/botanical-life.svg`  
   *Content-Type*: `image/svg+xml` | *Size*: 3,016 bytes (2.95 KB)
4. `media/thumbnails/urban-rhythm.svg` &rarr; `backdrops/urban-rhythm.svg`  
   *Content-Type*: `image/svg+xml` | *Size*: 3,310 bytes (3.23 KB)

*Subtotal Backdrops*: **12,271 bytes (~11.98 KB)**

---

### Total Upload Metrics Summary
- **Total Objects to Upload**: `12`
- **Total Upload Payload Size**: **`12,539,310 bytes` (~11.96 MB)**
- **Large Files (>5MB)**: `2` (`videos/big-buck-bunny.mp4`, `videos/cloud-intro.mp4`)
- **Missing Local Files (for Available titles)**: `0`
- **Planned Remote Files (for Future titles)**: `5`

---

## 5. Manual AWS Console Runbook

Follow these exact steps in the AWS Console to provision the private S3 bucket in Mumbai:

### Step 1: Open S3 in Mumbai Region
1. Log into your [AWS Management Console](https://console.aws.amazon.com/).
2. Select **S3** from the Services menu.
3. In the top navigation bar, confirm the region is set to **Asia Pacific (Mumbai) `ap-south-1`**.

### Step 2: Create General Purpose Bucket
1. Click **Create bucket**.
2. **Bucket type**: Choose **General purpose**.
3. **Bucket name**: Enter a unique name adhering to S3 DNS naming rules:  
   *Example*: `morrow-assets-ft3-21cse362t` *(or `morrow-assets-<your-name>-<random-digits>`)*.
4. **AWS Region**: Verify `Asia Pacific (Mumbai) ap-south-1`.

### Step 3: Enforce Private Security Settings
1. **Object Ownership**: Select **Bucket owner enforced (recommended)**. (This disables legacy ACLs).
2. **Block Public Access settings for this bucket**:
   - Ensure the checkbox **Block *all* public access** is **CHECKED / ENABLED**.
   - Keep all four sub-checkboxes checked (Block public ACLs, Ignore public ACLs, Block public policy, Restrict public bucket).
3. **Bucket Versioning**: Choose **Disable** (reduces unnecessary storage charges for academic testing).
4. **Default encryption**:
   - **Encryption type**: Choose **Server-side encryption with Amazon S3 managed keys (SSE-S3)**.
   - **Bucket Key**: Enable.

### Step 4: Finalize Bucket Creation
1. Review settings and click **Create bucket**.
2. Do **NOT** enable Static website hosting under the *Properties* tab.

---

### Step 5: Upload Files via AWS Console
1. Click on your newly created bucket name.
2. Click **Create folder**:
   - Name: `videos` &rarr; Save.
   - Name: `posters` &rarr; Save.
   - Name: `backdrops` &rarr; Save.
3. **Upload Videos**:
   - Open folder `videos/`.
   - Click **Upload** &rarr; **Add files**.
   - Select the 4 MP4 files from `media/videos/`:  
     `cloud-intro.mp4`, `big-buck-bunny.mp4`, `botanical-life.mp4`, `urban-rhythm.mp4`.
   - Under *Properties &rarr; Metadata*, verify Content-Type is `video/mp4`.
   - Click **Upload**.
4. **Upload Posters**:
   - Open folder `posters/`.
   - Click **Upload** &rarr; **Add files**.
   - Select the 4 SVG files from `media/thumbnails/`:  
     `cloud-intro.svg`, `big-buck-bunny.svg`, `botanical-life.svg`, `urban-rhythm.svg`.
   - Under *Properties &rarr; Metadata*, confirm Content-Type is `image/svg+xml`.
   - Click **Upload**.
5. **Upload Backdrops**:
   - Open folder `backdrops/`.
   - Click **Upload** &rarr; **Add files**.
   - Select the 4 SVG files from `media/thumbnails/`.
   - Click **Upload**.

---

## 6. S3 Pre-Flight & Post-Upload Verification Checklist

| Check # | Requirement | Expected State | Verified |
|---|---|---|---|
| 1 | AWS Region | `ap-south-1` (Mumbai) | [ ] |
| 2 | Block All Public Access | **Enabled / On** | [ ] |
| 3 | Object Ownership | **Bucket owner enforced** (ACLs disabled) | [ ] |
| 4 | Static Website Hosting | **Disabled** | [ ] |
| 5 | Default Encryption | **SSE-S3** (AES-256) | [ ] |
| 6 | Prefix: `videos/` | Contains 4 MP4 files (~11.93 MB) | [ ] |
| 7 | Prefix: `posters/` | Contains 4 SVG files (~12.0 KB) | [ ] |
| 8 | Prefix: `backdrops/` | Contains 4 SVG files (~12.0 KB) | [ ] |
| 9 | Direct Object URL Test | HTTP 403 Forbidden (Expected for private bucket) | [ ] |

---

## 7. Media Resolution Strategy (Phase 3 vs. Phase 6 CloudFront)

### Why Direct S3 URLs are Forbidden in Production
Direct public S3 bucket URLs (`https://<bucket>.s3.ap-south-1.amazonaws.com/<key>`) expose cloud origins to scraping, lack DDoS protection, do not support custom domain SSL certificates, and incur higher egress bandwidth costs.

### Future Phase 6 CloudFront OAC Integration
In Phase 6, an Amazon CloudFront distribution will be created in front of the private S3 bucket using **Origin Access Control (OAC)**:
1. CloudFront authenticates requests to S3 using SigV4 credentials.
2. The S3 bucket policy allows *only* the CloudFront service principal (`cloudfront.amazonaws.com`) to read objects:
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
         "Resource": "arn:aws:s3:::<your-bucket-name>/*",
         "Condition": {
           "StringEquals": {
             "AWS:SourceArn": "arn:aws:cloudfront::<account-id>:distribution/<dist-id>"
           }
         }
       }
     ]
   }
   ```
3. At runtime, `mediaService.resolveUrl(key)` in `frontend/app.js` will resolve S3 keys directly to the CDN edge:
   ```javascript
   mediaService.resolveUrl('videos/cloud-intro.mp4')
   // Returns: "https://d123456abcdef8.cloudfront.net/videos/cloud-intro.mp4"
   ```

---

## 8. CLI Dry-Run & Verification Commands

### View S3 Upload Plan
```bash
npm run s3:plan
```
Generates a dry-run summary with exact file sizes, MIME types, and copy-paste AWS CLI commands.

### Re-Generate Asset Manifest
```bash
npm run manifest
```
Inventories media files and updates `data/asset-manifest.json`.

### Run Test Suite & Build Verification
```bash
npm test
npm run build
```
Executes all 33 automated tests and confirms zero integrity violations.
