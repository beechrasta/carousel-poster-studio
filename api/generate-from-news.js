import { renderSlideServer } from './lib/serverRenderer.js';

const SYSTEM_PROMPT = `You write carousel-poster copy about AI and tech news. For EACH story produce exactly:
HEADLINE: under 10 words, bold, funny, attention-grabbing. No em dashes, no corporate speak.
SUBTEXT: 2-4 short lines that summarize the story with a joke, roast, or witty twist.
Tone: blunt, witty, internet-native, like a smart friend roasting tech news. Punchy over polished.
Output format per story:
HEADLINE: <text>
SUBTEXT: <text>`;

function cleanCopyText(str) {
  if (!str) return '';
  let s = String(str)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^[\*\#\-\•\>\s]+/gm, '')
    .replace(/[\*\#\`]/g, '')
    .trim();
  s = s.replace(/^["'`“”\s]+|["'`“”\s]+$/g, '').trim();
  return s;
}

function parseAiOutput(text) {
  const stories = [];
  const blocks = text.split(/(?=HEADLINE:)/i).filter(b => b.trim());

  for (const block of blocks) {
    const headMatch = block.match(/HEADLINE:\s*(.+)/i);
    const subMatch = block.match(/SUBTEXT:\s*([\s\S]+?)(?=(?:HEADLINE:|$))/i);

    if (headMatch) {
      stories.push({
        headline: cleanCopyText(headMatch[1]),
        subtext: cleanCopyText(subMatch ? subMatch[1] : '')
      });
    }
  }
  return stories;
}

function parseHeuristic(rawText) {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const stories = [];

  for (const line of lines) {
    if (line.length < 15) continue;
    let headline = '';
    let subtext = '';
    let credit = '';

    const sourceMatch = line.match(/(?:\[|\()([A-Za-z0-9\s&]+?)(?:\]|\))\s*$/);
    if (sourceMatch) credit = sourceMatch[1].trim();

    const cleaned = line.replace(/\[([^\]]+)\]\([^\)]+\)/g, '($1)').replace(/https?:\/\/[^\s\)]+/g, '').trim();

    if (cleaned.includes(' — ') || cleaned.includes('—')) {
      const parts = cleaned.split(/\s*—\s*/);
      headline = parts[0].replace(/^[\*\-•\d\.\s]+/, '').trim();
      subtext = parts.slice(1).join(' — ').trim();
    } else if (cleaned.includes(' - ')) {
      const parts = cleaned.split(/\s+-\s+/);
      headline = parts[0].replace(/^[\*\-•\d\.\s]+/, '').trim();
      subtext = parts.slice(1).join(' - ').trim();
    } else if (cleaned.includes(': ') && cleaned.indexOf(': ') < 60) {
      const parts = cleaned.split(/:\s+/);
      headline = parts[0].replace(/^[\*\-•\d\.\s]+/, '').trim();
      subtext = parts.slice(1).join(': ').trim();
    } else {
      const words = cleaned.split(/\s+/);
      headline = words.slice(0, 8).join(' ');
      subtext = words.slice(8).join(' ') || cleaned;
    }

    if (headline) {
      stories.push({ headline, subtext, credit });
    }
  }
  return stories;
}

export default async function handler(req, res) {
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
    res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    body = body || {};

    const text = body.newsText || body.text || body.prompt || '';
    const images = Array.isArray(body.images) ? body.images : (body.image ? [body.image] : []);
    const theme = body.theme || 'dark_lime';
    const template = body.template || 'classic_studio';
    const apiKey = body.apiKey || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
    const isLocalOpenRouter = Boolean(process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY);
    const endpoint = body.endpoint || (
      process.env.OPENROUTER_API_KEY 
        ? 'https://openrouter.ai/api/v1' 
        : (process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1')
    );
    const model = body.model || process.env.OPENROUTER_MODEL || (
      process.env.OPENROUTER_API_KEY
        ? (process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free')
        : (process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini')
    );

    if (!text.trim()) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing newsText / text in payload' }));
      return;
    }

    let parsedStories = [];

    if (apiKey) {
      try {
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        };
        if (endpoint.includes('openrouter.ai')) {
          headers['HTTP-Referer'] = 'https://carousel-poster-studio.vercel.app';
          headers['X-Title'] = 'Carousel Poster Studio';
        }

        const response = await fetch(`${endpoint}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: text },
            ],
            temperature: 0.8,
          })
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.choices?.[0]?.message?.content || '';
          parsedStories = parseAiOutput(reply);
        }
      } catch (err) {
        console.warn('LLM call fallback to heuristic:', err.message);
      }
    }

    if (!parsedStories.length) {
      parsedStories = parseHeuristic(text);
    }

    if (!parsedStories.length) {
      parsedStories = [{
        headline: text.slice(0, 50).toUpperCase(),
        subtext: text
      }];
    }

    // Auto pair images and render slides
    const renderedSlides = [];
    const totalSlides = parsedStories.length;

    for (let i = 0; i < totalSlides; i++) {
      const story = parsedStories[i];
      let slideImg = images[i] || (images.length === 1 ? images[0] : null);

      // If no image passed and autoImage is not disabled, generate relevant AI photo
      if (!slideImg && body.autoImage !== false) {
        const cleanKeywords = String(story.headline || 'artificial intelligence technology')
          .replace(/[\*\#\_\`\:\–\—]/g, '')
          .replace(/[^\w\s]/gi, '')
          .trim()
          .split(/\s+/)
          .slice(0, 6)
          .join(' ');
        const prompt = encodeURIComponent(`${cleanKeywords} modern tech editorial photograph cinematic lighting`);
        slideImg = `https://image.pollinations.ai/prompt/${prompt}?width=1200&height=675&nologo=true&seed=${i * 17 + 101}`;
      }

      const slide = {
        headline: cleanCopyText(story.headline),
        subtext: cleanCopyText(story.subtext),
        image: slideImg,
        credit: (story.credit && story.credit !== 'AI Generated') ? story.credit : '',
        frameLabel: `FRAME ${String(i + 1).padStart(2, '0')}`,
        theme,
        template
      };

      const canvas = await renderSlideServer(slide, i, null, totalSlides);
      const pngBuffer = canvas.toBuffer('image/png');
      const base64Png = `data:image/png;base64,${pngBuffer.toString('base64')}`;

      renderedSlides.push({
        index: i + 1,
        headline: slide.headline,
        subtext: slide.subtext,
        frameLabel: slide.frameLabel,
        image: base64Png,
        sizeBytes: pngBuffer.length
      });
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      count: renderedSlides.length,
      theme,
      template,
      slides: renderedSlides
    }));
  } catch (error) {
    console.error('Error in generate-from-news:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}
