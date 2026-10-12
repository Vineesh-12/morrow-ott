/**
 * Morrow OTT Platform — Canonical Catalogue Normalizer & Adapter
 * Provides a clean adapter layer that transforms canonical catalogue records
 * into the format required by the UI while maintaining full backward compatibility.
 */

/**
 * Normalizes a canonical catalogue title record for consumption by the UI.
 * @param {Object} raw - Raw canonical catalogue record
 * @returns {Object} Normalized title object with canonical and legacy aliases
 */
export function normalizeTitle(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid title record: must be a non-null object');
  }

  const genres = Array.isArray(raw.genres) && raw.genres.length > 0
    ? [...raw.genres]
    : [raw.genre || raw.category || 'General'];

  // Flattened episodes array for series
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
    // Canonical Fields
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
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
    tags: Array.isArray(raw.tags) ? [...raw.tags] : [],
    keywords: Array.isArray(raw.keywords) ? [...raw.keywords] : [],
    seasons,
    episodes,
    isPlayable,

    // Backward-compatible UI Aliases (preserves all existing views without modifying components)
    videoId: String(raw.id),
    type: raw.contentType || (raw.type === 'series' ? 'series' : 'movie'),
    description: String(raw.synopsis || raw.description || ''),
    genre: genres[0],
    category: genres[0],
    year: Number(raw.releaseYear || raw.year) || 2026,
    thumbnailKey: String(raw.posterKey || raw.thumbnailKey || ''),
    objectKey: raw.videoKey || raw.objectKey || null,
    availability: availabilityStatus === 'available' ? 'available' : 'unavailable',
    season: seasons.length > 0 ? seasons[0].title : (raw.season || 'Season 1')
  };
}

/**
 * Normalizes an entire catalogue array.
 * @param {Array} catalogueList
 * @returns {Array}
 */
export function normalizeCatalogue(catalogueList) {
  if (!Array.isArray(catalogueList)) return [];
  return catalogueList.map(normalizeTitle);
}
