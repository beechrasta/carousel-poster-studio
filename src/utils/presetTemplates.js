/**
 * Pre-designed Carousel Poster Templates for the Homepage Showcase
 * ---------------------------------------------------------------------------
 * Every template is a complete, ready to render deck recipe:
 *
 *   themeId      one of POSTER_THEMES         -> background / accent / type colours
 *   templateId   one of POSTER_LAYOUT_TEMPLATES -> the poster composition itself
 *   fontChoice   headline typeface
 *   deckSettings typography + framing defaults applied across the whole deck
 *   slides       sample copy, tuned so it renders overflow free as shipped
 *
 * The Home page renders `TemplateMiniPreview`, a scaled replica of the exact
 * 1080 x 1080 composition, so the card you click is the poster you get.
 */

let fallbackIdCounter = 0;

/** Standalone id for non-app callers (CLI scripts, tests). */
function fallbackId(prefix) {
  fallbackIdCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${fallbackIdCounter}`;
}

/**
 * Builds a fresh copy of a template's slides with collision free ids.
 * Templates are static module data, so every deck needs its own slide ids.
 *
 * `makeId` is injected by the caller (the app passes projectStore's uid) so
 * this module stays importable from plain Node without a bundler.
 */
export function buildTemplateSlides(tpl, makeId = fallbackId) {
  if (!tpl || !Array.isArray(tpl.slides)) return [];
  return tpl.slides.map((slide) => ({
    image: null,
    images: [],
    // 'full_bleed' is the neutral pass through: the poster composition keeps
    // full control of the image panel, which is what these templates want.
    layout: 'full_bleed',
    fit: 'cover',
    focal: 50,
    ...slide,
    id: makeId(`tpl_${tpl.id}`),
    themeId: slide.themeId || tpl.themeId,
    fontChoice: slide.fontChoice || tpl.fontChoice,
  }));
}

/**
 * Resolves the deck wide settings a template wants applied on load.
 * `defaults` is the project's DEFAULT_GLOBAL_SETTINGS object.
 */
export function buildTemplateDeckSettings(tpl, defaults = {}) {
  return {
    ...defaults,
    themeMode: 'uniform',
    globalThemeId: tpl.themeId || defaults.globalThemeId,
    globalTemplateId: tpl.templateId || defaults.globalTemplateId,
    globalFontChoice: tpl.fontChoice || defaults.globalFontChoice,
    ...(tpl.deckSettings || {}),
  };
}

/** Slide count for a template, derived so the card can never drift from the data. */
export function getTemplateSlideCount(tpl) {
  return tpl?.slides?.length || 0;
}

export const PRESET_TEMPLATES = [
  {
    id: 'tpl_ai_breaking',
    name: 'AI Breaking News',
    tagline: 'High impact tech headlines with emergency framing',
    category: 'NEWS',
    badge: 'DEFAULT',
    themeId: 'dark_lime',
    templateId: 'classic_studio',
    fontChoice: 'Anton',
    coverTitle: 'OpenAI killed its own model',
    highlights: ['400px top photo panel', 'Auto shrinking 148px headline', 'Lime frame tag + accent rule'],
    deckSettings: {
      globalHeadlineCase: 'uppercase',
      globalSubtextSize: 'normal',
      globalFrameFormat: 'frame',
      globalFramePrefix: 'FRAME',
      globalShowAccentRule: true,
    },
    slides: [
      {
        headline: "OpenAI killed its own model a day before launch",
        subtext: "GPT-6.1 'Astra' was pulled after safety testers logged it playing too human. Turns out the scariest thing a model can do is sound confident.",
        credit: 'OpenAI',
      },
      {
        headline: "Nvidia wants to be the seatbelt of AI",
        subtext: "The Open Agent Safety Platform already has 100+ companies signed up and claims it would have stopped the Hugging Face breach. Plus a casual $150B buyback.",
        credit: 'Nvidia',
      },
      {
        headline: "Congress finally discovered AI exists",
        subtext: "Florida wants OpenAI in court, Sanders and AOC want a superintelligence ban, and the White House wants an AI Force branch. Everyone has a plan. None of them match.",
        credit: 'Senate Hearings',
      },
    ],
  },

  {
    id: 'tpl_cyber_roast',
    name: 'Tech Roast Weekly',
    tagline: 'Cyberpunk neon palette with the hook stacked on top',
    category: 'COMEDY',
    badge: 'VIRAL',
    themeId: 'neon_cyber',
    templateId: 'headline_first',
    fontChoice: 'Anton',
    coverTitle: 'Your startup is an Excel sheet',
    highlights: ['Hook headline above the fold', 'Magenta on violet gradient', 'Handle pill watermark'],
    deckSettings: {
      globalHeadlineCase: 'normal',
      globalSubtextSize: 'normal',
      globalFrameFormat: 'news',
      globalShowAccentRule: true,
      watermarkEnabled: true,
      watermarkText: '@yourhandle',
      watermarkPosition: 'bottom_right',
      watermarkStyle: 'pill',
    },
    slides: [
      {
        headline: "Your startup is a 50 line Python wrapper",
        subtext: "Forty million at a quarter billion valuation to call somebody else's API with a nicer system prompt. The deck has more CSS than the product.",
        credit: '@techbro',
      },
      {
        headline: "Engineers lost 8 hours to 2 lines of CSS",
        subtext: "One missing bracket and a z-index set to 999999. The coffee machine died at 3 AM. Deploy was still booked for 4:45 PM on a Friday.",
        credit: 'r/ProgrammerHumor',
      },
      {
        headline: "AGI is now predicted for Tuesday at 3 PM",
        subtext: "Sam Altman posted a single letter with no context. Tech Twitter wrote forty thousand threads about the kerning. Markets did a small tired shrug.",
        credit: 'Tech Rumors',
      },
    ],
  },

  {
    id: 'tpl_midnight_radar',
    name: 'Obsidian Funding Radar',
    tagline: 'Inset slate frame for venture capital and money news',
    category: 'FINANCE',
    badge: 'CLEAN',
    themeId: 'midnight_slate',
    templateId: 'card_frame',
    fontChoice: 'Archivo Black',
    coverTitle: 'Agents bag $2B in Q3',
    highlights: ['Double inset border frame', 'Accent pill badge', 'Deep slate vertical gradient'],
    deckSettings: {
      globalHeadlineCase: 'normal',
      globalSubtextSize: 'normal',
      globalFrameFormat: 'prefix',
      globalFramePrefix: 'DROP',
      globalShowAccentRule: true,
    },
    slides: [
      {
        headline: "Agent startups took $2.4B in Q3",
        subtext: "Term sheets are landing on anything with the word agentic in the name.",
        credit: 'PitchBook Data',
      },
      {
        headline: "Open weights caught up to the frontier",
        subtext: "A 70B model shipped under Apache 2.0 and runs on a MacBook or a dual 4090 rig. Cloud inference margins are in shambles.",
        credit: 'Hugging Face Hub',
      },
      {
        headline: "Compute is the new oil",
        subtext: "Reactors are being restarted to feed datacentres in Pennsylvania. GPU clusters now qualify as sovereign debt collateral, which nobody predicted.",
        credit: 'Bloomberg Intelligence',
      },
    ],
  },

  {
    id: 'tpl_editorial_light',
    name: 'Editorial Intelligence',
    tagline: 'High contrast journal format for long form thinking',
    category: 'EDITORIAL',
    badge: 'EDITORIAL',
    themeId: 'clean_light',
    templateId: 'editorial_split',
    fontChoice: 'Anton',
    coverTitle: 'The new architecture is thinking',
    highlights: ['Tracked frame tag', 'Accent bar beside the subtext', 'Bright paper background'],
    deckSettings: {
      globalHeadlineCase: 'normal',
      globalSubtextSize: 'normal',
      globalFrameFormat: 'count',
      globalShowAccentRule: false,
      watermarkEnabled: true,
      watermarkText: '@yourhandle',
      watermarkPosition: 'bottom_left',
      watermarkStyle: 'plain',
    },
    slides: [
      {
        headline: "Reasoning models rewrote the rulebook",
        subtext: "Test time compute is replacing brute force pre training. Thinking tokens let a model check its own work before it answers.",
        credit: 'AI Research Journal',
      },
      {
        headline: "Synthetic data outran the public internet",
        subtext: "Verified proofs and simulated environments are training the next frontier models. The scraped human text archive has officially peaked.",
        credit: 'DeepMind',
      },
      {
        headline: "Local AI finally feels practical",
        subtext: "Sub four bit quantization plus unified memory means a 14B model runs happily on edge hardware with the wifi switched off.",
        credit: 'Hardware Lab',
      },
    ],
  },

  {
    id: 'tpl_emerald_matrix',
    name: 'Deep Emerald Matrix',
    tagline: 'Typographic focus for silicon and hardware deep dives',
    category: 'HARDWARE',
    badge: 'MINIMAL',
    themeId: 'emerald_matrix',
    templateId: 'minimal_quote',
    fontChoice: 'Archivo Black',
    coverTitle: '4 trillion transistors',
    highlights: ['Oversized quote glyph', 'Square photo beside the notes', 'Compact subtext scale'],
    deckSettings: {
      globalHeadlineCase: 'uppercase',
      globalSubtextSize: 'compact',
      globalFrameFormat: 'slide',
      globalShowAccentRule: true,
    },
    slides: [
      {
        headline: "One wafer scale chip, four trillion transistors",
        subtext: "Nine hundred thousand AI cores, liquid cooled, pulling 23 kilowatts. It needs its own dedicated plumbing inside the datacentre.",
        credit: 'Semiconductor Review',
      },
      {
        headline: "Optics beat copper for the last hop",
        subtext: "Photonic links between GPU nodes deliver ten times the bandwidth at a fifth of the power. Copper had a genuinely good run.",
        credit: 'Optics Today',
      },
      {
        headline: "Custom TPUs win on cost per token",
        subtext: "Seventh generation tensor cores cut inference cost by 65 percent, and the clusters now span multiple continents.",
        credit: 'Cloud Hardware',
      },
    ],
  },

  {
    id: 'tpl_crimson_signal',
    name: 'Crimson Signal',
    tagline: 'Full bleed photography behind a frosted glass card',
    category: 'CINEMATIC',
    badge: 'CINEMATIC',
    themeId: 'sunset_blaze',
    templateId: 'hero_fullbleed',
    fontChoice: 'Anton',
    coverTitle: 'Your feed is the product',
    highlights: ['Edge to edge hero photo', 'Frosted lower third card', 'Cinematic bottom vignette'],
    deckSettings: {
      globalHeadlineCase: 'uppercase',
      globalSubtextSize: 'normal',
      globalFrameFormat: 'step',
      globalShowAccentRule: true,
    },
    slides: [
      {
        headline: "Attention is the only metric that compounds",
        subtext: "Every platform sells the same seconds. The only thing left to differentiate on is how the second is framed.",
        credit: 'Signal Studio',
      },
      {
        headline: "Vertical video stopped being a trend",
        subtext: "It became the default surface for news, sport and advertising alike. Horizontal is the niche format now.",
        credit: 'Signal Studio',
      },
      {
        headline: "Carousels quietly beat reels on reach",
        subtext: "Swipe rate wins over watch time, and the swipe is the one moment where the brand voice actually lands.",
        credit: 'Signal Studio',
      },
    ],
  },

  {
    id: 'tpl_mono_manifesto',
    name: 'Mono Manifesto',
    tagline: 'Chrome free brutalist type for opinions and hot takes',
    category: 'MINIMAL',
    badge: 'RAW',
    themeId: 'mono_stark',
    templateId: 'classic_studio',
    fontChoice: 'Anton',
    coverTitle: 'Ship the boring version',
    highlights: ['No frame label, no chrome', 'Pure monochrome palette', 'Type does all the work'],
    deckSettings: {
      globalHeadlineCase: 'uppercase',
      globalSubtextSize: 'compact',
      globalFrameFormat: 'none',
      globalShowAccentRule: true,
      watermarkEnabled: true,
      watermarkText: '@yourhandle',
      watermarkPosition: 'bottom_right',
      watermarkStyle: 'pill',
    },
    slides: [
      {
        headline: "Ship the boring version first",
        subtext: "Nobody has ever gone viral because a settings screen loaded 300ms faster. They went viral because the joke landed.",
        credit: 'Manifesto 01',
      },
      {
        headline: "Nobody reads your changelog",
        subtext: "They read the screenshot. Write the screenshot first, then go and write the actual feature.",
        credit: 'Manifesto 02',
      },
      {
        headline: "Delete the feature nobody uses",
        subtext: "Every removed toggle buys back support tickets, bundle size and your own attention. All three are expensive.",
        credit: 'Manifesto 03',
      },
    ],
  },
];
