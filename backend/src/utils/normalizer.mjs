/**
 * Morrow OTT Platform — Title Record Normalizer
 * Enforces Phase 2 canonical data model compliance and truth-in-availability rules.
 * Shared by both Fixture and DynamoDB repositories to guarantee zero data model drift.
 */

/**
 * Normalizes a raw canonical title record (Phase 2 model compliance).
 * Ensures that availability rules are strictly respected:
 * - A title is only marked isPlayable = true if verified media asset exists.
 * - Missing or unverified media is never claimed to be playable.
 *
 * @param {Object} raw - Raw item from JSON fixture or DynamoDB
 * @returns {Object|null} Normalized title object
 */
export function normalizeTitleRecord(raw) {
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

    // Backward-compatible UI Aliases (preserves all existing views without modifying components)
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
