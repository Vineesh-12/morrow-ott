# Morrow OTT Platform — Catalogue & Data Design Specification (Phase 2)

**Course**: Cloud Computing (FT-III Academic Assessment)  
**Course Code**: 21CSE362T  
**Project**: Morrow — Premium OTT Entertainment Platform  
**Target AWS Table**: `MorrowVideos`  
**Phase Status**: Phase 2 Completed (Catalogue & Data Design, Validation & Verification)

---

## 1. Project Overview & Architectural Context

Morrow is a cinema-first OTT media platform designed with a serverless cloud backend on Amazon Web Services (AWS). This specification defines the canonical data foundation prepared during **Phase 2**, ensuring that future cloud infrastructure (Amazon S3, Amazon CloudFront, AWS Lambda, Amazon API Gateway, and Amazon DynamoDB) integrates smoothly without requiring any refactoring of the completed frontend.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Morrow OTT Architecture                           │
├────────────────────────────────┬────────────────────────────────────────────┤
│           Client Tier          │                  AWS Cloud                 │
├────────────────────────────────┼────────────────────────────────────────────┤
│ • Cinematic Web Client (HTML5) │ • Amazon CloudFront (CDN Edge Distribution)│
│ • Canonical Catalogue Adapter  │ • Amazon S3 (Video, Posters, Backdrops)   │
│ • LocalStorage (User State)    │ • Amazon API Gateway (HTTP APIs)           │
│ • Morrow AI Concierge UI       │ • AWS Lambda (Node.js Microservices)       │
│ • Responsive Native Player     │ • Amazon DynamoDB (Table: MorrowVideos)    │
│                                │ • Amazon CloudWatch (Logs & Metrics)       │
└────────────────────────────────┴────────────────────────────────────────────┘
```

---

## 2. Repository Audit Findings

An exhaustive audit of the frontend before modifying data structures established the following:
1. **Frontend Architecture**: Zero-dependency vanilla HTML5, CSS3, and JavaScript (ES6+), styled using an approved cinematic dark theme:
   - Background: `#111315`
   - Surfaces: `#1C1E20`
   - Primary Text: `#F2EEE8`
   - Copper Accent: `#C87552`
   - Secondary Text: `#A8A49E`
   - Borders: `#343638`
2. **Routing**: Hash-based client router (`#/`, `#/movies`, `#/series`, `#/genre/:slug`, `#/search`, `#/ai`, `#/my-list`, `#/title/:id`, `#/watch/:id`, `#/settings`).
3. **Player**: HTML5 `<video>` element with custom controls, HTTP 206 Partial Content range requests, time seeking, volume controls, and playback rate selection.
4. **Local State**: Client-side `localStorage` keys for watch history (`morrow_watch_progress`), watchlist (`morrow_watchlist`), and user preferences (`morrow_user_preferences`).
5. **Physical Media Assets**:
   - `media/videos/cloud-intro.mp4` (45s, 4K)
   - `media/videos/big-buck-bunny.mp4` (33s, 4K)
   - `media/videos/botanical-life.mp4` (5s, HD)
   - `media/videos/urban-rhythm.mp4` (10s, 4K)

---

## 3. Canonical Data Model

All titles in the catalogue conform to a single canonical schema defined below.

### 3.1 Common Title Entity
```typescript
interface CanonicalTitle {
  id: string;                     // Stable unique ID (e.g. "VID001", "VID003")
  title: string;                  // Display title
  contentType: 'movie' | 'series';// Content classification
  synopsis: string;               // Editorial description
  genres: string[];               // Categorization array (e.g. ["Sci-Fi", "Thriller"])
  releaseYear: number;            // Integer year (1900 - 2100)
  language?: string;              // ISO language code or display language (e.g. "en")
  imdbRating?: string;            // Editorial IMDb score (e.g. "8.6")
  rating?: string;                // Age certification (e.g. "U/A 16+")
  quality?: string;               // Visual resolution badge (e.g. "4K UHD")
  audio?: string;                 // Sound format (e.g. "Dolby Atmos")
  posterKey: string;              // S3-relative poster path (e.g. "media/thumbnails/...")
  backdropKey: string;            // S3-relative backdrop path
  availabilityStatus: 'available' | 'metadata_only' | 'coming_soon' | 'unavailable';
  isPlayable: boolean;            // Verified playback state (strictly checked)
  featured?: boolean;             // Homepage hero spotlight flag
  createdAt?: string;             // ISO-8601 UTC timestamp
  updatedAt?: string;             // ISO-8601 UTC timestamp
  tags?: string[];                // Search and editorial tags
  keywords?: string[];            // Discovery keywords for Morrow AI Concierge
}
```

