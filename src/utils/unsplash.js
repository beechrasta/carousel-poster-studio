/**
 * Unsplash & Curated Image Search Utility
 * Supports Unsplash API (with client key) and smart curated photo feeds with
 * keyword-targeted images so users ALWAYS get relevant photos without needing an API key.
 */

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
 */
export function extractKeywordsFromSlide(slide) {
  const combined = `${slide?.headline || ''} ${slide?.subtext || ''}`;
  const stop = new Set([
    'the','a','an','is','are','was','were','be','been','being',
    'have','has','had','do','does','did','will','would','could',
    'should','may','might','shall','can','its','it','this','that',
    'these','those','and','or','but','in','on','at','to','for',
    'of','with','by','from','up','about','into','through','after',
    'just','also','than','then','so','as','not','no','if',
    'you','he','she','we','they','them','their','our','your',
    'who','what','which','when','where','how','all','get','got',
    'says','said','went','came','new','now','here','there','more','most'
  ]);

  const words = combined
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stop.has(w));

  const seen = new Set();
  const result = [];
  for (const w of words) {
    if (!seen.has(w)) {
      seen.add(w);
      result.push(w);
    }
    if (result.length >= 3) break;
  }
  return result.join(' ') || 'technology artificial intelligence';
}

/**
 * Curated Unsplash Direct Photo library for instant fallback
 */
const CURATED_TECH_PHOTOS = [
  { id: 'tech_1', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe', author: 'Milad Fakurian', topic: 'abstract 3d neon' },
  { id: 'tech_2', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475', author: 'Alexandre Debiève', topic: 'motherboard chip hardware' },
  { id: 'tech_3', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e', author: 'Alex Knight', topic: 'humanoid robot ai' },
  { id: 'tech_4', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5', author: 'Markus Spiske', topic: 'cybersecurity matrix code' },
  { id: 'tech_5', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b', author: 'Frederik Lipfert', topic: 'cyberpunk server neon' },
  { id: 'tech_6', url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12', author: 'UX Store', topic: 'wireframing design interface' },
  { id: 'tech_7', url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c', author: 'Marvin Meyer', topic: 'team meeting office tech' },
  { id: 'tech_8', url: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd', author: 'Danial Ricaros', topic: 'programming monitor code' },
  { id: 'tech_9', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa', author: 'NASA', topic: 'earth globe satellite cloud' },
  { id: 'tech_10', url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485', author: 'Cash Macanaya', topic: 'neural network brain' },
  { id: 'tech_11', url: 'https://images.unsplash.com/photo-1563770660941-20978e870e26', author: 'Steve Johnson', topic: 'gradient modern liquid' },
  { id: 'tech_12', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9', author: 'Hassan OUAJBIR', topic: 'smartphone mobile device' },
];

/**
 * Searches Unsplash for photos matching a query.
 */
export async function searchUnsplash(query, page = 1, perPage = 15) {
  const key = getUnsplashKey();

  if (key) {
    try {
      const url = `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=squarish`;
      const res = await fetch(url, {
        headers: { Authorization: `Client-ID ${key}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return data.results.map(photo => ({
            id: photo.id,
            url_thumb: photo.urls?.small,
            url_regular: photo.urls?.regular,
            url_full: photo.urls?.full,
            author: photo.user?.name || 'Unsplash',
            authorUrl: photo.user?.links?.html || 'https://unsplash.com',
            color: photo.color || '#1a1a1a',
            alt: photo.alt_description || photo.description || query,
          }));
        }
      }
    } catch (err) {
      console.warn('Unsplash API search failed, falling back to curated images:', err.message);
    }
  }

  // Dynamic query-targeted images from Pollinations AI and Curated Unsplash
  const cleanQuery = encodeURIComponent(query.trim() || 'technology news');
  const photos = [];

  // Generate 8 dynamic keyword-matching photos via AI image generator
  for (let i = 0; i < 8; i++) {
    const seed = (page - 1) * 8 + i + 10;
    const aiUrl = `https://image.pollinations.ai/prompt/${cleanQuery}%20modern%20editorial%20photo%20cinematic?width=800&height=800&nologo=true&seed=${seed}`;
    photos.push({
      id: `ai_${seed}`,
      url_thumb: aiUrl,
      url_regular: aiUrl,
      url_full: aiUrl,
      author: 'AI Editorial Generator',
      authorUrl: 'https://unsplash.com',
      color: '#0B0B0B',
      alt: `${query} (AI generated photo)`,
    });
  }

  // Add 8 curated high-resolution real Unsplash photos
  for (let i = 0; i < Math.min(perPage - 8, CURATED_TECH_PHOTOS.length); i++) {
    const item = CURATED_TECH_PHOTOS[(i + (page - 1) * 4) % CURATED_TECH_PHOTOS.length];
    photos.push({
      id: `${item.id}_${page}`,
      url_thumb: `${item.url}?auto=format&fit=crop&w=400&h=400&q=80`,
      url_regular: `${item.url}?auto=format&fit=crop&w=1080&h=1080&q=85`,
      url_full: `${item.url}?auto=format&fit=crop&w=1920&q=90`,
      author: item.author,
      authorUrl: 'https://unsplash.com',
      color: '#1a1a1a',
      alt: `${item.topic} photo`,
    });
  }

  return photos;
}
