/**
 * Morrow OTT Platform — Phase 4 Development Fixture Repository
 * Concrete repository adapter backed by the Phase 2 canonical dataset.
 *
 * Implements deterministic querying, filtering, and episode retrieval
 * without external database dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BaseCatalogueRepository } from './baseRepository.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Normalizes a raw canonical title record (Phase 2 model compliance).
 * Guarantees that availability rules are strictly respected.
 */
function normalizeTitleRecord(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const genres = Array.isArray(raw.genres) && raw.genres.length > 0
    ? [...raw.genres]
    : [raw.genre || raw.category || 'General'];

  let episodes = [];
  let seasons = [];

  if (Array.isArray(raw.seasons)) {
    seasons = raw.seasons.map(s => ({
      seasonNum: Number(s.seasonNum) || 1,
      title: s.title || `Season ${s.seasonNum || 1}`,
      posterKey: s.posterKey || raw.posterKey,
      episodes: Array.isArray(s.episodes)
        ? s.episodes.map(ep => ({
            id: String(ep.id),
            parentSeriesId: String(ep.parentSeriesId || raw.id),
            seasonNum: Number(ep.seasonNum || s.seasonNum || 1),
            episodeNum: Number(ep.episodeNum) || 1,
            title: String(ep.title || `Episode ${ep.episodeNum || 1}`),
            synopsis: String(ep.synopsis || ''),
            durationSeconds: Number(ep.durationSeconds) || 0,
            videoKey: ep.videoKey || null,
            thumbnailKey: ep.thumbnailKey || ep.posterKey || raw.posterKey,
            availabilityStatus: ep.availabilityStatus || 'available',
            isPlayable: ep.availabilityStatus === 'available' && Boolean(ep.videoKey)
          }))
        : []
    }));
    episodes = seasons.flatMap(s => s.episodes);
  } else if (Array.isArray(raw.episodes)) {
    episodes = raw.episodes.map(ep => ({
      id: String(ep.id),
      parentSeriesId: String(ep.parentSeriesId || raw.id),
      seasonNum: Number(ep.seasonNum) || 1,
      episodeNum: Number(ep.episodeNum) || 1,
      title: String(ep.title || `Episode ${ep.episodeNum || 1}`),
      synopsis: String(ep.synopsis || ''),
      durationSeconds: Number(ep.durationSeconds) || 0,
      videoKey: ep.videoKey || null,
      thumbnailKey: ep.thumbnailKey || ep.posterKey || raw.posterKey,
      availabilityStatus: ep.availabilityStatus || 'available',
      isPlayable: ep.availabilityStatus === 'available' && Boolean(ep.videoKey)
    }));
  }

  const availabilityStatus = raw.availabilityStatus || 'available';
  const isPlayable = raw.contentType === 'series'
    ? episodes.some(ep => ep.isPlayable)
    : availabilityStatus === 'available' && Boolean(raw.videoKey);

  return {
    id: String(raw.id),
    title: String(raw.title),
    contentType: raw.contentType || (raw.type === 'series' ? 'series' : 'movie'),
    synopsis: String(raw.synopsis || raw.description || ''),
    genres,
    releaseYear: Number(raw.releaseYear || raw.year) || 2026,
    language: String(raw.language || 'en'),
    durationSeconds: Number(raw.durationSeconds) || 0,
    imdbRating: String(raw.imdbRating || '8.5'),
    rating: String(raw.rating || 'U/A 13+'),
    quality: String(raw.quality || '4K UHD'),
    audio: String(raw.audio || 'Dolby Audio'),
    posterKey: String(raw.posterKey || raw.thumbnailKey || ''),
    backdropKey: String(raw.backdropKey || raw.posterKey || raw.thumbnailKey || ''),
    videoKey: raw.videoKey || raw.objectKey || null,
    subtitleKeys: raw.subtitleKeys || {},
    availabilityStatus,
    featured: Boolean(raw.featured),
    createdAt: String(raw.createdAt || '2026-01-01T00:00:00Z'),
    updatedAt: String(raw.updatedAt || '2026-01-01T00:00:00Z'),
    tags: Array.isArray(raw.tags) ? [...raw.tags] : [],
    keywords: Array.isArray(raw.keywords) ? [...raw.keywords] : [],
    seasons,
    episodes,
    isPlayable,

    // Backward-compatible UI Aliases
    videoId: String(raw.id),
    type: raw.contentType || (raw.type === 'series' ? 'series' : 'movie'),
    description: String(raw.synopsis || raw.description || ''),
    genre: genres[0],
    category: genres[0],
    year: Number(raw.releaseYear || raw.year) || 2026,
    thumbnailKey: String(raw.posterKey || raw.thumbnailKey || ''),
    objectKey: raw.videoKey || raw.objectKey || null,
    availability: availabilityStatus === 'available' ? 'available' : 'unavailable'
  };
}

