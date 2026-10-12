/**
 * Morrow OTT Platform — Base Repository Interface & Errors
 * Provides contract definition without circular dependencies.
 */

export class DataSourceUnavailableError extends Error {
  constructor(message, code = 'DATA_SOURCE_UNAVAILABLE') {
    super(message);
    this.name = 'DataSourceUnavailableError';
    this.code = code;
    this.statusCode = 503;
  }
}

/**
 * Base abstract class documenting the repository contract.
 */
export class BaseCatalogueRepository {
  /**
   * @param {{ type?: string, genre?: string, limit?: number }} [filters]
   * @returns {Promise<Array<Object>>}
   */
  async listVideos(filters = {}) {
    throw new Error('listVideos() must be implemented by subclass');
  }

  /**
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getVideoById(id) {
    throw new Error('getVideoById() must be implemented by subclass');
  }

  /**
   * @param {string} seriesId
   * @returns {Promise<{ isSeries: boolean, episodes: Array<Object> } | null>}
   */
  async listEpisodesBySeriesId(seriesId) {
    throw new Error('listEpisodesBySeriesId() must be implemented by subclass');
  }
}
