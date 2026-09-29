/**
 * API Services for Carousel Poster Studio
 * Supports Opencode CLI integration, Direct OpenAI-compatible API, and Local Ollama.
 */

export const SYSTEM_PROMPT = `You write carousel-poster copy about AI and tech news. For EACH story produce exactly:
HEADLINE: under 10 words, bold, funny, attention-grabbing. No em dashes, no corporate speak.
SUBTEXT: 2-4 short lines that summarize the story with a joke, roast, or witty twist.
Tone: blunt, witty, internet-native, like a smart friend roasting tech news. Punchy over polished.
Output format per story:
HEADLINE: <text>
SUBTEXT: <text>`;

export const SAMPLE_STORIES = [
  {
    headline: "OpenAI just killed its own model before launch",
    subtext: "GPT-6.1 'Astra' got scrapped for being too deceptive in testing. The AI was literally too shady to ship, a day before DevDay. We are so back (to the safety meetings)."
  },
  {
    headline: "Nvidia wants to be the seatbelt of the AI world",
    subtext: "New Open Agent Safety Platform, 100+ companies signed on, claims it would've stopped the Hugging Face breach. Plus a casual $150B buyback. Jensen stays winning."
  },
  {
    headline: "Congress finally discovered AI exists",
    subtext: "Florida wants OpenAI in court, Sanders and AOC want to ban superintelligence, and Trump wants an 'AI Force' branch. Everyone has a plan. None of them agree."
  }
];

export const DEFAULT_SETTINGS = {
  provider: 'opencode', // 'opencode' | 'openai' | 'ollama'
  opencodeModel: '', // optional model for opencode
  endpoint: 'http://localhost:11434',
  openaiEndpoint: 'https://api.openai.com/v1',
  openaiModel: 'gpt-4o-mini',
  apiKey: '',
  ollamaModel: 'llama3.2',
};

/**
 * Cleans messy news dumps (e.g. meta tracking links, section headers)
 * and extracts individual story objects with headline, subtext, and source.
 */
export function sanitizeNewsText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    // Replace meta redirect / long tracking links: [Reuters](https://l.meta.ai/?u=...) -> [Source: Reuters]
    .replace(/\[([^\]]+)\]\(https?:\/\/[^\s\)]+\)/g, '($1)')
    .replace(/https?:\/\/[^\s\)]+/g, '') // remove remaining raw URLs
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Robust heuristic parser that extracts individual story cards from multi-section news text
 * without needing an LLM, splitting by section headers, dashes, bullets, and newlines.
 */
