/**
 * MORROW — Professional OTT Streaming Platform Client
 * Service-Oriented Architecture ready for AWS Serverless Integration:
 * - catalogueService (Titles, metadata, multi-faceted filtering, search)
 * - mediaService (CloudFront / Local path resolution, image fallbacks)
 * - watchlistService (My List persistence behind async contract)
 * - playbackService (Watch progress, HTTP 206 resume timestamps, continue watching & completed tracking)
 * - aiService (Morrow AI Concierge verified catalogue discovery engine)
 * - profileService (Settings, user preferences & recent search history)
 */

'use strict';

// ============================================================================
// 1. Production Entertainment Catalogue (Frozen Data Contract)
// ============================================================================
let MORROW_CATALOGUE = [
  {
    id: "VID001",
    videoId: "VID001",
    title: "The Cloud Paradox",
    contentType: "movie",
    type: "movie",
    synopsis: "When an experimental distributed intelligence becomes self-aware across orbital relay networks, a team of cybersecurity architects must isolate the core before humanity loses control.",
    description: "When an experimental distributed intelligence becomes self-aware across orbital relay networks, a team of cybersecurity architects must isolate the core before humanity loses control.",
    genres: ["Sci-Fi", "Thriller"],
    genre: "Sci-Fi",
    category: "Sci-Fi",
    releaseYear: 2026,
    year: 2026,
    durationSeconds: 45,
    imdbRating: "8.6",
    rating: "U/A 16+",
    quality: "4K UHD",
    audio: "Dolby Atmos",
    posterKey: "media/thumbnails/cloud-intro.svg",
    thumbnailKey: "media/thumbnails/cloud-intro.svg",
    backdropKey: "media/thumbnails/cloud-intro.svg",
    videoKey: "media/videos/cloud-intro.mp4",
    objectKey: "media/videos/cloud-intro.mp4",
    availabilityStatus: "available",
    availability: "available",
    isPlayable: true,
    featured: true,
    createdAt: "2026-03-15T18:30:00Z",
    tags: ["cybersecurity", "orbital", "distributed intelligence", "ai thriller"],
    keywords: ["ai", "hacker", "satellite", "space", "datacenter"]
  },
  {
    id: "VID002",
    videoId: "VID002",
    title: "Beyond the Horizon",
    contentType: "movie",
    type: "movie",
    synopsis: "A peaceful forest guardian takes a stand against woodland troublemakers in this cinematic animated epic of friendship, resilience, and courage.",
    description: "A peaceful forest guardian takes a stand against woodland troublemakers in this cinematic animated epic of friendship, resilience, and courage.",
    genres: ["Animation", "Adventure"],
    genre: "Animation",
    category: "Animation",
    releaseYear: 2025,
    year: 2025,
    durationSeconds: 33,
    imdbRating: "8.2",
    rating: "U",
    quality: "4K UHD",
    audio: "Dolby 5.1",
    posterKey: "media/thumbnails/big-buck-bunny.svg",
    thumbnailKey: "media/thumbnails/big-buck-bunny.svg",
    backdropKey: "media/thumbnails/big-buck-bunny.svg",
    videoKey: "media/videos/big-buck-bunny.mp4",
    objectKey: "media/videos/big-buck-bunny.mp4",
    availabilityStatus: "available",
    availability: "available",
    isPlayable: true,
    featured: true,
    createdAt: "2026-02-28T14:15:00Z",
    tags: ["woodland", "friendship", "courage", "family animation"],
    keywords: ["bunny", "forest", "animals", "funny", "relax", "family", "comedy"]
  },
  {
    id: "VID003",
    videoId: "VID003",
    title: "Flora: The Secret Kingdom",
    contentType: "series",
    type: "series",
    season: "Season 1",
    synopsis: "An unprecedented microscopic exploration into how botanical flora communicate, defend their canopy, and shape Earth's living biosphere.",
    description: "An unprecedented microscopic exploration into how botanical flora communicate, defend their canopy, and shape Earth's living biosphere.",
    genres: ["Documentary", "Nature & Wildlife"],
    genre: "Documentary",
    category: "Documentary",
    releaseYear: 2026,
    year: 2026,
    durationSeconds: 5,
    imdbRating: "8.9",
    rating: "U",
    quality: "HD 1080p",
    audio: "Stereo",
    posterKey: "media/thumbnails/botanical-life.svg",
    thumbnailKey: "media/thumbnails/botanical-life.svg",
    backdropKey: "media/thumbnails/botanical-life.svg",
    availabilityStatus: "available",
    availability: "available",
    isPlayable: true,
    featured: false,
    createdAt: "2026-03-22T09:00:00Z",
    tags: ["botany", "microscopic", "biosphere", "nature docuseries"],
    keywords: ["plants", "forest", "canopy", "science", "biology", "documentary"],
    seasons: [
      {
        seasonNum: 1,
        title: "Season 1",
        posterKey: "media/thumbnails/botanical-life.svg",
        episodes: [
          {
            id: "VID003-E1",
            parentSeriesId: "VID003",
            seasonNum: 1,
            episodeNum: 1,
            title: "Canopy Awakening",
            synopsis: "Microscopic optical lenses capture the dawn activation of cellular transpiration across old-growth rainforest trees.",
            durationSeconds: 5,
            videoKey: "media/videos/botanical-life.mp4",
            thumbnailKey: "media/thumbnails/botanical-life.svg",
            availabilityStatus: "available",
            isPlayable: true
          }
        ]
      }
    ],
    episodes: [
      {
        id: "VID003-E1",
        parentSeriesId: "VID003",
        seasonNum: 1,
        episodeNum: 1,
        title: "Canopy Awakening",
        synopsis: "Microscopic optical lenses capture the dawn activation of cellular transpiration across old-growth rainforest trees.",
        durationSeconds: 5,
        videoKey: "media/videos/botanical-life.mp4",
        thumbnailKey: "media/thumbnails/botanical-life.svg",
        availabilityStatus: "available",
        isPlayable: true
      }
    ]
  },
  {
    id: "VID004",
    videoId: "VID004",
    title: "Metropolis Nights",
    contentType: "series",
    type: "series",
    season: "Season 1",
    synopsis: "Beneath the vertical towers and rain-slicked thoroughfares of a 21st-century megacity, interconnected lives collide during one fateful midnight shift.",
    description: "Beneath the vertical towers and rain-slicked thoroughfares of a 21st-century megacity, interconnected lives collide during one fateful midnight shift.",
    genres: ["Drama", "Mystery"],
    genre: "Drama",
    category: "Drama",
    releaseYear: 2026,
    year: 2026,
    durationSeconds: 10,
    imdbRating: "8.4",
    rating: "U/A 16+",
    quality: "4K UHD",
    audio: "Dolby 5.1",
    posterKey: "media/thumbnails/urban-rhythm.svg",
    thumbnailKey: "media/thumbnails/urban-rhythm.svg",
    backdropKey: "media/thumbnails/urban-rhythm.svg",
    availabilityStatus: "available",
    availability: "available",
    isPlayable: true,
    featured: false,
    createdAt: "2026-03-10T11:45:00Z",
    tags: ["neon city", "midnight", "interconnected", "urban crime"],
    keywords: ["city", "rain", "midnight", "skyscrapers", "detective", "drama", "series"],
    seasons: [
      {
        seasonNum: 1,
        title: "Season 1",
        posterKey: "media/thumbnails/urban-rhythm.svg",
        episodes: [
          {
            id: "VID004-E1",
            parentSeriesId: "VID004",
            seasonNum: 1,
            episodeNum: 1,
            title: "Neon Skyline",
            synopsis: "Beneath towering vertical thoroughfares, an investigative team uncovers an encrypted orbital communications link.",
            durationSeconds: 10,
            videoKey: "media/videos/urban-rhythm.mp4",
            thumbnailKey: "media/thumbnails/urban-rhythm.svg",
            availabilityStatus: "available",
            isPlayable: true
          }
        ]
      }
    ],
    episodes: [
      {
        id: "VID004-E1",
        parentSeriesId: "VID004",
        seasonNum: 1,
        episodeNum: 1,
        title: "Neon Skyline",
        synopsis: "Beneath towering vertical thoroughfares, an investigative team uncovers an encrypted orbital communications link.",
        durationSeconds: 10,
        videoKey: "media/videos/urban-rhythm.mp4",
        thumbnailKey: "media/thumbnails/urban-rhythm.svg",
        availabilityStatus: "available",
        isPlayable: true
      }
    ]
  },
  {
    id: "VID005",
    videoId: "VID005",
    title: "Solaris Drift",
    contentType: "movie",
    type: "movie",
    synopsis: "A lone deep-space surveying vessel drifts into uncharted solar currents, forcing its navigators to compute survival vectors manually.",
    description: "A lone deep-space surveying vessel drifts into uncharted solar currents, forcing its navigators to compute survival vectors manually.",
    genres: ["Sci-Fi", "Adventure"],
    genre: "Sci-Fi",
    category: "Sci-Fi",
    releaseYear: 2026,
    year: 2026,
    durationSeconds: 7200,
    imdbRating: "7.9",
    rating: "U/A 13+",
    quality: "4K UHD",
    audio: "Dolby Atmos",
    posterKey: "media/thumbnails/cloud-intro.svg",
    thumbnailKey: "media/thumbnails/cloud-intro.svg",
    backdropKey: "media/thumbnails/cloud-intro.svg",
    videoKey: "media/videos/solaris-drift.mp4",
    objectKey: "media/videos/solaris-drift.mp4",
    availabilityStatus: "metadata_only",
    availability: "unavailable",
    isPlayable: false,
    featured: false,
    createdAt: "2026-04-01T10:00:00Z",
    tags: ["deep space", "solar drift", "navigation", "cosmic adventure"],
    keywords: ["sun", "solar", "spaceship", "drift", "stars", "cosmos"]
  },
  {
    id: "VID006",
    videoId: "VID006",
    title: "Silent Echoes",
    contentType: "movie",
    type: "movie",
    synopsis: "In a coastal archipelago shrouded in winter fog, an audio archivist discovers anomalous sound recordings dating back four decades.",
    description: "In a coastal archipelago shrouded in winter fog, an audio archivist discovers anomalous sound recordings dating back four decades.",
    genres: ["Mystery", "Drama"],
    genre: "Mystery",
    category: "Mystery",
    releaseYear: 2026,
    year: 2026,
    durationSeconds: 6400,
    imdbRating: "8.1",
    rating: "U/A 16+",
    quality: "4K UHD",
    audio: "Dolby 5.1",
    posterKey: "media/thumbnails/urban-rhythm.svg",
    thumbnailKey: "media/thumbnails/urban-rhythm.svg",
    backdropKey: "media/thumbnails/urban-rhythm.svg",
    videoKey: "media/videos/silent-echoes.mp4",
    objectKey: "media/videos/silent-echoes.mp4",
    availabilityStatus: "coming_soon",
    availability: "unavailable",
    isPlayable: false,
    featured: false,
    createdAt: "2026-04-05T12:00:00Z",
    tags: ["coastal mystery", "sound archivist", "fog", "investigation"],
    keywords: ["island", "audio", "recorder", "cold", "secret", "mystery"]
  },
  {
    id: "VID007",
    videoId: "VID007",
    title: "The Quantum Rift",
    contentType: "series",
    type: "series",
    season: "Season 1",
    synopsis: "When a subatomic particle accelerator in Geneva opens a microscopic bridge to a parallel timeline, physicists race to decipher signals from the other side.",
    description: "When a subatomic particle accelerator in Geneva opens a microscopic bridge to a parallel timeline, physicists race to decipher signals from the other side.",
    genres: ["Sci-Fi", "Thriller"],
    genre: "Sci-Fi",
    category: "Sci-Fi",
    releaseYear: 2026,
    year: 2026,
    durationSeconds: 3000,
    imdbRating: "8.5",
    rating: "U/A 16+",
    quality: "4K UHD",
    audio: "Dolby Atmos",
    posterKey: "media/thumbnails/cloud-intro.svg",
    thumbnailKey: "media/thumbnails/cloud-intro.svg",
    backdropKey: "media/thumbnails/cloud-intro.svg",
    availabilityStatus: "coming_soon",
    availability: "unavailable",
    isPlayable: false,
    featured: false,
    createdAt: "2026-04-10T15:00:00Z",
    tags: ["parallel timelines", "cern", "quantum physics", "multiverse"],
    keywords: ["quantum", "timeline", "parallel", "accelerator", "science", "multiverse"],
    seasons: [
      {
        seasonNum: 1,
        title: "Season 1",
        posterKey: "media/thumbnails/cloud-intro.svg",
        episodes: [
          {
            id: "VID007-E1",
            parentSeriesId: "VID007",
            seasonNum: 1,
            episodeNum: 1,
            title: "The Anomaly",
            synopsis: "Sensors in the main collider ring register impossible harmonic interference patterns matching quantum timeline echoes.",
            durationSeconds: 3000,
            videoKey: "media/videos/quantum-rift-e1.mp4",
            thumbnailKey: "media/thumbnails/cloud-intro.svg",
            availabilityStatus: "coming_soon",
            isPlayable: false
          }
        ]
      }
    ],
    episodes: [
      {
        id: "VID007-E1",
        parentSeriesId: "VID007",
        seasonNum: 1,
        episodeNum: 1,
        title: "The Anomaly",
        synopsis: "Sensors in the main collider ring register impossible harmonic interference patterns matching quantum timeline echoes.",
        durationSeconds: 3000,
        videoKey: "media/videos/quantum-rift-e1.mp4",
        thumbnailKey: "media/thumbnails/cloud-intro.svg",
        availabilityStatus: "coming_soon",
        isPlayable: false
      }
    ]
  }
];

