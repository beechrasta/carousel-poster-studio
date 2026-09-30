import { renderSlideServer } from './lib/serverRenderer.js';

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
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed. Use POST with JSON payload.' }));
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

    if (!slides.length) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'No slides provided in request body' }));
      return;
    }

    const totalSlides = slides.length;
    const renderedSlides = [];

    for (let i = 0; i < totalSlides; i++) {
      const slide = slides[i];
      const canvas = await renderSlideServer(slide, i, globalSettings, totalSlides);
      const pngBuffer = canvas.toBuffer('image/png');
      const base64Png = `data:image/png;base64,${pngBuffer.toString('base64')}`;

      renderedSlides.push({
        index: i + 1,
        headline: slide.headline,
        subtext: slide.subtext,
        theme: slide.theme || globalSettings.globalThemeId || 'dark_lime',
        template: slide.template || globalSettings.globalTemplateId || 'classic_studio',
        image: base64Png,
        sizeBytes: pngBuffer.length
      });
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      count: renderedSlides.length,
      dimensions: { width: 1080, height: 1080 },
      slides: renderedSlides
    }));
  } catch (error) {
    console.error('Error in render-deck API:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error.message || 'Failed to render deck'
    }));
  }
}
