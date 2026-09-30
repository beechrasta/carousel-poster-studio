/**
 * Serverless Image Resolution Helper
 * Automatically pairs high-res Unsplash photos or AI-generated imagery
 * when no image is provided to API endpoints.
 */

const DEFAULT_UNSPLASH_KEY = 'q_3KHZSWrHh3eS8Rn5SVvmtK2PINDVB95qsWAKyZyjo';

export function extractSearchKeywords(slide) {
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
 * Resolves or auto-generates an image for a slide if not provided.
 */
export async function resolveSlideImage(slide, slideIndex = 0, autoImage = true) {
  // If image is already provided, keep it
  if (slide?.image && slide.image.trim()) {
    return {
      image: slide.image.trim(),
      credit: slide.credit || ''
    };
  }

  // If layout is explicitly text_only or autoImage is false, no image needed
  if (slide?.layout === 'text_only' || autoImage === false) {
    return {
      image: null,
      credit: slide?.credit || ''
    };
  }

  const keywords = extractSearchKeywords(slide);
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_KEY || DEFAULT_UNSPLASH_KEY;

  // 1. Try Unsplash Search API
  if (unsplashKey) {
    try {
      const uRes = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keywords)}&page=1&per_page=3&orientation=squarish`,
        {
          headers: {
            'Authorization': `Client-ID ${unsplashKey}`,
            'Accept-Version': 'v1'
          }
        }
      );

      if (uRes.ok) {
        const uData = await uRes.json();
        if (uData.results && uData.results.length > 0) {
          const photo = uData.results[slideIndex % uData.results.length];
          const imgUrl = photo.urls?.regular || photo.urls?.full || photo.urls?.small;
          const author = photo.user?.name || 'Unsplash';
          return {
            image: imgUrl,
            credit: slide?.credit || `${author} / Unsplash`
          };
        }
      }
    } catch (err) {
      console.warn('Unsplash server fetch fallback to AI generator:', err.message);
    }
  }

  // 2. Fallback to Pollinations AI image synthesis
  const cleanPrompt = encodeURIComponent(`${keywords} modern tech editorial photograph cinematic lighting`);
  const seed = (slideIndex * 17 + 101) % 9999;
  const aiUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1200&height=675&nologo=true&seed=${seed}`;

  return {
    image: aiUrl,
    credit: slide?.credit || 'Visual: AI Synthesis'
  };
}
