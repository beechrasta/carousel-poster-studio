import { renderSlideServer } from './lib/serverRenderer.js';
import { resolveSlideImage } from './lib/serverImageHelper.js';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    const errJson = JSON.stringify({ error: 'Method not allowed. Use POST with JSON payload.' });
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', Buffer.byteLength(errJson));
    res.end(errJson);
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    body = body || {};

    const slides = Array.isArray(body.slides) ? body.slides : (body.slide ? [body.slide] : []);
    const globalSettings = body.globalSettings || {};
    const autoImage = body.autoImage !== false;

    if (!slides.length) {
      const errJson = JSON.stringify({ error: 'No slides provided in request body' });
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Length', Buffer.byteLength(errJson));
      res.end(errJson);
      return;
    }

    const totalSlides = slides.length;
    const renderedSlides = [];

    for (let i = 0; i < totalSlides; i++) {
      const slide = slides[i];

      // Auto-resolve image & attribution if no image provided on this slide
      const imgInfo = await resolveSlideImage(slide, i, autoImage);
      if (imgInfo.image) {
        slide.image = imgInfo.image;
        if (!slide.credit && imgInfo.credit) {
          slide.credit = imgInfo.credit;
        }
      }

      const canvas = await renderSlideServer(slide, i, globalSettings, totalSlides);
      const pngBuffer = canvas.toBuffer('image/png');
      const base64Png = `data:image/png;base64,${pngBuffer.toString('base64')}`;

      renderedSlides.push({
        index: i + 1,
        headline: slide.headline,
        subtext: slide.subtext,
        credit: slide.credit || '',
        theme: slide.theme || globalSettings.globalThemeId || 'dark_lime',
        template: slide.template || globalSettings.globalTemplateId || 'classic_studio',
        image: base64Png,
        sizeBytes: pngBuffer.length
      });
    }

    const resPayload = JSON.stringify({
      success: true,
      count: renderedSlides.length,
      dimensions: { width: 1080, height: 1080 },
      slides: renderedSlides
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', Buffer.byteLength(resPayload));
    res.end(resPayload);
  } catch (error) {
    console.error('Error in render-deck API:', error);
    const errPayload = JSON.stringify({
      success: false,
      error: error.message || 'Failed to render deck'
    });
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', Buffer.byteLength(errPayload));
    res.end(errPayload);
  }
}