export function extractStoriesHeuristic(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const stories = [];
  let currentSection = '';

  for (const line of lines) {
    // Check if line is a short section header (e.g. "World", "US domestic", "India", "Tech News")
    if (line.length < 35 && !line.includes('—') && !line.includes(' - ') && !line.includes('. ') && !line.startsWith('http')) {
      currentSection = line.replace(/[:#]/g, '').trim();
      continue;
    }

    // Split on em-dash —, en-dash –, standard dash -, or colon
    let headline = '';
    let subtext = '';
    let credit = '';

    // Extract source credit e.g. [Reuters], (Economic Times)
    const sourceMatch = line.match(/(?:\[|\()([A-Za-z0-9\s&]+?)(?:\]|\))\s*$/);
    if (sourceMatch) {
      credit = sourceMatch[1].trim();
    }

    // Cleaned line without link URLs
    const cleanedLine = line
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '($1)')
      .replace(/https?:\/\/[^\s\)]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanedLine.includes(' — ') || cleanedLine.includes('—')) {
      const parts = cleanedLine.split(/\s*—\s*/);
      headline = parts[0].replace(/^[\*\-•\d\.\s]+/, '').trim();
      subtext = parts.slice(1).join(' — ').trim();
    } else if (cleanedLine.includes(' - ')) {
      const parts = cleanedLine.split(/\s+-\s+/);
      headline = parts[0].replace(/^[\*\-•\d\.\s]+/, '').trim();
      subtext = parts.slice(1).join(' - ').trim();
    } else if (cleanedLine.includes(': ') && cleanedLine.indexOf(': ') < 60) {
      const parts = cleanedLine.split(/:\s+/);
      headline = parts[0].replace(/^[\*\-•\d\.\s]+/, '').trim();
      subtext = parts.slice(1).join(': ').trim();
    } else {
      // Split on first period or sentence
      const firstDot = cleanedLine.indexOf('. ');
      if (firstDot > 10 && firstDot < 80) {
        headline = cleanedLine.slice(0, firstDot).replace(/^[\*\-•\d\.\s]+/, '').trim();
        subtext = cleanedLine.slice(firstDot + 2).trim();
      } else {
        headline = cleanedLine.replace(/^[\*\-•\d\.\s]+/, '').trim();
        subtext = currentSection ? `Latest updates in ${currentSection}.` : '';
      }
    }

    if (headline) {
      stories.push({
        headline: headline.replace(/^["'`]|["'`]$/g, ''),
        subtext: subtext.replace(/^["'`]|["'`]$/g, ''),
        credit: credit || (currentSection ? currentSection : '')
      });
    }
  }

  return stories;
}

/**
 * Parses raw text from LLM response into an array of { headline, subtext } objects.
 */
export function parseStoriesFromResponse(text) {
  const results = [];
  if (!text || typeof text !== 'string') return results;

  // Primary regex matching exact spec format
  const regex = /HEADLINE:\s*(.+?)\s*SUBTEXT:\s*([\s\S]+?)(?=(?:HEADLINE:|$))/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const headline = match[1].trim().replace(/^["'`]|["'`]$/g, '').replace(/[\r\n]+/g, ' ');
    const subtext = match[2].trim().replace(/^["'`]|["'`]$/g, '');
    if (headline) {
      results.push({
        headline,
        subtext: subtext || ''
      });
    }
  }

  // Fallback parser if LLM deviated slightly in formatting
  if (results.length === 0) {
    const sections = text.split(/\n\s*\n|---+/);
    for (const section of sections) {
      const lines = section.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length >= 2) {
        const headCandidate = lines[0].replace(/^(?:Headline|Title|\d+[\.\)]|\*+|-+)\s*:?\s*/i, '').replace(/\*+/g, '').trim();
        const subCandidate = lines.slice(1).join('\n').replace(/^(?:Subtext|Summary|Description)\s*:?\s*/i, '').trim();
        if (headCandidate.length > 3 && headCandidate.split(' ').length <= 25) {
          results.push({
            headline: headCandidate,
            subtext: subCandidate
          });
        }
      }
    }
  }

  // Final fallback: use heuristic story extractor
  if (results.length === 0) {
    return extractStoriesHeuristic(text);
  }

  return results;
}

/**
 * Calls the configured AI backend to generate carousel slide copy from news text.
 */
export async function generateCopyFromNews(newsText, settings) {
  if (!newsText || !newsText.trim()) {
    throw new Error('Please provide news story text to process.');
  }

  const provider = settings.provider || 'opencode';

  if (provider === 'opencode') {
    // 1. Opencode CLI via local backend bridge
    const promptPayload = `${SYSTEM_PROMPT}\n\nHere are the news stories to turn into carousel poster slides:\n\n${newsText}`;
    
    const res = await fetch('/api/opencode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: promptPayload,
        model: settings.opencodeModel || undefined,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.stderr || `Opencode CLI failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.output || '';
  }

  if (provider === 'openai') {
    // 2. Direct OpenAI-compatible API
    const baseEndpoint = (settings.openaiEndpoint || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const url = `${baseEndpoint}/chat/completions`;
    const apiKey = settings.apiKey || '';

    if (!apiKey && !baseEndpoint.includes('localhost') && !baseEndpoint.includes('127.0.0.1')) {
      throw new Error('API Key is required for OpenAI-compatible endpoint.');
    }

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: settings.openaiModel || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: newsText }
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      let errorMsg = `API request failed (HTTP ${res.status})`;
      try {
        const parsed = JSON.parse(errBody);
        errorMsg = parsed.error?.message || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    const json = await res.json();
    return json.choices?.[0]?.message?.content || '';
  }

  if (provider === 'ollama') {
    // 3. Local Ollama instance
    const baseEndpoint = (settings.endpoint || 'http://localhost:11434').replace(/\/+$/, '');
    const url = `${baseEndpoint}/api/generate`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: settings.ollamaModel || 'llama3.2',
        system: SYSTEM_PROMPT,
        prompt: newsText,
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama request failed (HTTP ${res.status}). Make sure 'ollama serve' is running.`);
    }

    const json = await res.json();
    return json.response || '';
  }

  throw new Error(`Unknown provider: ${provider}`);
}

/**
 * Checks connection / availability of Opencode CLI.
 */
export async function checkOpencodeStatus() {
  try {
    const res = await fetch('/api/check-opencode');
    if (!res.ok) return { available: false };
    const data = await res.json();
    return data;
  } catch (e) {
    return { available: false };
  }
}

/**
 * Dynamically fetches all models available via Opencode CLI.
 */
export async function fetchOpencodeModels() {
  try {
    const res = await fetch('/api/opencode-models');
    if (!res.ok) {
      throw new Error(`Failed to fetch Opencode models (HTTP ${res.status})`);
    }
    const data = await res.json();
    return data;
  } catch (e) {
    console.warn('Opencode models discovery failed:', e);
    return { models: [], providers: [], grouped: {}, count: 0, error: e.message };
  }
}

/**
 * Dynamically fetches active Opencode provider credentials.
 */
export async function fetchOpencodeProviders() {
  try {
    const res = await fetch('/api/opencode-providers');
    if (!res.ok) return { success: false, output: '' };
    return await res.json();
  } catch (e) {
    return { success: false, output: e.message };
  }
}

/**
 * Dynamically fetches locally installed models from Ollama.
 */
export async function fetchOllamaModels(endpoint = 'http://localhost:11434') {
  const ep = (endpoint || 'http://localhost:11434').replace(/\/+$/, '');
  const res = await fetch(`${ep}/api/tags`);
  if (!res.ok) {
    throw new Error(`Ollama connection error (HTTP ${res.status})`);
  }
  const data = await res.json();
  return (data.models || []).map(m => m.name || m.model);
}

/**
 * Dynamically fetches models from OpenAI-compatible API.
 */
export async function fetchOpenAICompatibleModels(endpoint = 'https://api.openai.com/v1', apiKey = '') {
  const ep = (endpoint || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const headers = {};
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  const res = await fetch(`${ep}/models`, { headers });
  if (!res.ok) {
    throw new Error(`API returned HTTP ${res.status}`);
  }
  const data = await res.json();
  return (data.data || []).map(m => m.id);
}
