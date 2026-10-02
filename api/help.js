export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const helpDoc = {
    name: "Carousel Poster Studio API",
    version: "1.0.0",
    description: "High-performance API for creating 1080x1080 px social media carousel posters (Instagram, Threads, LinkedIn, Twitter/X) with custom themes, layouts, typography, and AI copy generation.",
    canvasSpecs: {
      resolution: "1080x1080 px (Square)",
      outputMimeTypes: ["image/png", "application/json with Base64 data URL"],
      margins: "70px safe padding",
      headlineFonts: ["Anton", "Archivo Black", "Space Mono", "Inter"]
    },
    endpoints: {
      "POST /api/render-poster": {
        summary: "Render a single 1080x1080 px poster image",
        description: "Takes copy, theme, and optional photo URL to generate a single high-resolution poster.",
        bodyParams: {
          headline: { type: "string", required: true, description: "Main hook headline (under 10 words)" },
          subtext: { type: "string", required: false, description: "Punchy roast or summary (2-4 lines)" },
          image: { type: "string (URL or Base64)", required: false, description: "Image for the top photo panel" },
          credit: { type: "string", required: false, description: "Source credit shown in bottom left (e.g. 'TechCrunch')" },
          frameLabel: { type: "string", required: false, description: "Header badge text. Omit or pass an empty string to render no badge." },
          theme: { type: "string", required: false, default: "dark_lime", options: ["dark_lime", "clean_light", "neon_cyber", "midnight_slate", "sunset_blaze", "emerald_matrix", "mono_stark"] },
          template: { type: "string", required: false, default: "classic_studio", options: ["classic_studio", "headline_first", "hero_fullbleed", "editorial_split", "card_frame", "minimal_quote"] },
          layout: { type: "string", required: false, default: "top_image", options: ["top_image", "full_bleed", "split_image", "dual_image", "text_only", "collage_3"] },
          watermarkText: { type: "string", required: false, description: "Brand handle (e.g. '@techdigest')" },
          watermarkPosition: { type: "string", default: "bottom_right", options: ["bottom_right", "top_right", "top_left", "bottom_left", "under_header", "center_stamp"] }
        },
        exampleUrl: "/api/render-poster?headline=OPENAI+REVEALS+GPT-5&subtext=Still+cannot+count+strawberry&theme=dark_lime&format=png"
      },
      "POST /api/render-deck": {
        summary: "Render a complete multi-slide carousel deck",
        description: "Takes an array of slide objects and renders all 1080x1080 PNG posters in sequence.",
        bodyParams: {
          slides: { type: "array of slide objects", required: true },
          globalSettings: {
            globalThemeId: "dark_lime",
            globalTemplateId: "classic_studio",
            watermarkText: "@handle",
            watermarkEnabled: true
          }
        }
      },
      "POST /api/generate-from-news": {
        summary: "Autonomous AI copywriting + design + poster rendering",
        description: "Takes raw news text or bullet points, writes punchy headlines and roast copy using OpenRouter/OpenAI, and renders all posters.",
        bodyParams: {
          newsText: { type: "string", required: true, description: "Raw news article text or bullet points" },
          images: { type: "array of strings", required: false, description: "Image URLs to auto-pair with slides" },
          theme: { type: "string", default: "dark_lime" },
          template: { type: "string", default: "classic_studio" }
        }
      },
      "GET /api/openapi.json": {
        summary: "OpenAPI 3.1.0 specification for ChatGPT Custom GPT Actions and Swagger tooling"
      },
      "GET /privacy": {
        summary: "Privacy policy page for Custom GPT validation"
      },
      "GET /api/help": {
        summary: "This interactive API documentation"
      }
    },
    availableThemes: [
      { id: "dark_lime", name: "Dark Studio (Lime)", bg: "#0B0B0B", accent: "#CDFF3C" },
      { id: "clean_light", name: "Editorial Light", bg: "#F5F5F7", accent: "#0066FF" },
      { id: "neon_cyber", name: "Cyberpunk Neon", bg: "Gradient Purple/Black", accent: "#FF007A" },
      { id: "midnight_slate", name: "Midnight Obsidian", bg: "Gradient Slate", accent: "#00F0FF" },
      { id: "sunset_blaze", name: "Crimson Flame", bg: "Gradient Crimson", accent: "#FF6B00" },
      { id: "emerald_matrix", name: "Deep Emerald", bg: "Gradient Deep Green", accent: "#10B981" },
      { id: "mono_stark", name: "Monochrome Stark", bg: "#161616", accent: "#FFFFFF" }
    ],
    availableTemplates: [
      { id: "classic_studio", description: "Top 16:9 photo panel + bold bottom copy with accent bar" },
      { id: "headline_first", description: "Giant hook headline at the top, photo & subtext below" },
      { id: "hero_fullbleed", description: "Edge-to-edge photo with frosted glass lower card" },
      { id: "editorial_split", description: "Editorial magazine pull-quote styling with refined border" },
      { id: "card_frame", description: "Double-border inset canvas with floating photo" },
      { id: "minimal_quote", description: "Oversized quotation mark, dominant typography & split photo" }
    ]
  };

  const jsonStr = JSON.stringify(helpDoc, null, 2);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Length', Buffer.byteLength(jsonStr));
  res.end(jsonStr);
}