// ============================================================================
// 2. Service Interfaces Architecture (Ready for AWS Backend)
// ============================================================================

/**
 * Media Path Resolution Service
 * Resolves local dev paths now, CloudFront CDN distribution paths later.
 */
const mediaService = {
  /**
   * Resolves a media key to a clean same-origin relative URL.
   * Maps legacy local prefixes ('media/thumbnails/', 'media/videos/') to canonical
   * S3 CloudFront prefixes ('posters/', 'videos/'), preserving custom URLs.
   * @param {string} key - e.g. "media/videos/cloud-intro.mp4" or "posters/cloud-intro.svg"
   * @returns {string} Relative URL for CloudFront delivery
   */
  resolveUrl(key) {
    if (!key) return '';
    if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('data:')) {
      return key;
    }
    let clean = key.replace(/^\/+/, '');

    // Canonical S3 key resolution for CloudFront distribution
    if (clean.startsWith('media/thumbnails/')) {
      clean = clean.replace('media/thumbnails/', 'posters/');
    } else if (clean.startsWith('media/videos/')) {
      clean = clean.replace('media/videos/', 'videos/');
    } else if (clean.startsWith('media/subtitles/')) {
      clean = clean.replace('media/subtitles/', 'subtitles/');
    }

    return clean;
  },
  
  createPosterPlaceholderSvg(title) {
    const safeTitle = escapeHTML(title || 'Morrow Cinema');
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="100%" height="100%"><rect width="100%" height="100%" fill="%231C1E20"/><rect x="20" y="20" width="560" height="860" fill="none" stroke="%23343638" stroke-width="2" rx="8"/><circle cx="300" cy="400" r="60" fill="%2324272A"/><polygon points="285,370 330,400 285,430" fill="%23C87552"/><text x="300" y="520" fill="%23F2EEE8" font-family="sans-serif" font-size="28" font-weight="700" text-anchor="middle">${safeTitle}</text><text x="300" y="560" fill="%23A8A49E" font-family="sans-serif" font-size="18" text-anchor="middle">MORROW ORIGINALS</text></svg>`;
  }
};

/**
 * Catalogue Service
 * Accesses title records, genres, search queries, and details.
 * Connects to live /api/videos with defensive error handling (no silent fixture fallback in production).
 */
const catalogueService = {
  apiStatus: 'idle', // 'idle' | 'loading' | 'success' | 'error'
  apiError: null,

  async loadFromApi() {
    this.apiStatus = 'loading';
    this.apiError = null;
    try {
      const res = await fetch('/api/videos');
      if (res.ok) {
        const payload = await res.json();
        const list = Array.isArray(payload) ? payload : (payload.data || payload.videos || []);
        if (Array.isArray(list) && list.length > 0) {
          MORROW_CATALOGUE.length = 0;
          MORROW_CATALOGUE.push(...list);
          this.apiStatus = 'success';
          return { success: true, count: list.length };
        }
      } else {
        const errBody = await res.text().catch(() => '');
        throw new Error(`Catalogue API returned HTTP ${res.status}: ${errBody || res.statusText}`);
      }
    } catch (err) {
      this.apiStatus = 'error';
      this.apiError = err.message;
      console.warn('Backend Catalogue API unavailable:', err.message);

      // In deployed web production, do NOT silently mask backend failure with mock data
      const isLocalFileMode = window.location.protocol === 'file:';
      if (!isLocalFileMode && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        MORROW_CATALOGUE.length = 0;
      }
      return { success: false, error: err.message };
    }
  },
  async getAll() {
    return [...MORROW_CATALOGUE];
  },
  async getMovies() {
    return MORROW_CATALOGUE.filter(item => item.contentType === 'movie');
  },
  async getSeries() {
    return MORROW_CATALOGUE.filter(item => item.contentType === 'series');
  },
  async getById(id) {
    return MORROW_CATALOGUE.find(item => item.id === id || item.videoId === id) || null;
  },
  async getFeatured() {
    return MORROW_CATALOGUE.filter(item => item.featured);
  },
  async getRecentlyAdded() {
    return [...MORROW_CATALOGUE].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async getPopular() {
    return [...MORROW_CATALOGUE].sort((a, b) => parseFloat(b.imdbRating || 0) - parseFloat(a.imdbRating || 0));
  },
  async getByGenre(genre) {
    const g = genre.toLowerCase().trim();
    return MORROW_CATALOGUE.filter(item => {
      const matchGenres = item.genres && item.genres.some(val => val.toLowerCase().includes(g) || g.includes(val.toLowerCase()));
      const matchGenre = item.genre && item.genre.toLowerCase().includes(g);
      const matchCat = item.category && item.category.toLowerCase().includes(g);
      return matchGenres || matchGenre || matchCat;
    });
  },
  async search(query, filters = {}) {
    let results = [...MORROW_CATALOGUE];

    // Content Type Filter
    if (filters.type && filters.type !== 'ALL') {
      results = results.filter(item => item.contentType === filters.type);
    }

    // Genre Filter
    if (filters.genre && filters.genre !== 'ALL') {
      const g = filters.genre.toLowerCase();
      results = results.filter(item => {
        return (item.genres && item.genres.some(val => val.toLowerCase() === g)) ||
               (item.genre && item.genre.toLowerCase() === g) ||
               (item.category && item.category.toLowerCase() === g);
      });
    }

    // Release Year Filter
    if (filters.year && filters.year !== 'ALL') {
      results = results.filter(item => String(item.releaseYear || item.year) === String(filters.year));
    }

    // Text Query
    if (query && query.trim() !== '') {
      const q = query.toLowerCase().trim();
      results = results.filter(item => 
        item.title.toLowerCase().includes(q) ||
        (item.synopsis && item.synopsis.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.genre && item.genre.toLowerCase().includes(q)) ||
        (item.genres && item.genres.some(val => val.toLowerCase().includes(q)))
      );
    }
    return results;
  }
};

/**
 * Watchlist Service (My List)
 * Persists saved title IDs in localStorage behind a clean async interface.
 */
const watchlistService = {
  STORAGE_KEY: 'morrow_watchlist',
  getList() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY) || localStorage.getItem('cloudstream_my_list');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  isInList(id) {
    return this.getList().includes(id);
  },
  add(id) {
    const list = this.getList();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    }
    return list;
  },
  remove(id) {
    let list = this.getList();
    list = list.filter(item => item !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    return list;
  },
  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
};

/**
 * Playback & Progress Service
 * Saves current time, duration, and completion timestamp.
 */
const playbackService = {
  STORAGE_KEY: 'morrow_watch_progress',
  getAllProgress() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },
  getProgress(id) {
    const all = this.getAllProgress();
    return all[id] || null;
  },
  saveProgress(id, currentTime, duration) {
    if (!id || !duration || isNaN(currentTime)) return;
    const all = this.getAllProgress();
    const percent = (currentTime / duration) * 100;
    all[id] = {
      id,
      currentTime,
      duration,
      percent: Math.min(100, percent),
      updatedAt: Date.now(),
      completed: percent >= 90
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
  },
  markCompleted(id) {
    const all = this.getAllProgress();
    if (all[id]) {
      all[id].completed = true;
      all[id].percent = 100;
      all[id].updatedAt = Date.now();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
    }
  },
  getContinueWatching() {
    const all = this.getAllProgress();
    const ids = Object.keys(all).filter(id => {
      const p = all[id];
      return p.percent > 2 && p.percent < 90 && !p.completed;
    });
    return ids
      .sort((a, b) => all[b].updatedAt - all[a].updatedAt)
      .map(id => ({ ...all[id], titleRecord: MORROW_CATALOGUE.find(t => t.id === id) }))
      .filter(item => item.titleRecord);
  },
  getRecentlyWatched() {
    const all = this.getAllProgress();
    const ids = Object.keys(all);
    return ids
      .sort((a, b) => all[b].updatedAt - all[a].updatedAt)
      .map(id => ({ ...all[id], titleRecord: MORROW_CATALOGUE.find(t => t.id === id) }))
      .filter(item => item.titleRecord);
  },
  getCompleted() {
    const all = this.getAllProgress();
    const ids = Object.keys(all).filter(id => all[id].completed || all[id].percent >= 90);
    return ids
      .sort((a, b) => all[b].updatedAt - all[a].updatedAt)
      .map(id => ({ ...all[id], titleRecord: MORROW_CATALOGUE.find(t => t.id === id) }))
      .filter(item => item.titleRecord);
  },
  clearAll() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
};

/**
 * Profile & Settings Service
 */
const profileService = {
  PREFS_KEY: 'morrow_user_preferences',
  SEARCH_HISTORY_KEY: 'morrow_search_history',
  getPreferences() {
    try {
      const p = localStorage.getItem(this.PREFS_KEY);
      return p ? JSON.parse(p) : { 
        autoplayNext: true, 
        autoplayPreviews: false, 
        reduceMotion: false, 
        quality: 'auto',
        subtitleLang: 'en',
        playbackSpeed: '1.0'
      };
    } catch {
      return { 
        autoplayNext: true, 
        autoplayPreviews: false, 
        reduceMotion: false, 
        quality: 'auto',
        subtitleLang: 'en',
        playbackSpeed: '1.0'
      };
    }
  },
  savePreferences(prefs) {
    localStorage.setItem(this.PREFS_KEY, JSON.stringify(prefs));
  },
  getRecentSearches() {
    try {
      const s = localStorage.getItem(this.SEARCH_HISTORY_KEY);
      return s ? JSON.parse(s) : ["Paradox", "Animation", "Documentary"];
    } catch {
      return ["Paradox", "Animation", "Documentary"];
    }
  },
  addRecentSearch(term) {
    if (!term || term.trim() === '') return;
    const history = this.getRecentSearches().filter(t => t.toLowerCase() !== term.toLowerCase());
    history.unshift(term.trim());
    localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, 6)));
  },
  clearRecentSearches() {
    localStorage.removeItem(this.SEARCH_HISTORY_KEY);
  }
};

/**
 * Morrow AI Concierge Service
 * Understands user entertainment prompts, queries verified catalogue metadata,
 * cross-references IMDb scores, and suggests real streaming titles.
 * Produces honest unavailable messages for unhosted titles.
 */
const aiService = {
  async processQuery(userInput) {
    const q = userInput.toLowerCase();

    // 1. Availability check for unhosted titles (e.g., Interstellar, Avatar, Oppenheimer, Batman)
    const unavailableTitles = ['interstellar', 'avatar', 'oppenheimer', 'batman', 'inception', 'stranger things', 'breaking bad', 'game of thrones'];
    const matchedUnavailable = unavailableTitles.find(t => q.includes(t));
    if (matchedUnavailable) {
      const capTitle = matchedUnavailable.charAt(0).toUpperCase() + matchedUnavailable.slice(1);
      const sciFiMatch = MORROW_CATALOGUE.find(item => item.id === 'VID001');
      return {
        message: `<em>${capTitle}</em> is currently not available on Morrow. However, if you enjoy high-stakes orbital tension, philosophical depth, and suspenseful sci-fi, I recommend streaming our top-rated original:`,
        recommendations: [sciFiMatch]
      };
    }

    // 2. Thriller / Suspense intent
    if (q.includes('thriller') || q.includes('suspense') || q.includes('twist') || q.includes('sci-fi') || q.includes('cloud') || q.includes('cyber')) {
      const matches = MORROW_CATALOGUE.filter(i => i.genres.includes('Sci-Fi') || i.genres.includes('Thriller') || i.genres.includes('Mystery'));
      return {
        message: `Here are our top-rated suspense and thriller titles on Morrow. They feature high stakes, tension, and exceptional IMDb ratings (such as <strong>★ 8.6</strong>):`,
        recommendations: matches
      };
    }

    // 3. Comedy / Lighthearted / Family / Animated intent
    if (q.includes('comedy') || q.includes('funny') || q.includes('family') || q.includes('relax') || q.includes('animated') || q.includes('animal') || q.includes('forest') || q.includes('two hours')) {
      const match = MORROW_CATALOGUE.find(i => i.id === 'VID002');
      return {
        message: `For an uplifting, beautifully animated experience well under two hours, <em>Beyond the Horizon</em> is an audience favourite with delightful character animation and an IMDb rating of <strong>★ 8.2</strong>:`,
        recommendations: [match]
      };
    }

    // 4. Documentary / Nature / Short watch intent
    if (q.includes('documentary') || q.includes('nature') || q.includes('short') || q.includes('plants') || q.includes('science') || q.includes('wildlife')) {
      const match = MORROW_CATALOGUE.find(i => i.id === 'VID003');
      return {
        message: `Looking for breathtaking microscopic cinematography? <em>Flora: The Secret Kingdom</em> offers an unprecedented view of botanical life with our highest score of <strong>★ 8.9 IMDb</strong>:`,
        recommendations: [match]
      };
    }

    // 5. Drama / Urban / Series intent
    if (q.includes('drama') || q.includes('city') || q.includes('series') || q.includes('night') || q.includes('episode') || q.includes('highest rated')) {
      const seriesList = MORROW_CATALOGUE.filter(i => i.contentType === 'series');
      return {
        message: `Here are our atmospheric serial productions on Morrow, including high-definition episodic docuseries and midnight urban dramas:`,
        recommendations: seriesList
      };
    }

    // Default: General curated catalogue recommendations
    return {
      message: `Based on your request, here are verified titles from the Morrow entertainment catalogue:`,
      recommendations: MORROW_CATALOGUE.slice(0, 2)
    };
  }
};

// ============================================================================
// 3. Application State & Controller
// ============================================================================
const app = {
  currentRoute: 'home',
  previousRoute: 'home',
  activeVideoId: null,
  activeEpisodeId: null,
  heroIndex: 0,
  heroTitles: [],
  playerSaveInterval: null,
  playerControlsTimeout: null,
  lastRemovedId: null,

  // Initialize Application
  async init() {
    await catalogueService.loadFromApi();
    this.heroTitles = await catalogueService.getFeatured();
    this.setupNavigation();
    this.setupHeroCarousel();
    this.setupMoviesPageFilters();
    this.setupSeriesPageFilters();
    this.setupSearch();
    this.setupAIConcierge();
    this.setupPlayer();
    this.setupLibraryTabs();
    this.setupSettings();
    this.setupToastsAndDialogs();
    this.setupKeyboardShortcuts();

    // Listen to hash routes
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute(); // Initial load
    this.updateWatchlistBadges();

    // Apply reduced motion preference if stored
    const prefs = profileService.getPreferences();
    if (prefs.reduceMotion) {
      document.body.classList.add('reduced-motion');
    }
  },

  // Route Handling
  async handleRoute() {
    const rawHash = window.location.hash || '#/';
    let route = 'home';
    let param = '';
    let queryParams = {};

    // Parse path and query parameters
    const [pathPart, queryPart] = rawHash.split('?');
    if (queryPart) {
      const sp = new URLSearchParams(queryPart);
      for (const [key, val] of sp.entries()) {
        queryParams[key] = val;
      }
    }

    if (pathPart === '#/' || pathPart === '#home' || pathPart === '') {
      route = 'home';
    } else if (pathPart === '#/movies') {
      route = 'movies';
    } else if (pathPart === '#/series') {
      route = 'series';
    } else if (pathPart.startsWith('#/genre/')) {
      route = 'genre';
      param = decodeURIComponent(pathPart.replace('#/genre/', ''));
    } else if (pathPart === '#/search') {
      route = 'search';
    } else if (pathPart === '#/ai') {
      route = 'ai';
    } else if (pathPart === '#/my-list') {
      route = 'my-list';
    } else if (pathPart === '#/continue-watching') {
      route = 'my-list';
      queryParams.tab = 'continue';
    } else if (pathPart === '#/history') {
      route = 'my-list';
      queryParams.tab = 'history';
    } else if (pathPart === '#/completed') {
      route = 'my-list';
      queryParams.tab = 'completed';
    } else if (pathPart.startsWith('#/title/')) {
      route = 'title';
      param = pathPart.replace('#/title/', '');
    } else if (pathPart.startsWith('#/watch/')) {
      route = 'watch';
      param = pathPart.replace('#/watch/', '');
    } else if (pathPart === '#/settings') {
      route = 'settings';
    } else if (pathPart === '#/profiles') {
      route = 'profiles';
    } else if (pathPart === '#/help') {
      route = 'help';
    } else {
      route = '404';
    }

    // Clean up video playback if leaving player view
    if (this.currentRoute === 'watch' && route !== 'watch') {
      this.stopPlayer();
    }

    if (route !== 'watch' && route !== 'title' && route !== '404') {
      this.previousRoute = route;
    }

    this.currentRoute = route;
    this.renderRoute(route, param, queryParams);
    this.updateActiveNavLinks(route);
  },

  renderRoute(route, param, queryParams = {}) {
    // Hide all view pages
    document.querySelectorAll('.page-view').forEach(view => view.style.display = 'none');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (route === 'home') {
      document.getElementById('view-home').style.display = 'block';
      this.renderHomePage();
    } else if (route === 'movies') {
      document.getElementById('view-movies').style.display = 'block';
      this.renderMoviesPage();
    } else if (route === 'series') {
      document.getElementById('view-series').style.display = 'block';
      this.renderSeriesPage();
    } else if (route === 'genre') {
      document.getElementById('view-genre').style.display = 'block';
      this.renderGenrePage(param);
    } else if (route === 'search') {
      document.getElementById('view-search').style.display = 'block';
      this.renderSearchPage(queryParams);
    } else if (route === 'ai') {
      document.getElementById('view-ai').style.display = 'block';
      setTimeout(() => document.getElementById('ai-user-input').focus(), 150);
    } else if (route === 'my-list') {
      document.getElementById('view-mylist').style.display = 'block';
      this.renderLibraryPage(queryParams.tab || 'watchlist');
    } else if (route === 'title') {
      document.getElementById('view-title').style.display = 'block';
      this.renderTitleDetailsPage(param);
    } else if (route === 'watch') {
      document.getElementById('view-player').style.display = 'flex';
      this.startPlayer(param, queryParams.ep);
    } else if (route === 'settings') {
      document.getElementById('view-settings').style.display = 'block';
      this.renderSettingsPage();
    } else if (route === 'profiles') {
      document.getElementById('view-profiles').style.display = 'block';
    } else if (route === 'help') {
      document.getElementById('view-help').style.display = 'block';
    } else if (route === '404') {
      document.getElementById('view-not-found').style.display = 'block';
    }
  },

  updateActiveNavLinks(route) {
    document.querySelectorAll('.nav-link, .bottom-nav-link').forEach(link => {
      const match = link.getAttribute('data-route') === route;
      link.classList.toggle('active', match);
    });
  },

  updateWatchlistBadges() {
    const count = watchlistService.getList().length;
    const badge = document.getElementById('mylist-count');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
  },

  // --------------------------------------------------------------------------
  // 4. Homepage & Hero Carousel
  // --------------------------------------------------------------------------
  async renderHomePage() {
    // 1. Featured Hero
    this.updateHeroSlide();

    // 2. Continue Watching (dynamically rendered when progress exists)
    const cwItems = playbackService.getContinueWatching();
    const cwSection = document.getElementById('section-continue-watching');
    const cwGrid = document.getElementById('grid-continue-watching');
    if (cwItems.length > 0) {
      cwSection.style.display = 'block';
      cwGrid.innerHTML = '';
      cwItems.forEach(item => {
        cwGrid.appendChild(this.createCard(item.titleRecord, { progress: item.percent }));
      });
    } else {
      cwSection.style.display = 'none';
    }

    // 3. Popular on Morrow
    const popularGrid = document.getElementById('grid-popular');
    popularGrid.innerHTML = '';
    const popularTitles = await catalogueService.getPopular();
    popularTitles.slice(0, 4).forEach(item => {
      popularGrid.appendChild(this.createCard(item));
    });

    // 4. Recently Added
    const recentGrid = document.getElementById('grid-recently-added');
    recentGrid.innerHTML = '';
    const recentTitles = await catalogueService.getRecentlyAdded();
    recentTitles.slice(0, 4).forEach(item => {
      recentGrid.appendChild(this.createCard(item));
    });

    // 5. Series Worth Exploring
    const seriesGrid = document.getElementById('grid-home-series');
    seriesGrid.innerHTML = '';
    const seriesList = await catalogueService.getSeries();
    seriesList.forEach(item => {
      seriesGrid.appendChild(this.createCard(item));
    });

    // 6. Explore All Titles
    const allGrid = document.getElementById('grid-home-all');
    allGrid.innerHTML = '';
    const allTitles = await catalogueService.getAll();
    allTitles.forEach(item => {
      allGrid.appendChild(this.createCard(item));
    });
    document.getElementById('home-all-count').textContent = `${allTitles.length} titles available`;
  },

  setupHeroCarousel() {
    const prevBtn = document.getElementById('hero-prev-btn');
    const nextBtn = document.getElementById('hero-next-btn');
    const heroSection = document.getElementById('hero-section');
    const heroTitle = document.getElementById('hero-title');

    const prevSlide = () => {
      this.heroIndex = (this.heroIndex - 1 + this.heroTitles.length) % this.heroTitles.length;
      this.updateHeroSlide();
    };

    const nextSlide = () => {
      this.heroIndex = (this.heroIndex + 1) % this.heroTitles.length;
      this.updateHeroSlide();
    };

    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);

    // Keyboard navigation when hero has focus
    heroSection.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
      }
    });

    heroTitle.addEventListener('click', () => {
      const current = this.heroTitles[this.heroIndex];
      if (current) window.location.hash = `#/title/${current.id}`;
    });
    heroTitle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const current = this.heroTitles[this.heroIndex];
        if (current) window.location.hash = `#/title/${current.id}`;
      }
    });
  },

  updateHeroSlide() {
    if (!this.heroTitles.length) return;
    const current = this.heroTitles[this.heroIndex] || this.heroTitles[0];

    document.getElementById('hero-title').textContent = current.title;
    document.getElementById('hero-genre').textContent = current.genre || current.category;
    document.getElementById('hero-year').textContent = current.releaseYear || current.year;
    document.getElementById('hero-duration').textContent = formatDuration(current.durationSeconds);
    document.getElementById('hero-synopsis').textContent = current.synopsis || current.description;
    document.getElementById('hero-rating-tag').textContent = `★ ${current.imdbRating || '8.5'} IMDb`;

    const backdropUrl = mediaService.resolveUrl(current.posterKey || current.thumbnailKey);
    document.getElementById('hero-backdrop').style.backgroundImage = `url('${backdropUrl}')`;

    // Action buttons
    document.getElementById('hero-play-btn').onclick = () => {
      if (!current.isPlayable) {
        window.location.hash = `#/title/${current.id}`;
        return;
      }
      window.location.hash = `#/watch/${current.id}`;
    };
    document.getElementById('hero-info-btn').onclick = () => {
      window.location.hash = `#/title/${current.id}`;
    };

    const inList = watchlistService.isInList(current.id);
    const listBtn = document.getElementById('hero-list-btn');
    listBtn.innerHTML = inList
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><polyline points="20 6 9 17 4 12"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><path d="M12 5v14M5 12h14"/></svg>`;
    listBtn.title = inList ? 'Saved in My List' : 'Add to My List';
    listBtn.onclick = () => {
      this.toggleWatchlist(current.id);
      this.updateHeroSlide();
    };

    // Indicators
    const indicatorsBox = document.getElementById('hero-indicators');
    indicatorsBox.innerHTML = '';
    this.heroTitles.forEach((_, idx) => {
      const dot = document.createElement('div');
      dot.className = `carousel-dot ${idx === this.heroIndex ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Slide ${idx + 1}`);
      dot.onclick = () => {
        this.heroIndex = idx;
        this.updateHeroSlide();
      };
      indicatorsBox.appendChild(dot);
    });
  },

  // --------------------------------------------------------------------------
  // 5. Content Card Component (Reusable OTT Component)
  // --------------------------------------------------------------------------
  createCard(item, options = {}) {
    const card = document.createElement('article');
    card.className = 'video-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${item.title} (${item.contentType === 'series' ? 'Series' : 'Movie'})`);

    const posterUrl = mediaService.resolveUrl(item.posterKey || item.thumbnailKey);
    const durationText = formatDuration(item.durationSeconds);
    const inList = watchlistService.isInList(item.id);
    const typeLabel = item.contentType === 'series' ? 'Series' : 'Movie';
    const ratingText = item.imdbRating ? `★ ${item.imdbRating}` : '★ 8.5';

    let progressHtml = '';
    if (options.progress !== undefined) {
      progressHtml = `
        <div class="card-progress-bar">
          <div class="card-progress-fill" style="width: ${options.progress}%"></div>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-poster-wrapper">
        <img 
          src="${posterUrl}" 
          alt="${escapeHTML(item.title)}" 
          class="card-poster" 
          loading="lazy"
          onerror="this.onerror=null; this.src='${mediaService.createPosterPlaceholderSvg(item.title)}';"
        >
        <div class="card-overlay-gradient"></div>
        <span class="card-type-badge">${typeLabel}</span>
        ${!item.isPlayable ? `
          <span class="card-status-badge ${item.availabilityStatus === 'coming_soon' ? 'coming-soon' : 'info-only'}">
            ${item.availabilityStatus === 'coming_soon' ? 'Coming Soon' : 'Info Only'}
          </span>
        ` : ''}
        <span class="card-rating-badge">${ratingText}</span>
        <span class="card-duration-badge">${durationText}</span>
        ${progressHtml}
        ${item.isPlayable ? `
          <div class="card-play-hover-btn" aria-hidden="true" title="Watch Now">
            <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="7,5 19,12 7,19"/></svg>
          </div>
        ` : ''}
      </div>
      <div class="card-body">
        <div class="card-eyebrow">
          <span class="card-genre">${escapeHTML(item.genre || item.category || 'Feature')}</span>
          <button type="button" class="card-action-btn card-toggle-list" title="${inList ? 'Remove from My List' : 'Add to My List'}">
            ${inList ? '✓ Saved' : '+ My List'}
          </button>
        </div>
        <h3 class="card-title">${escapeHTML(item.title)}</h3>
        <p class="card-desc">${escapeHTML(item.synopsis || item.description || '')}</p>
        <div class="card-footer">
          <div class="card-quick-actions">
            <button type="button" class="card-action-btn card-action-play" ${!item.isPlayable ? 'title="View Details"' : ''}>
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="7,5 19,12 7,19"/></svg>
              ${item.isPlayable ? 'Watch' : (item.availabilityStatus === 'coming_soon' ? 'Coming Soon' : 'Details')}
            </button>
            <button type="button" class="card-action-btn card-action-details">
              More Info
            </button>
          </div>
          <span class="quality-tag">${item.quality || '4K'}</span>
        </div>
      </div>
    `;

    // Click Interactions
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-toggle-list')) {
        e.stopPropagation();
        this.toggleWatchlist(item.id);
        const btn = card.querySelector('.card-toggle-list');
        const nowInList = watchlistService.isInList(item.id);
        btn.textContent = nowInList ? '✓ Saved' : '+ My List';
        return;
      }
      if (e.target.closest('.card-action-play') || e.target.closest('.card-play-hover-btn')) {
        e.stopPropagation();
        if (!item.isPlayable) {
          window.location.hash = `#/title/${item.id}`;
          return;
        }
        window.location.hash = `#/watch/${item.id}`;
        return;
      }
      window.location.hash = `#/title/${item.id}`;
    });

    // Keyboard Enter / Space opens details
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.hash = `#/title/${item.id}`;
      }
    });

    return card;
  },

  // --------------------------------------------------------------------------
  // 6. Movies Page (#/movies)
  // --------------------------------------------------------------------------
  setupMoviesPageFilters() {
    const searchInput = document.getElementById('search-movies-input');
    const genreSelect = document.getElementById('filter-movies-genre');
    const yearSelect = document.getElementById('filter-movies-year');
    const sortSelect = document.getElementById('sort-movies');
    const clearBtn = document.getElementById('btn-clear-movies-filters');
    const resetBtn = document.getElementById('btn-reset-movies-filters');

    const triggerUpdate = () => this.renderMoviesPage();

    if (searchInput) searchInput.addEventListener('input', triggerUpdate);
    if (genreSelect) genreSelect.addEventListener('change', triggerUpdate);
    if (yearSelect) yearSelect.addEventListener('change', triggerUpdate);
    if (sortSelect) sortSelect.addEventListener('change', triggerUpdate);

    const resetFilters = () => {
      if (searchInput) searchInput.value = '';
      if (genreSelect) genreSelect.value = 'ALL';
      if (yearSelect) yearSelect.value = 'ALL';
      if (sortSelect) sortSelect.value = 'featured';
      triggerUpdate();
    };

    if (clearBtn) clearBtn.addEventListener('click', resetFilters);
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
  },

  async renderMoviesPage() {
    const movies = await catalogueService.getMovies();
    const grid = document.getElementById('grid-movies-page');
    const searchInput = document.getElementById('search-movies-input');
    const genreSelect = document.getElementById('filter-movies-genre');
    const yearSelect = document.getElementById('filter-movies-year');
    const sortSelect = document.getElementById('sort-movies');
    const countLabel = document.getElementById('movies-results-count');
    const emptyState = document.getElementById('movies-empty-state');

    let filtered = [...movies];

    // Search query within movies
    if (searchInput && searchInput.value.trim()) {
      const q = searchInput.value.toLowerCase().trim();
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(q) ||
        (m.synopsis && m.synopsis.toLowerCase().includes(q)) ||
        (m.genres && m.genres.some(g => g.toLowerCase().includes(q)))
      );
    }

    // Genre Filter
    if (genreSelect && genreSelect.value !== 'ALL') {
      const g = genreSelect.value.toLowerCase();
      filtered = filtered.filter(m => 
        (m.genre || '').toLowerCase() === g || 
        (m.genres && m.genres.some(val => val.toLowerCase() === g))
      );
    }

    // Year Filter
    if (yearSelect && yearSelect.value !== 'ALL') {
      filtered = filtered.filter(m => String(m.releaseYear || m.year) === String(yearSelect.value));
    }

    // Sort Order
    const sort = sortSelect ? sortSelect.value : 'featured';
    if (sort === 'rating') {
      filtered.sort((a, b) => parseFloat(b.imdbRating || 0) - parseFloat(a.imdbRating || 0));
    } else if (sort === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'year') {
      filtered.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
    } else if (sort === 'recent') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    grid.innerHTML = '';
    if (filtered.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'flex';
      countLabel.textContent = `0 movies found`;
    } else {
      grid.style.display = 'grid';
      emptyState.style.display = 'none';
      filtered.forEach(m => grid.appendChild(this.createCard(m)));
      countLabel.textContent = `Showing ${filtered.length} ${filtered.length === 1 ? 'movie' : 'movies'}`;
    }
  },

  // --------------------------------------------------------------------------
  // 7. Series Page (#/series)
  // --------------------------------------------------------------------------
  setupSeriesPageFilters() {
    const searchInput = document.getElementById('search-series-input');
    const genreSelect = document.getElementById('filter-series-genre');
    const yearSelect = document.getElementById('filter-series-year');
    const sortSelect = document.getElementById('sort-series');
    const clearBtn = document.getElementById('btn-clear-series-filters');
    const resetBtn = document.getElementById('btn-reset-series-filters');

    const triggerUpdate = () => this.renderSeriesPage();

    if (searchInput) searchInput.addEventListener('input', triggerUpdate);
    if (genreSelect) genreSelect.addEventListener('change', triggerUpdate);
    if (yearSelect) yearSelect.addEventListener('change', triggerUpdate);
    if (sortSelect) sortSelect.addEventListener('change', triggerUpdate);

    const resetFilters = () => {
      if (searchInput) searchInput.value = '';
      if (genreSelect) genreSelect.value = 'ALL';
      if (yearSelect) yearSelect.value = 'ALL';
      if (sortSelect) sortSelect.value = 'featured';
      triggerUpdate();
    };

    if (clearBtn) clearBtn.addEventListener('click', resetFilters);
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
  },

  async renderSeriesPage() {
    const series = await catalogueService.getSeries();
    const grid = document.getElementById('grid-series-page');
    const searchInput = document.getElementById('search-series-input');
    const genreSelect = document.getElementById('filter-series-genre');
    const yearSelect = document.getElementById('filter-series-year');
    const sortSelect = document.getElementById('sort-series');
    const countLabel = document.getElementById('series-results-count');
    const emptyState = document.getElementById('series-empty-state');

    let filtered = [...series];

    if (searchInput && searchInput.value.trim()) {
      const q = searchInput.value.toLowerCase().trim();
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(q) ||
        (s.synopsis && s.synopsis.toLowerCase().includes(q)) ||
        (s.genres && s.genres.some(g => g.toLowerCase().includes(q)))
      );
    }

    if (genreSelect && genreSelect.value !== 'ALL') {
      const g = genreSelect.value.toLowerCase();
      filtered = filtered.filter(s => 
        (s.genre || '').toLowerCase() === g || 
        (s.genres && s.genres.some(val => val.toLowerCase() === g))
      );
    }

    if (yearSelect && yearSelect.value !== 'ALL') {
      filtered = filtered.filter(s => String(s.releaseYear || s.year) === String(yearSelect.value));
    }

    const sort = sortSelect ? sortSelect.value : 'featured';
    if (sort === 'rating') {
      filtered.sort((a, b) => parseFloat(b.imdbRating || 0) - parseFloat(a.imdbRating || 0));
    } else if (sort === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'recent') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    grid.innerHTML = '';
    if (filtered.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'flex';
      countLabel.textContent = `0 series found`;
    } else {
      grid.style.display = 'grid';
      emptyState.style.display = 'none';
      filtered.forEach(s => grid.appendChild(this.createCard(s)));
      countLabel.textContent = `Showing ${filtered.length} ${filtered.length === 1 ? 'series' : 'series'}`;
    }
  },

  // --------------------------------------------------------------------------
  // 8. Genre Filter Catalogue (#/genre/:slug)
  // --------------------------------------------------------------------------
  async renderGenrePage(slug) {
    const rawSlug = slug || 'all';
    const genreTitle = rawSlug.charAt(0).toUpperCase() + rawSlug.slice(1);
    document.getElementById('genre-view-title').textContent = genreTitle;
    document.getElementById('genre-pill-text').textContent = genreTitle;

    const countLabel = document.getElementById('genre-results-count');
    const grid = document.getElementById('grid-genre-page');
    const emptyState = document.getElementById('genre-empty-state');

    const titles = await catalogueService.getByGenre(rawSlug);
    grid.innerHTML = '';

    if (titles.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'flex';
      countLabel.textContent = `0 titles in ${genreTitle}`;
    } else {
      grid.style.display = 'grid';
      emptyState.style.display = 'none';
      titles.forEach(item => grid.appendChild(this.createCard(item)));
      countLabel.textContent = `Showing ${titles.length} ${titles.length === 1 ? 'title' : 'titles'} in ${genreTitle}`;
    }
  },

  // --------------------------------------------------------------------------
  // 9. Search Experience (#/search)
  // --------------------------------------------------------------------------
  setupSearch() {
    const input = document.getElementById('search-page-input');
    const clearBtn = document.getElementById('btn-clear-search-page');
    const typePills = document.querySelectorAll('.search-type-pill');
    const genreSelect = document.getElementById('search-genre-select');
    const yearSelect = document.getElementById('search-year-select');
    let debounceTimer;

    const performSearch = () => {
      const activeTypePill = document.querySelector('.search-type-pill.active');
      const filters = {
        type: activeTypePill ? activeTypePill.getAttribute('data-type') : 'ALL',
        genre: genreSelect ? genreSelect.value : 'ALL',
        year: yearSelect ? yearSelect.value : 'ALL'
      };
      this.executeSearch(input.value, filters);
    };

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(performSearch, 180);
    });

    clearBtn.addEventListener('click', () => {
      input.value = '';
      performSearch();
    });

    typePills.forEach(pill => {
      pill.addEventListener('click', () => {
        typePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        performSearch();
      });
    });

    if (genreSelect) genreSelect.addEventListener('change', performSearch);
    if (yearSelect) yearSelect.addEventListener('change', performSearch);

    document.getElementById('btn-clear-recent-searches').addEventListener('click', () => {
      profileService.clearRecentSearches();
      this.renderRecentSearchTags();
    });
  },

  renderSearchPage(queryParams = {}) {
    this.renderRecentSearchTags();
    const input = document.getElementById('search-page-input');
    if (queryParams.q) {
      input.value = queryParams.q;
    }
    const activeTypePill = document.querySelector('.search-type-pill.active');
    const filters = {
      type: activeTypePill ? activeTypePill.getAttribute('data-type') : 'ALL',
      genre: document.getElementById('search-genre-select').value,
      year: document.getElementById('search-year-select').value
    };
    this.executeSearch(input.value || '', filters);
  },

  renderRecentSearchTags() {
    const container = document.getElementById('recent-search-tags');
    container.innerHTML = '';
    const recents = profileService.getRecentSearches();
    recents.forEach(tag => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'recent-tag-btn';
      btn.textContent = tag;
      btn.onclick = () => {
        const input = document.getElementById('search-page-input');
        input.value = tag;
        this.executeSearch(tag);
      };
      container.appendChild(btn);
    });
  },

  async executeSearch(query, filters = {}) {
    const grid = document.getElementById('grid-search-results');
    const emptyState = document.getElementById('search-empty-state');
    const heading = document.getElementById('search-results-heading');
    const countLabel = document.getElementById('search-results-count');

    if (query && query.trim() !== '') {
      profileService.addRecentSearch(query);
      this.renderRecentSearchTags();
      heading.textContent = `Results for "${query}"`;
    } else {
      heading.textContent = "Explore Catalogue";
    }

    const results = await catalogueService.search(query, filters);
    countLabel.textContent = `${results.length} ${results.length === 1 ? 'title' : 'titles'} found`;

    grid.innerHTML = '';
    if (results.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'flex';
      document.getElementById('search-empty-msg').textContent = `No titles matched "${query || 'selected filters'}".`;
    } else {
      grid.style.display = 'grid';
      emptyState.style.display = 'none';
      results.forEach(item => grid.appendChild(this.createCard(item)));
    }
  },

  // --------------------------------------------------------------------------
  // 10. Morrow AI Concierge (#/ai)
  // --------------------------------------------------------------------------
  setupAIConcierge() {
    const input = document.getElementById('ai-user-input');
    const sendBtn = document.getElementById('btn-send-ai');

    const handleSend = async () => {
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      this.appendAIMessage('user', text);

      // Loading bubble
      const loadingBubble = this.appendAIMessage('assistant', 'Verifying catalogue metadata and analyzing plot elements...');

      const response = await aiService.processQuery(text);
      loadingBubble.remove();

      this.appendAIMessage('assistant', response.message, response.recommendations);
    };

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // Prompt pills
    document.querySelectorAll('.ai-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.getAttribute('data-prompt');
        handleSend();
      });
    });

    // Clear chat with modal
    document.getElementById('btn-clear-ai-chat').addEventListener('click', () => {
      this.showConfirmDialog('Clear Conversation', 'Do you want to reset your Morrow AI session?', () => {
        const chatWindow = document.getElementById('ai-chat-window');
        chatWindow.innerHTML = `
          <div class="ai-message assistant">
            <div class="ai-avatar">AI</div>
            <div class="ai-bubble">
              <p>Conversation cleared. Tell me what mood you're in, and let's find your next favourite story!</p>
            </div>
          </div>
        `;
        this.showToast('AI conversation reset.');
      });
    });
  },

  appendAIMessage(sender, text, recommendations = []) {
    const chatWindow = document.getElementById('ai-chat-window');
    const msg = document.createElement('div');
    msg.className = `ai-message ${sender}`;

    let recHtml = '';
    if (recommendations && recommendations.length > 0) {
      recHtml = `<div class="ai-recommendation-cards"></div>`;
    }

    msg.innerHTML = `
      <div class="ai-avatar">${sender === 'user' ? 'YOU' : 'AI'}</div>
      <div class="ai-bubble">
        <p>${text}</p>
        ${recHtml}
      </div>
    `;

    chatWindow.appendChild(msg);

    // Append verified recommendation cards using shared createCard component
    if (recommendations && recommendations.length > 0) {
      const recContainer = msg.querySelector('.ai-recommendation-cards');
      recommendations.forEach(item => {
        recContainer.appendChild(this.createCard(item));
      });
    }

    chatWindow.scrollTop = chatWindow.scrollHeight;
    return msg;
  },

  // --------------------------------------------------------------------------
  // 11. Title Details Dedicated Page (#/title/:id)
  // --------------------------------------------------------------------------
  async renderTitleDetailsPage(id) {
    const title = await catalogueService.getById(id);
    if (!title) {
      window.location.hash = '#/404';
      return;
    }

    document.getElementById('title-page-name').textContent = title.title;
    document.getElementById('title-page-type').textContent = title.contentType === 'series' ? 'SERIES' : 'MOVIE';
    document.getElementById('title-page-quality').textContent = title.quality || '4K UHD';
    document.getElementById('title-page-rating').textContent = `★ ${title.imdbRating || '8.5'} IMDb`;
    document.getElementById('title-page-genre').textContent = title.genre || title.category;
    document.getElementById('title-page-year').textContent = title.releaseYear || title.year;
    document.getElementById('title-page-duration').textContent = formatDuration(title.durationSeconds);
    document.getElementById('title-page-audio').textContent = title.audio || 'Dolby Audio';
    document.getElementById('title-page-synopsis').textContent = title.synopsis || title.description;

    const posterUrl = mediaService.resolveUrl(title.posterKey || title.thumbnailKey);
    document.getElementById('title-page-backdrop').style.backgroundImage = `url('${posterUrl}')`;
    
    const posterImg = document.getElementById('title-page-poster');
    posterImg.src = posterUrl;
    posterImg.onerror = () => {
      posterImg.src = mediaService.createPosterPlaceholderSvg(title.title);
    };

    // Availability validation check
    const isAvailable = Boolean(title.isPlayable && title.availabilityStatus === 'available' && (title.videoKey || title.objectKey || (title.contentType === 'series' && title.episodes && title.episodes.some(e => e.isPlayable))));
    const unavailBanner = document.getElementById('title-unavailable-banner');
    const playBtn = document.getElementById('title-page-play-btn');
    const unavailSpan = unavailBanner ? unavailBanner.querySelector('span') : null;

    if (!isAvailable) {
      if (unavailBanner) {
        unavailBanner.style.display = 'flex';
        if (title.availabilityStatus === 'coming_soon') {
          if (unavailSpan) unavailSpan.textContent = 'Coming Soon: This title is scheduled for an upcoming release and is not yet available for streaming.';
        } else {
          if (unavailSpan) unavailSpan.textContent = 'Catalogue Record Only: Media assets are pending cloud ingestion in Phase 3. Playback is currently unavailable.';
        }
      }
      playBtn.disabled = true;
      playBtn.classList.add('disabled');
      document.getElementById('title-page-play-label').textContent = title.availabilityStatus === 'coming_soon' ? 'Coming Soon' : 'Catalogue Only';
      playBtn.onclick = null;
    } else {
      if (unavailBanner) unavailBanner.style.display = 'none';
      playBtn.disabled = false;
      playBtn.classList.remove('disabled');

      // Watch / Resume Action Label
      const progress = playbackService.getProgress(title.id);
      const playLabel = document.getElementById('title-page-play-label');
      playLabel.textContent = (progress && progress.percent > 5 && !progress.completed) 
        ? `Resume (${formatDuration(progress.currentTime)})` 
        : 'Watch Now';

      playBtn.onclick = () => {
        window.location.hash = `#/watch/${title.id}`;
      };
    }

    // My List Button
    const listBtn = document.getElementById('title-page-list-btn');
    const inList = watchlistService.isInList(title.id);
    document.getElementById('title-page-list-label').textContent = inList ? 'In My List' : 'Add to My List';
    listBtn.onclick = () => {
      this.toggleWatchlist(title.id);
      const updated = watchlistService.isInList(title.id);
      document.getElementById('title-page-list-label').textContent = updated ? 'In My List' : 'Add to My List';
    };

    // Share Button
    document.getElementById('title-page-share-btn').onclick = () => {
      navigator.clipboard.writeText(window.location.href);
      this.showToast('Title link copied to clipboard!');
    };

    // Series Episodes (if Series)
    const epSection = document.getElementById('title-episodes-section');
    const epList = document.getElementById('title-episodes-list');
    if (title.contentType === 'series' && title.episodes && title.episodes.length > 0) {
      epSection.style.display = 'block';
      epList.innerHTML = '';
      title.episodes.forEach(ep => {
        const epCard = document.createElement('div');
        epCard.className = 'episode-card';
        const epPlayable = Boolean(ep.isPlayable && ep.availabilityStatus === 'available');
        epCard.innerHTML = `
          <div class="episode-info">
            <span class="episode-num">${ep.episodeNum}</span>
            <div>
              <div class="episode-title">${escapeHTML(ep.title)}</div>
              <div class="episode-duration">${formatDuration(ep.durationSeconds)} • ${epPlayable ? 'HD 1080p' : (ep.availabilityStatus === 'coming_soon' ? 'Coming Soon' : 'Catalogue Only')}</div>
            </div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm ep-play-btn" ${!epPlayable ? 'disabled' : ''}>
            ${epPlayable ? 'Play Episode' : (ep.availabilityStatus === 'coming_soon' ? 'Coming Soon' : 'Unavailable')}
          </button>
        `;
        if (epPlayable) {
          epCard.onclick = () => {
            window.location.hash = `#/watch/${title.id}?ep=${ep.id}`;
          };
        } else {
          epCard.style.cursor = 'default';
        }
        epList.appendChild(epCard);
      });
    } else {
      epSection.style.display = 'none';
    }

    // Related Titles
    const relGrid = document.getElementById('grid-title-related');
    relGrid.innerHTML = '';
    const all = await catalogueService.getAll();
    all.filter(t => t.id !== title.id).slice(0, 3).forEach(rel => {
      relGrid.appendChild(this.createCard(rel));
    });

    document.getElementById('title-back-btn').onclick = () => {
      window.location.hash = `#/${this.previousRoute === 'home' ? '' : this.previousRoute}`;
    };
  },

  // --------------------------------------------------------------------------
  // 12. Professional Video Player (#/watch/:id)
  // --------------------------------------------------------------------------
  setupPlayer() {
    const video = document.getElementById('main-video-player');
    const playToggleBtn = document.getElementById('btn-player-toggle');
    const iconPlay = document.getElementById('icon-player-play');
    const iconPause = document.getElementById('icon-player-pause');
    const seekSlider = document.getElementById('player-seek');
    const timelineFill = document.getElementById('player-timeline-fill');
    const curTime = document.getElementById('player-current-time');
    const durTime = document.getElementById('player-duration-time');
    const volBtn = document.getElementById('btn-player-volume');
    const volSlider = document.getElementById('player-volume-slider');
    const iconVolHigh = document.getElementById('icon-vol-high');
    const iconVolMute = document.getElementById('icon-vol-mute');
    const fsBtn = document.getElementById('btn-player-fullscreen');
    const speedMenu = document.getElementById('player-settings-menu');
    const exitBtn = document.getElementById('player-exit-btn');
    const completedOverlay = document.getElementById('player-completed-state');

    // Play/Pause Toggle
    const togglePlay = () => {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    };
    playToggleBtn.addEventListener('click', togglePlay);
    video.addEventListener('click', togglePlay);

    video.addEventListener('play', () => {
      iconPlay.style.display = 'none';
      iconPause.style.display = 'block';
      completedOverlay.style.display = 'none';
    });
    video.addEventListener('pause', () => {
      iconPlay.style.display = 'block';
      iconPause.style.display = 'none';
    });

    // Time update & timeline scrub
    video.addEventListener('timeupdate', () => {
      if (video.duration) {
        const percent = (video.currentTime / video.duration) * 100;
        seekSlider.value = percent;
        timelineFill.style.width = `${percent}%`;
        curTime.textContent = formatDuration(video.currentTime);
        durTime.textContent = formatDuration(video.duration);
      }
    });

    seekSlider.addEventListener('input', (e) => {
      if (video.duration) {
        video.currentTime = (e.target.value / 100) * video.duration;
      }
    });

    // 10s Rewind / Forward
    document.getElementById('btn-player-rewind').onclick = () => {
      video.currentTime = Math.max(0, video.currentTime - 10);
    };
    document.getElementById('btn-player-forward').onclick = () => {
      if (video.duration) video.currentTime = Math.min(video.duration, video.currentTime + 10);
    };

    // Volume Slider & Mute Toggle
    volSlider.addEventListener('input', (e) => {
      video.volume = e.target.value;
      video.muted = (video.volume === 0);
      iconVolHigh.style.display = video.muted ? 'none' : 'block';
      iconVolMute.style.display = video.muted ? 'block' : 'none';
    });
    volBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      iconVolHigh.style.display = video.muted ? 'none' : 'block';
      iconVolMute.style.display = video.muted ? 'block' : 'none';
    });

    // Fullscreen Toggle
    fsBtn.addEventListener('click', () => {
      const container = document.getElementById('view-player');
      if (!document.fullscreenElement) {
        container.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Playback Speed Flyout
    document.getElementById('btn-player-settings').addEventListener('click', (e) => {
      e.stopPropagation();
      speedMenu.style.display = speedMenu.style.display === 'none' ? 'block' : 'none';
    });
    document.querySelectorAll('.speed-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.speed-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        video.playbackRate = parseFloat(btn.getAttribute('data-speed'));
        speedMenu.style.display = 'none';
      });
    });

    // Subtitles toggle
    document.getElementById('btn-player-cc').addEventListener('click', () => {
      this.showToast('Subtitles: English (Original Audio) active');
    });

    // End of stream completion state
    video.addEventListener('ended', () => {
      if (this.activeVideoId) {
        playbackService.markCompleted(this.activeVideoId);
      }
      completedOverlay.style.display = 'flex';
      document.getElementById('player-completed-title').textContent = `Completed "${document.getElementById('player-stream-title').textContent}"`;
      
      const currentTitle = MORROW_CATALOGUE.find(t => t.id === this.activeVideoId);
      const nextEpBtn = document.getElementById('btn-player-next-ep-complete');
      if (currentTitle && currentTitle.contentType === 'series') {
        nextEpBtn.style.display = 'inline-block';
        nextEpBtn.onclick = () => {
          this.playNextEpisode(currentTitle);
        };
      } else {
        nextEpBtn.style.display = 'none';
      }
    });

    document.getElementById('btn-player-replay').onclick = () => {
      completedOverlay.style.display = 'none';
      video.currentTime = 0;
      video.play().catch(() => {});
    };

    document.getElementById('btn-player-finish-back').onclick = () => {
      this.stopPlayer();
      window.location.hash = `#/title/${this.activeVideoId || 'VID001'}`;
    };

    // Exit Player
    exitBtn.addEventListener('click', () => {
      this.stopPlayer();
      window.location.hash = `#/title/${this.activeVideoId || 'VID001'}`;
    });
    document.getElementById('btn-player-return').onclick = () => {
      this.stopPlayer();
      window.location.hash = '#/';
    };
    document.getElementById('btn-player-retry').onclick = () => {
      if (this.activeVideoId) this.startPlayer(this.activeVideoId);
    };

    // Auto-hide controls after idle period
    const playerView = document.getElementById('view-player');
    const showControls = () => {
      document.getElementById('player-top-overlay').style.opacity = '1';
      document.getElementById('player-bottom-overlay').style.opacity = '1';
      clearTimeout(this.playerControlsTimeout);
      this.playerControlsTimeout = setTimeout(() => {
        if (!video.paused && completedOverlay.style.display === 'none') {
          document.getElementById('player-top-overlay').style.opacity = '0';
          document.getElementById('player-bottom-overlay').style.opacity = '0';
          speedMenu.style.display = 'none';
        }
      }, 3500);
    };
    playerView.addEventListener('mousemove', showControls);
    playerView.addEventListener('touchstart', showControls);
  },

  async startPlayer(id, episodeId = null) {
    const video = document.getElementById('main-video-player');
    const title = await catalogueService.getById(id);
    if (!title) {
      window.location.hash = '#/404';
      return;
    }

    this.activeVideoId = id;
    this.activeEpisodeId = episodeId;

    document.getElementById('player-error-state').style.display = 'none';
    document.getElementById('player-completed-state').style.display = 'none';

    let streamVideoKey = title.videoKey || title.objectKey;
    let streamTitle = title.title;
    let streamSubtitle = `${title.quality || '4K UHD'} • ${title.audio || 'Dolby Atmos'}`;

    if (title.contentType === 'series' && title.episodes && title.episodes.length > 0) {
      const ep = episodeId ? title.episodes.find(e => e.id === episodeId) : title.episodes[0];
      if (ep) {
        if (!ep.isPlayable || ep.availabilityStatus !== 'available') {
          document.getElementById('player-stream-title').textContent = `${title.title} — ${ep.title}`;
          document.getElementById('player-stream-sub').textContent = 'Episode Not Available';
          document.getElementById('player-error-state').style.display = 'flex';
          document.getElementById('player-error-text').textContent = `Episode "${ep.title}" is not yet available for streaming.`;
          video.removeAttribute('src');
          video.load();
          return;
        }
        streamVideoKey = ep.videoKey || streamVideoKey;
        streamTitle = `${title.title} — Ep ${ep.episodeNum}: ${ep.title}`;
        streamSubtitle = `Season 1 • HD 1080p • Dolby Audio`;
      }
    } else if (!title.isPlayable || title.availabilityStatus !== 'available') {
      document.getElementById('player-stream-title').textContent = title.title;
      document.getElementById('player-stream-sub').textContent = title.availabilityStatus === 'coming_soon' ? 'Coming Soon' : 'Catalogue Metadata Only';
      document.getElementById('player-error-state').style.display = 'flex';
      document.getElementById('player-error-text').textContent = title.availabilityStatus === 'coming_soon'
        ? `"${title.title}" is coming soon to Morrow and has not been released yet.`
        : `"${title.title}" metadata is catalogued, but video media has not yet been ingested to the cloud store.`;
      video.removeAttribute('src');
      video.load();
      return;
    }

    document.getElementById('player-stream-title').textContent = streamTitle;
    document.getElementById('player-stream-sub').textContent = streamSubtitle;
    document.getElementById('player-return-label').textContent = 'Back to Details';

    const videoUrl = mediaService.resolveUrl(streamVideoKey);
    video.src = videoUrl;
    video.load();

    // Check for saved resume progress
    const progress = playbackService.getProgress(id);
    if (progress && progress.currentTime > 2 && !progress.completed) {
      video.currentTime = progress.currentTime;
      this.showToast(`Resumed from ${formatDuration(progress.currentTime)}`);
    }

    video.onerror = () => {
      document.getElementById('player-error-state').style.display = 'flex';
      document.getElementById('player-error-text').textContent = `Media stream ${videoUrl} could not be resolved from cloud origin.`;
    };

    video.play().catch(() => {
      console.log('Autoplay deferred pending viewer interaction.');
    });

    // Start auto-saving watch progress every 3s
    clearInterval(this.playerSaveInterval);
    this.playerSaveInterval = setInterval(() => {
      if (!video.paused && video.duration) {
        playbackService.saveProgress(id, video.currentTime, video.duration);
      }
    }, 3000);
  },

  playNextEpisode(series) {
    if (!series.episodes || series.episodes.length === 0) return;
    const firstEp = series.episodes[0];
    this.startPlayer(series.id, firstEp.id);
  },

  stopPlayer() {
    const video = document.getElementById('main-video-player');
    if (this.activeVideoId && video.duration) {
      playbackService.saveProgress(this.activeVideoId, video.currentTime, video.duration);
    }
    clearInterval(this.playerSaveInterval);
    video.pause();
    video.removeAttribute('src');
    video.load();
    this.activeVideoId = null;
    this.activeEpisodeId = null;
  },

  // --------------------------------------------------------------------------
  // 13. My Morrow Library (#/my-list)
  // --------------------------------------------------------------------------
  setupLibraryTabs() {
    document.querySelectorAll('.lib-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        this.activateLibraryTab(target);
      });
    });

    document.getElementById('btn-lib-clear-history').addEventListener('click', () => {
      this.showConfirmDialog('Clear Viewing History', 'Are you sure you want to remove all saved watch history?', () => {
        playbackService.clearAll();
        this.renderLibraryPage('history');
        this.showToast('Viewing history cleared.');
      });
    });
  },

  activateLibraryTab(targetTab) {
    document.querySelectorAll('.lib-tab').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-tab') === targetTab);
    });

    document.getElementById('lib-tab-content-watchlist').style.display = targetTab === 'watchlist' ? 'block' : 'none';
    document.getElementById('lib-tab-content-continue').style.display = targetTab === 'continue' ? 'block' : 'none';
    document.getElementById('lib-tab-content-history').style.display = targetTab === 'history' ? 'block' : 'none';
    document.getElementById('lib-tab-content-completed').style.display = targetTab === 'completed' ? 'block' : 'none';
  },

  async renderLibraryPage(activeTab = 'watchlist') {
    this.activateLibraryTab(activeTab);

    // Tab 1: Watchlist
    const savedIds = watchlistService.getList();
    const watchlistGrid = document.getElementById('grid-library-watchlist');
    const watchlistEmpty = document.getElementById('watchlist-empty');
    document.getElementById('lib-count-watchlist').textContent = savedIds.length;
    watchlistGrid.innerHTML = '';

    if (savedIds.length === 0) {
      watchlistGrid.style.display = 'none';
      watchlistEmpty.style.display = 'flex';
    } else {
      watchlistGrid.style.display = 'grid';
      watchlistEmpty.style.display = 'none';
      for (const id of savedIds) {
        const item = await catalogueService.getById(id);
        if (item) watchlistGrid.appendChild(this.createCard(item));
      }
    }

    // Tab 2: Continue Watching
    const continueItems = playbackService.getContinueWatching();
    const continueGrid = document.getElementById('grid-library-continue');
    const continueEmpty = document.getElementById('continue-empty');
    document.getElementById('lib-count-continue').textContent = continueItems.length;
    continueGrid.innerHTML = '';

    if (continueItems.length === 0) {
      continueGrid.style.display = 'none';
      continueEmpty.style.display = 'flex';
    } else {
      continueGrid.style.display = 'grid';
      continueEmpty.style.display = 'none';
      continueItems.forEach(item => {
        continueGrid.appendChild(this.createCard(item.titleRecord, { progress: item.percent }));
      });
    }

    // Tab 3: History
    const historyItems = playbackService.getRecentlyWatched();
    const historyGrid = document.getElementById('grid-library-history');
    const historyEmpty = document.getElementById('history-empty');
    document.getElementById('lib-count-history').textContent = historyItems.length;
    historyGrid.innerHTML = '';

    if (historyItems.length === 0) {
      historyGrid.style.display = 'none';
      historyEmpty.style.display = 'flex';
    } else {
      historyGrid.style.display = 'grid';
      historyEmpty.style.display = 'none';
      historyItems.forEach(item => {
        historyGrid.appendChild(this.createCard(item.titleRecord));
      });
    }

    // Tab 4: Completed
    const completedItems = playbackService.getCompleted();
    const completedGrid = document.getElementById('grid-library-completed');
    const completedEmpty = document.getElementById('completed-empty');
    document.getElementById('lib-count-completed').textContent = completedItems.length;
    completedGrid.innerHTML = '';

    if (completedItems.length === 0) {
      completedGrid.style.display = 'none';
      completedEmpty.style.display = 'flex';
    } else {
      completedGrid.style.display = 'grid';
      completedEmpty.style.display = 'none';
      completedItems.forEach(item => {
        completedGrid.appendChild(this.createCard(item.titleRecord));
      });
    }
  },

  toggleWatchlist(id) {
    if (watchlistService.isInList(id)) {
      watchlistService.remove(id);
      this.lastRemovedId = id;
      this.showToast('Removed from My List', () => {
        watchlistService.add(this.lastRemovedId);
        this.updateWatchlistBadges();
        if (this.currentRoute === 'my-list') this.renderLibraryPage('watchlist');
      });
    } else {
      watchlistService.add(id);
      this.showToast('Saved to My List');
    }
    this.updateWatchlistBadges();
    if (this.currentRoute === 'my-list') this.renderLibraryPage('watchlist');
  },

  // --------------------------------------------------------------------------
  // 14. Settings & Preferences Page (#/settings)
  // --------------------------------------------------------------------------
  setupSettings() {
    const prefs = profileService.getPreferences();
    const autoplayNext = document.getElementById('setting-autoplay-next');
    const autoplayPreviews = document.getElementById('setting-autoplay-previews');
    const qualitySelect = document.getElementById('setting-quality');
    const subtitleLang = document.getElementById('setting-subtitle-lang');
    const speedSelect = document.getElementById('setting-playback-speed');
    const motionCheck = document.getElementById('setting-reduce-motion');

    if (autoplayNext) autoplayNext.checked = prefs.autoplayNext;
    if (autoplayPreviews) autoplayPreviews.checked = prefs.autoplayPreviews || false;
    if (qualitySelect) qualitySelect.value = prefs.quality || 'auto';
    if (subtitleLang) subtitleLang.value = prefs.subtitleLang || 'en';
    if (speedSelect) speedSelect.value = prefs.playbackSpeed || '1.0';
    if (motionCheck) motionCheck.checked = prefs.reduceMotion || false;

    const save = () => {
      const updatedPrefs = {
        autoplayNext: autoplayNext ? autoplayNext.checked : true,
        autoplayPreviews: autoplayPreviews ? autoplayPreviews.checked : false,
        quality: qualitySelect ? qualitySelect.value : 'auto',
        subtitleLang: subtitleLang ? subtitleLang.value : 'en',
        playbackSpeed: speedSelect ? speedSelect.value : '1.0',
        reduceMotion: motionCheck ? motionCheck.checked : false
      };
      profileService.savePreferences(updatedPrefs);
      if (updatedPrefs.reduceMotion) {
        document.body.classList.add('reduced-motion');
      } else {
        document.body.classList.remove('reduced-motion');
      }
      this.showToast('Preferences updated');
    };

    if (autoplayNext) autoplayNext.onchange = save;
    if (autoplayPreviews) autoplayPreviews.onchange = save;
    if (qualitySelect) qualitySelect.onchange = save;
    if (subtitleLang) subtitleLang.onchange = save;
    if (speedSelect) speedSelect.onchange = save;
    if (motionCheck) motionCheck.onchange = save;

    // Clear Search History
    document.getElementById('btn-clear-search-history').onclick = () => {
      this.showConfirmDialog('Clear Search History', 'Are you sure you want to delete all saved search terms?', () => {
        profileService.clearRecentSearches();
        this.showToast('Search history cleared.');
      });
    };

    // Clear Watch Progress
    document.getElementById('btn-clear-watch-progress').onclick = () => {
      this.showConfirmDialog('Clear Watch Progress', 'This will remove all resume timestamps and in-progress streams.', () => {
        playbackService.clearAll();
        this.showToast('Watch progress cleared.');
      });
    };

    // Clear Watchlist
    document.getElementById('btn-clear-watchlist').onclick = () => {
      this.showConfirmDialog('Clear My List', 'Are you sure you want to remove all titles saved in My List?', () => {
        watchlistService.clear();
        this.updateWatchlistBadges();
        this.showToast('My List cleared.');
      });
    };

    // Clear All Local Data
    document.getElementById('btn-clear-all-data').onclick = () => {
      this.showConfirmDialog('Reset All Library Data', 'This will erase your watchlist, watch history, and search terms.', () => {
        watchlistService.clear();
        playbackService.clearAll();
        profileService.clearRecentSearches();
        this.updateWatchlistBadges();
        this.showToast('All local library data reset.');
      });
    };

    // Quick clear history in profile menu
    document.getElementById('btn-quick-clear-history').onclick = () => {
      playbackService.clearAll();
      this.showToast('Viewing history cleared.');
      document.getElementById('profile-menu').style.display = 'none';
    };
  },

  renderSettingsPage() {
    // Settings view ready
  },

  // --------------------------------------------------------------------------
  // 15. Global Navigation & Dropdowns
  // --------------------------------------------------------------------------
  setupNavigation() {
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');

    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.style.display = profileMenu.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', () => {
      profileMenu.style.display = 'none';
    });
  },

  // --------------------------------------------------------------------------
  // 16. Keyboard Accessibility & Global Player Shortcuts
  // --------------------------------------------------------------------------
  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Do not trigger shortcuts if user is typing into an input field or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        return;
      }

      // If in video player mode
      if (this.currentRoute === 'watch') {
        const video = document.getElementById('main-video-player');
        if (e.code === 'Space') {
          e.preventDefault();
          if (video.paused) video.play().catch(() => {});
          else video.pause();
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          if (video.duration) video.currentTime = Math.min(video.duration, video.currentTime + 10);
        } else if (e.code === 'ArrowUp') {
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          document.getElementById('player-volume-slider').value = video.volume;
        } else if (e.code === 'ArrowDown') {
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
          document.getElementById('player-volume-slider').value = video.volume;
        } else if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          video.muted = !video.muted;
          document.getElementById('icon-vol-high').style.display = video.muted ? 'none' : 'block';
          document.getElementById('icon-vol-mute').style.display = video.muted ? 'block' : 'none';
        } else if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          const playerView = document.getElementById('view-player');
          if (!document.fullscreenElement) playerView.requestFullscreen().catch(() => {});
          else document.exitFullscreen().catch(() => {});
        } else if (e.key === 'Escape') {
          if (!document.fullscreenElement) {
            this.stopPlayer();
            window.location.hash = `#/title/${this.activeVideoId || 'VID001'}`;
          }
        }
      }
    });
  },

  // --------------------------------------------------------------------------
  // 17. Toast Notifications & Confirmation Dialog
  // --------------------------------------------------------------------------
  setupToastsAndDialogs() {
    document.getElementById('dialog-cancel-btn').onclick = () => {
      document.getElementById('confirm-dialog').style.display = 'none';
    };
  },

  showToast(message, undoCallback = null) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';

    let undoHtml = '';
    if (undoCallback) {
      undoHtml = `<span class="toast-undo">Undo</span>`;
    }

    toast.innerHTML = `<span>${message}</span>${undoHtml}`;

    if (undoCallback) {
      toast.querySelector('.toast-undo').onclick = () => {
        undoCallback();
        toast.remove();
      };
    }

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  },

  showConfirmDialog(title, message, onConfirm) {
    const dialog = document.getElementById('confirm-dialog');
    document.getElementById('dialog-title').textContent = title;
    document.getElementById('dialog-msg').textContent = message;
    dialog.style.display = 'flex';

    document.getElementById('dialog-confirm-btn').onclick = () => {
      dialog.style.display = 'none';
      onConfirm();
    };
  }
};

// ============================================================================
// 18. Utility Functions
// ============================================================================
function formatDuration(totalSeconds) {
  if (!totalSeconds || isNaN(totalSeconds)) return '0:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Bootstrap Application
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