### 3.2 Movie-Specific Entity
```typescript
interface MovieTitle extends CanonicalTitle {
  contentType: 'movie';
  durationSeconds: number;        // Total duration in positive seconds
  videoKey: string;               // S3-relative video path (e.g. "media/videos/cloud-intro.mp4")
  subtitleKey?: string;           // Optional WebVTT subtitle track
}
```

### 3.3 Series, Season & Episode Entities
```typescript
interface SeriesTitle extends CanonicalTitle {
  contentType: 'series';
  seasons: Season[];              // Hierarchical season list
}

interface Season {
  seasonNum: number;              // 1-indexed season number
  title?: string;                 // e.g. "Season 1"
  posterKey?: string;             // Optional season artwork
  episodes: Episode[];            // Ordered episode collection
}

interface Episode {
  id: string;                     // Stable episode ID (e.g. "VID003-E1")
  parentSeriesId: string;         // Parent series foreign key
  seasonNum: number;              // Season index
  episodeNum: number;             // Episode sequence number
  title: string;                  // Episode title
  synopsis: string;               // Episode synopsis
  durationSeconds: number;        // Episode runtime in seconds
  videoKey: string;               // S3-relative video path
  thumbnailKey: string;           // Episode preview frame
  availabilityStatus: 'available' | 'metadata_only' | 'coming_soon' | 'unavailable';
  isPlayable: boolean;            // Verified playback state
}
```

---

## 4. Availability-State System

Morrow strictly adheres to truth-in-availability. A record is **never** inferred as playable simply because its metadata exists.

| Availability State | Meaning | Player Action | UI Presentation |
|---|---|---|---|
| `available` | Playback asset is physically verified on disk / in S3. | Playback initiates immediately. | Active "Watch Now" / "Watch" buttons. |
| `metadata_only` | Catalogue information exists; cloud media ingestion pending. | Playback blocked; displays informative modal. | "Catalogue Only" badge; Watch button disabled. |
| `coming_soon` | Content scheduled for future release. | Playback blocked. | "Coming Soon" badge; Watch button disabled. |
| `unavailable` | Rights expired or content withdrawn. | Playback blocked. | Unavailability notice rendered. |

---

## 5. Separation of Catalogue Metadata from User State

Public catalogue metadata remains strictly immutable and cached, while individual viewer state is managed through decoupled storage abstractions:

1. **Watchlist (`morrow_watchlist`)**: Array of content IDs (`["VID001", "VID003"]`).
2. **Playback Progress (`morrow_watch_progress`)**:
   ```json
   {
     "VID001": {
       "id": "VID001",
       "currentTime": 24.5,
       "duration": 45.0,
       "percent": 54.4,
       "updatedAt": 1744439000000,
       "completed": false
     }
   }
   ```
3. **Preferences (`morrow_user_preferences`)**: Autoplay, motion reduction, and audio/subtitle selections.

---

## 6. Media Asset Keys & Future S3/CloudFront Mapping

All media files are addressed by **canonical relative keys**:
- Posters: `media/thumbnails/{name}.svg` (future S3: `posters/{id}.jpg`)
- Videos: `media/videos/{filename}.mp4` (future S3: `videos/{id}.mp4`)
- Subtitles: `media/subtitles/{filename}.vtt` (future S3: `subtitles/{id}.en.vtt`)

The `mediaService` abstraction resolves URLs dynamically:
```javascript
// Local Development:
mediaService.resolveUrl('media/videos/cloud-intro.mp4')
// => "media/videos/cloud-intro.mp4" (served locally)

// Future CloudFront Deployment:
// => "https://d123456abcdef8.cloudfront.net/videos/cloud-intro.mp4"
```