export class FixtureCatalogueRepository extends BaseCatalogueRepository {
  /**
   * @param {Array<Object>} [initialItems] - Optional injected data for testing
   */
  constructor(initialItems = null) {
    super();
    this.items = [];
    if (Array.isArray(initialItems)) {
      this.items = initialItems.map(normalizeTitleRecord).filter(Boolean);
    } else {
      this._loadFixtureData();
    }
  }

  _loadFixtureData() {
    const candidatePaths = [
      // Packaged Lambda zip relative path
      path.resolve(__dirname, '../../data/catalogue-fixture.json'),
      path.resolve(__dirname, '../../data/catalogue.json'),
      // Local development relative path from backend/src/repository
      path.resolve(__dirname, '../../../data/catalogue.json'),
      path.resolve(__dirname, '../../../data/catalogue-fixture.json'),
      // Current working directory paths
      path.resolve(process.cwd(), 'data/catalogue-fixture.json'),
      path.resolve(process.cwd(), 'data/catalogue.json')
    ];

    let loaded = false;
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
          const catalogueArray = Array.isArray(raw) ? raw : (raw.catalogue || raw.videos || []);
          this.items = catalogueArray.map(normalizeTitleRecord).filter(Boolean);
          loaded = true;
          break;
        } catch (err) {
          console.warn(`[FixtureRepository] Failed to parse candidate path ${p}:`, err.message);
        }
      }
    }

    if (!loaded) {
      console.warn('[FixtureRepository] Warning: No fixture catalogue file could be located on disk.');
      this.items = [];
    }
  }

  /**
   * Lists videos matching optional filters.
   * @param {{ type?: string, genre?: string, limit?: number }} [filters]
   * @returns {Promise<Array<Object>>}
   */
  async listVideos(filters = {}) {
    let result = [...this.items];

    if (filters.type) {
      result = result.filter(item => item.contentType === filters.type);
    }

    if (filters.genre) {
      const g = filters.genre.toLowerCase();
      result = result.filter(item =>
        item.genres && item.genres.some(genre => genre.toLowerCase().includes(g) || g.includes(genre.toLowerCase()))
      );
    }

    const limit = typeof filters.limit === 'number' && filters.limit > 0 ? filters.limit : 50;
    return result.slice(0, limit);
  }

  /**
   * Retrieves a single title by its canonical ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getVideoById(id) {
    if (!id) return null;
    const match = this.items.find(item => item.id === id || item.videoId === id);
    return match ? { ...match } : null;
  }

  /**
   * Retrieves episodes for a series, deterministically sorted.
   * @param {string} seriesId
   * @returns {Promise<{ isSeries: boolean, episodes: Array<Object> } | null>}
   */
  async listEpisodesBySeriesId(seriesId) {
    if (!seriesId) return null;
    const item = this.items.find(t => t.id === seriesId || t.videoId === seriesId);
    if (!item) {
      return null;
    }

    if (item.contentType !== 'series') {
      return { isSeries: false, episodes: [] };
    }

    const sortedEpisodes = [...(item.episodes || [])].sort((a, b) => {
      if (a.seasonNum !== b.seasonNum) return a.seasonNum - b.seasonNum;
      return a.episodeNum - b.episodeNum;
    });

    return {
      isSeries: true,
      episodes: sortedEpisodes
    };
  }
}
