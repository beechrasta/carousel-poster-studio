/**
 * Unsplash Image Search Utility
 * Uses Unsplash Source (no key) for simple random images, and the
 * Unsplash API (demo key) for keyword search.
 *
 * Demo key: client_id is a public demo key that has 50 req/hr.
 * Users can override via settings (stored in localStorage).
 */

const DEMO_UNSPLASH_KEY = 'DEMO_KEY_REPLACE_ME'; // Users add their own in Settings
const STORAGE_KEY_UNSPLASH = 'cps-unsplash-key';
const UNSPLASH_API = 'https://api.unsplash.com';

export function getUnsplashKey() {
  try {
    return localStorage.getItem(STORAGE_KEY_UNSPLASH) || '';
  } catch {
    return '';
  }
}

export function setUnsplashKey(key) {
  try {
    localStorage.setItem(STORAGE_KEY_UNSPLASH, key);
  } catch {}
}

/**
 * Extracts 2-4 likely image keywords from headline + subtext.
 * Used to auto-populate the search bar when the picker opens.
 */
export function extractKeywordsFromSlide(slide) {
  const combined = `${slide?.headline || ''} ${slide?.subtext || ''}`;
  // Strip common filler words and extract nouns/topics
  const stop = new Set([
    'the','a','an','is','are','was','were','be','been','being',
    'have','has','had','do','does','did','will','would','could',
    'should','may','might','shall','can','its','it','this','that',
    'these','those','and','or','but','in','on','at','to','for',
    'of','with','by','from','up','about','into','through','after',
    'just','also','than','then','so','as','not','no','but','if',
    'you','he','she','we','they','them','their','our','your',
    'i','me','my','him','his','her','us','who','what','which',
    'when','where','how','all','get','got','want','wants','need',
    'say','says','said','want','go','goes','went','come','came',
    'new','now','here','there','before','after','more','most'
  ]);

  const words = combined
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stop.has(w));

  // Deduplicate and take top 3
  const seen = new Set();
  const result = [];
  for (const w of words) {
    if (!seen.has(w)) {
      seen.add(w);
      result.push(w);
    }
    if (result.length >= 3) break;
  }
  return result.join(' ') || 'news technology';
}

/**
 * Searches Unsplash for photos matching a query.
 * Returns array of photo objects: { id, url_thumb, url_full, url_regular, author, authorUrl }
 */
export async function searchUnsplash(query, page = 1, perPage = 15) {
  const key = getUnsplashKey();

  if (!key) {
    // No key: use Unsplash Source random photos as a fallback grid
    return generateFallbackPhotos(query, perPage);
  }

  const url = `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=squarish`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${key}` }
  });

  if (!res.ok) {
    if (res.status === 403) throw new Error('Unsplash API rate limit hit or invalid key.');
    throw new Error(`Unsplash API error: ${res.status}`);
  }

  const data = await res.json();
  return (data.results || []).map(photo => ({
    id: photo.id,
    url_thumb: photo.urls?.small,
    url_regular: photo.urls?.regular,
    url_full: photo.urls?.full,
    author: photo.user?.name || 'Unknown',
    authorUrl: photo.user?.links?.html || 'https://unsplash.com',
    color: photo.color || '#1a1a1a',
    alt: photo.alt_description || photo.description || query,
  }));
}

/**
 * Generates fake placeholder Unsplash Source URLs when no API key is present.
 * These are real random images from Unsplash, just not query-specific.
 */
function generateFallbackPhotos(query, count = 15) {
  const photos = [];
  const seeds = ['nature', 'city', 'technology', 'abstract', 'dark', 'minimal', 'light', 'design', 'space', 'news', 'office', 'crowd', 'data', 'globe', 'business'];
  for (let i = 0; i < count; i++) {
    const seed = seeds[i % seeds.length];
    const size = 400;
    const id = `fallback_${i}_${seed}`;
    photos.push({
      id,
      url_thumb: `https://source.unsplash.com/${size}x${size}/?${encodeURIComponent(query)},${seed}&sig=${i}`,
      url_regular: `https://source.unsplash.com/800x800/?${encodeURIComponent(query)},${seed}&sig=${i}`,
      url_full: `https://source.unsplash.com/1080x1080/?${encodeURIComponent(query)},${seed}&sig=${i}`,
      author: 'Unsplash',
      authorUrl: 'https://unsplash.com',
      color: '#1a1a1a',
      alt: `${query} photo`,
    });
  }
  return photos;
}
