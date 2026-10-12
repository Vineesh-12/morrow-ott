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
import { normalizeTitleRecord } from '../utils/normalizer.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