---

## 7. Automated Validation & Integrity Suite

A 16-point automated integrity validator (`scripts/validate-catalogue.mjs`) verifies the dataset:
1. Non-empty title IDs.
2. Unique IDs across all titles and episodes.
3. Allowed `contentType` enum values (`movie`, `series`).
4. Non-empty `genres` array.
5. Positive integer `durationSeconds`.
6. Valid `releaseYear` (1900 - 2100).
7. Allowed `availabilityStatus` enum.
8. Episode `parentSeriesId` references an existing series.
9. Season belongs to parent series with positive season numbers.
10. Sequential season and episode ordering.
11. Featured content IDs exist in catalogue.
12. Valid asset keys with allowable file extensions.
13. Available titles have verified local media files on disk.
14. Unavailable titles are not marked `isPlayable = true`.
15. Zero broken references across movies, seasons, and episodes.
16. Safe runtime JSON parse and adapter normalization.

---

## 8. Proposed Amazon DynamoDB Mapping (`MorrowVideos`)

When deployed to AWS in Phase 4, the canonical catalogue will be stored in DynamoDB:

- **Table Name**: `MorrowVideos`
- **Primary Partition Key (PK)**: `PK` (String, e.g. `TITLE#VID001`, `SERIES#VID003`)
- **Primary Sort Key (SK)**: `SK` (String, e.g. `METADATA`, `SEASON#1#EP#1`)

### Access Patterns & Indexes
| Access Pattern | Key Condition / Index | Result |
|---|---|---|
| Fetch Title Metadata | `PK = TITLE#{id}` AND `SK = METADATA` | Single movie or series record |
| Fetch All Episodes in a Season | `PK = SERIES#{id}` AND `SK begins_with SEASON#{n}` | Episode records ordered by number |
| Query Titles by Content Type | GSI-1: `GSI1PK = TYPE#{movie|series}`, `GSI1SK = RATING#{score}` | High-rated movies or series |
| Query Titles by Genre | GSI-2: `GSI2PK = GENRE#{genre}`, `GSI2SK = YEAR#{year}` | Genre-filtered catalogue listings |
| Check Availability | Item attribute: `availabilityStatus` | Verified prior to streaming URL issue |

---

## 9. Morrow AI Concierge Grounding

The future AI Concierge utilizes catalogue metadata attributes (`tags`, `keywords`, `synopsis`, `genres`, `imdbRating`, and `availabilityStatus`):
1. **Natural Language Query**: "Recommend a sci-fi thriller under an hour."
2. **Intent Parsing**: Extracts genres (`Sci-Fi`, `Thriller`) and maximum duration (`< 3600s`).
3. **Grounding Filter**: Scans only verified items in `catalogue.json` / DynamoDB.
4. **Availability Verification**: Discards or annotates unhosted titles (e.g. *Interstellar* is noted as unavailable while recommending *The Cloud Paradox*).

---

## 10. Operational Guide

### Run Local Server
```bash
npm start
# Launches server at http://localhost:3000
```

### Run Catalogue Validator
```bash
npm run validate
# Validates data/catalogue.json against all 16 integrity rules
```

### Generate Asset Manifest
```bash
npm run manifest
# Scans disk and generates data/asset-manifest.json
```

### Run Automated Unit Tests
```bash
npm test
# Executes 25 unit tests across models, fixtures, and negative checks
```

### Run Verification Build
```bash
npm run build
# Runs validator, generates manifest, and validates static assets
```

---

## 11. Phase 3 Prerequisites (Amazon S3 Roadmap)

1. Provision S3 media bucket (e.g. `morrow-media-assets-<account-id>`).
2. Mirror folder hierarchy: `posters/`, `backdrops/`, `videos/`, `subtitles/`.
3. Ingest missing media assets for `VID005` (*Solaris Drift*), `VID006` (*Silent Echoes*), and `VID007` (*The Quantum Rift*).
4. Configure CloudFront origin access control (OAC).
5. Flip `availabilityStatus` to `available` and `isPlayable` to `true` as assets are uploaded and verified.
