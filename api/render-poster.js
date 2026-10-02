import { renderSlideServer } from './lib/serverRenderer.js';
import { resolveSlideImage } from './lib/serverImageHelper.js';
import { normalizeApiFrameLabel } from './lib/apiSlide.js';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    let slide = {};
    let globalSettings = {};
    let format = 'json';
    let autoImage = true;

    if (req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const q = Object.fromEntries(url.searchParams.entries());
      format = q.format || 'png';
      autoImage = q.autoImage !== 'false';
      slide = {
        headline: q.headline || 'NO HEADLINE PROVIDED',
        subtext: q.subtext || '',
        image: q.image || '',
        credit: q.credit || '',
        frameLabel: q.frameLabel ?? q.frame ?? '',
        theme: q.theme || 'dark_lime',
        template: q.template || 'classic_studio',
        layout: q.layout || 'top_image',
        fit: q.fit || 'cover',
      };
      if (q.watermark) {
        slide.watermarkText = q.watermark;
        slide.watermarkEnabled = true;
      }
    } else if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch {}
      }
      body = body || {};

      slide = body.slide || body;
      globalSettings = body.globalSettings || {};
      format = body.format || req.query?.format || 'json';
      autoImage = body.autoImage !== false;
    } else {
      const errJson = JSON.stringify({ error: 'Method not allowed. Use GET or POST.' });
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Length', Buffer.byteLength(errJson));
      res.end(errJson);
      return;
    }

    // Never invent a frame badge the caller didn't ask for (issue #1):
    // an omitted or blank frameLabel renders no badge.
    slide = normalizeApiFrameLabel(slide);

    // Auto-resolve image & attribution if no image provided
    const imgInfo = await resolveSlideImage(slide, 0, autoImage);
    if (imgInfo.image) {
      slide.image = imgInfo.image;
      if (!slide.credit && imgInfo.credit) {
        slide.credit = imgInfo.credit;
      }
    }

    const canvas = await renderSlideServer(slide, 0, globalSettings, 1);
    const pngBuffer = canvas.toBuffer('image/png');

    if (format === 'png' || req.headers.accept?.includes('image/png')) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', pngBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
      res.end(pngBuffer);
      return;
    }

    const base64Png = `data:image/png;base64,${pngBuffer.toString('base64')}`;
    const resPayload = JSON.stringify({
      success: true,
      dimensions: { width: 1080, height: 1080 },
      mimeType: 'image/png',
      sizeBytes: pngBuffer.length,
      image: base64Png,
      slide: {
        headline: slide.headline,
        subtext: slide.subtext,
        credit: slide.credit || '',
        theme: slide.theme || 'dark_lime',
        template: slide.template || 'classic_studio',
      }
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', Buffer.byteLength(resPayload));
    res.end(resPayload);
  } catch (error) {
    console.error('Error in render-poster API:', error);
    const errPayload = JSON.stringify({
      success: false,
      error: error.message || 'Failed to render poster'
    });
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', Buffer.byteLength(errPayload));
    res.end(errPayload);
  }
}
