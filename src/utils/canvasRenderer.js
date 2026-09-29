/**
 * Canvas 2D Poster Rendering Engine for Carousel Poster Studio
 * Generates exact 1080x1080 px PNG compositions with customizable card themes,
 * poster layout design templates, light watermarks, and typography.
 */

export const CANVAS_SIZE = 1080;
export const PADDING = 70;
export const IMAGE_PANEL_HEIGHT = 400;

export const POSTER_THEMES = {
  dark_lime: {
    id: 'dark_lime',
    name: 'Dark Studio (Lime)',
    bgType: 'solid',
    bgColor: '#0B0B0B',
    accentColor: '#CDFF3C',
    headlineColor: '#FFFFFF',
    subtextColor: '#D8D8D8',
    creditColor: '#666666',
    previewColor: '#0B0B0B',
    previewAccent: '#CDFF3C',
  },
  clean_light: {
    id: 'clean_light',
    name: 'Editorial Light',
    bgType: 'solid',
    bgColor: '#F5F5F7',
    accentColor: '#0066FF',
    headlineColor: '#0D0D0D',
    subtextColor: '#4B5563',
    creditColor: '#9CA3AF',
    previewColor: '#F5F5F7',
    previewAccent: '#0066FF',
  },
  neon_cyber: {
    id: 'neon_cyber',
    name: 'Cyberpunk Neon',
    bgType: 'gradient',
    bgGradient: { from: '#0E071A', to: '#1F0C38', angle: 135 },
    accentColor: '#FF007A',
    headlineColor: '#FFFFFF',
    subtextColor: '#E4C1F9',
    creditColor: '#9333EA',
    previewColor: '#1F0C38',
    previewAccent: '#FF007A',
  },
  midnight_slate: {
    id: 'midnight_slate',
    name: 'Midnight Obsidian',
    bgType: 'gradient',
    bgGradient: { from: '#0A0E17', to: '#151E2E', angle: 180 },
    accentColor: '#00F0FF',
    headlineColor: '#FFFFFF',
    subtextColor: '#94A3B8',
    creditColor: '#475569',
    previewColor: '#0A0E17',
    previewAccent: '#00F0FF',
  },
  sunset_blaze: {
    id: 'sunset_blaze',
    name: 'Crimson Flame',
    bgType: 'gradient',
    bgGradient: { from: '#180A0A', to: '#2E0E0E', angle: 135 },
    accentColor: '#FF6B00',
    headlineColor: '#FFF5F0',
    subtextColor: '#E2B8B0',
    creditColor: '#8C4A4A',
    previewColor: '#2E0E0E',
    previewAccent: '#FF6B00',
  },
  emerald_matrix: {
    id: 'emerald_matrix',
    name: 'Deep Emerald',
    bgType: 'gradient',
    bgGradient: { from: '#06130B', to: '#0D2818', angle: 140 },
    accentColor: '#10B981',
    headlineColor: '#ECFDF5',
    subtextColor: '#A7F3D0',
    creditColor: '#065F46',
    previewColor: '#0D2818',
    previewAccent: '#10B981',
  },
  mono_stark: {
    id: 'mono_stark',
    name: 'Monochrome Stark',
    bgType: 'solid',
    bgColor: '#161616',
    accentColor: '#FFFFFF',
    headlineColor: '#FFFFFF',
    subtextColor: '#A3A3A3',
    creditColor: '#525252',
    previewColor: '#161616',
    previewAccent: '#FFFFFF',
  }
};

export const THEME_KEYS = Object.keys(POSTER_THEMES);

export const POSTER_LAYOUT_TEMPLATES = {
  classic_studio: {
    id: 'classic_studio',
    name: 'Classic Studio',
    desc: 'Top 16:9 photo panel + bold bottom copy with accent bar',
    badge: 'DEFAULT',
  },
  headline_first: {
    id: 'headline_first',
    name: 'Headline First',
    desc: 'Giant hook headline at the top, photo & subtext below',
    badge: 'VIRAL',
  },
  hero_fullbleed: {
    id: 'hero_fullbleed',
    name: 'Cinematic Full-Bleed',
    desc: 'Edge-to-edge photo with frosted glass lower card',
    badge: 'CINEMATIC',
  },
  editorial_split: {
    id: 'editorial_split',
    name: 'Editorial Magazine',
    desc: 'High-end pull quote styling with refined proportions',
    badge: 'EDITORIAL',
  },
  card_frame: {
    id: 'card_frame',
    name: 'Bordered Luxury Card',
    desc: 'Double-border inset canvas with floating photo',
    badge: 'CLEAN',
  },
  minimal_quote: {
    id: 'minimal_quote',
    name: 'Minimal Typo Focus',
    desc: 'Oversized quotation mark, dominant typography & split photo',
    badge: 'MINIMAL',
  },
};

export const TEMPLATE_KEYS = Object.keys(POSTER_LAYOUT_TEMPLATES);

/**
 * Slide layout types — defines how many image slots each layout uses.
 */
export const SLIDE_LAYOUTS = {
  full_bleed: { id: 'full_bleed', name: 'Full Bleed', desc: 'Single photo fills background edge-to-edge', imageSlots: 1, icon: '🖼️' },
  split_image: { id: 'split_image', name: 'Split Image', desc: 'Photo on right half, text on left half', imageSlots: 1, icon: '⬛' },
  top_image: { id: 'top_image', name: 'Top Photo', desc: 'Photo at top (poster template style)', imageSlots: 1, icon: '🔳' },
  dual_image: { id: 'dual_image', name: 'Dual Images', desc: 'Two photos side by side with text below', imageSlots: 2, icon: '⬛⬛' },
  text_only: { id: 'text_only', name: 'Text Only', desc: 'Pure typography, no image panel', imageSlots: 0, icon: '𝕋' },
  collage_3: { id: 'collage_3', name: '3-Photo Collage', desc: 'Three photos tiled above text', imageSlots: 3, icon: '🔲🔲🔲' },
};
export const SLIDE_LAYOUT_KEYS = Object.keys(SLIDE_LAYOUTS);

const imageCache = new Map();

/**
 * Loads an image from a data URL or valid image URL and caches it.
 */
export function loadCanvasImage(src) {
  if (!src) return Promise.resolve(null);
  if (imageCache.has(src)) return imageCache.get(src);

  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Image decode error: ' + (err.message || 'failed to load')));
    img.src = src;
  });

  imageCache.set(src, promise);
  return promise;
}

/**
 * Ensures web fonts are ready before drawing.
 */
export async function ensureFontsReady() {
  try {
    if (document.fonts && document.fonts.load) {
      await Promise.all([
        document.fonts.load('148px Anton'),
        document.fonts.load('148px Archivo Black'),
        document.fonts.load('900 148px Montserrat'),
        document.fonts.load('500 30px Inter'),
        document.fonts.load('400 36px Inter'),
        document.fonts.load('700 28px Space Mono'),
        document.fonts.load('700 14px Inter'),
      ]);
    }
  } catch (e) {
    console.warn('Fonts load fallback:', e);
  }
}

/**
 * Breaks text into wrapped lines that fit within maxW.
 */
export function wrapText(ctx, text, maxW) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [''];

  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const width = ctx.measureText(testLine).width;
    if (width <= maxW || !currentLine) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines.length ? lines : [''];
}

/**
 * Draws rounded rectangle path.
 */
export function drawRoundedRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius);
    return;
  }
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/**
 * Draws letter-spaced text.
 */
export function drawLetterSpaced(ctx, text, startX, startY, spacing) {
  let curX = startX;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  for (const char of text) {
    ctx.fillText(char, curX, startY);
    curX += ctx.measureText(char).width + spacing;
  }
  ctx.textAlign = prevAlign;
}

/**
 * Draws the image panel according to fit & focal point settings.
 */
export function drawImagePanel(ctx, slide, img, x, y, width, height, theme, globalFit, customRadius = 12) {
  ctx.save();
  drawRoundedRectPath(ctx, x, y, width, height, customRadius);
  ctx.clip();

  const activeFit = slide.fit || globalFit || 'cover';

  if (img) {
    if (activeFit === 'contain') {
      ctx.fillStyle = theme.bgType === 'gradient' ? '#121212' : (theme.bgColor === '#F5F5F7' ? '#E5E7EB' : '#141414');
      ctx.fillRect(x, y, width, height);
      const scale = Math.min(width / img.width, height / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, x + (width - dw) / 2, y + (height - dh) / 2, dw, dh);
    } else {
      // Cover fit with focal-point vertical slider
      const scale = Math.max(width / img.width, height / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const focal = Math.min(100, Math.max(0, slide.focal != null ? slide.focal : 50)) / 100;
      const dx = x + (width - dw) / 2;
      const dy = y + (height - dh) * focal;
      ctx.drawImage(img, dx, dy, dw, dh);
    }
  } else {
    // Sleek dark/light placeholder when no image is attached
    const isLightTheme = theme.id === 'clean_light' || (theme.bgColor && theme.bgColor.toLowerCase() === '#f5f5f7');
    ctx.fillStyle = isLightTheme ? '#E5E7EB' : '#161616';
    ctx.fillRect(x, y, width, height);
    ctx.setLineDash([12, 10]);
    ctx.strokeStyle = isLightTheme ? '#D1D5DB' : '#323232';
    ctx.lineWidth = 2.5;
    drawRoundedRectPath(ctx, x + 16, y + 16, width - 32, height - 32, 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // Icon & hints
    ctx.fillStyle = isLightTheme ? '#6B7280' : '#666';
    ctx.font = '500 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No image attached', x + width / 2, y + height / 2 - 16);

    ctx.font = '400 22px Inter, sans-serif';
    ctx.fillStyle = isLightTheme ? '#9CA3AF' : '#444';
    ctx.fillText('Upload a photo or paste an image URL', x + width / 2, y + height / 2 + 22);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  ctx.restore();
}

/**
 * Resolves active theme object from slide properties and optional globalSettings.
 */
export function resolveSlideTheme(slide, globalSettings = null, slideIndex = 0, totalSlides = 1) {
  const mode = globalSettings?.themeMode || 'individual';
  let themeKey = slide.themeId || globalSettings?.globalThemeId || 'dark_lime';

  if (mode === 'uniform') {
    themeKey = globalSettings?.globalThemeId || 'dark_lime';
  } else if (mode === 'random') {
    const keys = THEME_KEYS;
    const seed = globalSettings?.randomSeed || 0;
    themeKey = keys[(slideIndex * 3 + seed) % keys.length];
  } else if (mode === 'alternating') {
    const primary = globalSettings?.globalThemeId || 'dark_lime';
    const secondary = globalSettings?.secondaryThemeId || 'neon_cyber';
    themeKey = slideIndex % 2 === 0 ? primary : secondary;
  } else if (mode === 'rainbow') {
    const keys = THEME_KEYS;
    themeKey = keys[slideIndex % keys.length];
  } else if (mode === 'individual') {
    themeKey = slide.themeId || globalSettings?.globalThemeId || 'dark_lime';
  }

  const baseTheme = POSTER_THEMES[themeKey] || POSTER_THEMES.dark_lime;
  const isGlobalThemeMode = globalSettings && (mode === 'uniform' || mode === 'custom');

  return {
    ...baseTheme,
    accentColor: isGlobalThemeMode && globalSettings?.customAccentColor
      ? globalSettings.customAccentColor
      : (slide.customAccentColor || globalSettings?.customAccentColor || slide.accentColor || baseTheme.accentColor),
    bgColor: isGlobalThemeMode && globalSettings?.customBgColor
      ? globalSettings.customBgColor
      : (slide.customBgColor || globalSettings?.customBgColor || baseTheme.bgColor),
    headlineColor: isGlobalThemeMode && globalSettings?.customHeadlineColor
      ? globalSettings.customHeadlineColor
      : (slide.customHeadlineColor || globalSettings?.customHeadlineColor || baseTheme.headlineColor),
    subtextColor: isGlobalThemeMode && globalSettings?.customSubtextColor
      ? globalSettings.customSubtextColor
      : (slide.customSubtextColor || globalSettings?.customSubtextColor || baseTheme.subtextColor),
    bgType: isGlobalThemeMode && globalSettings?.customBgType
      ? globalSettings.customBgType
      : (slide.customBgType || baseTheme.bgType),
    bgGradient: isGlobalThemeMode && globalSettings?.customBgGradient
      ? globalSettings.customBgGradient
      : (slide.customBgGradient || baseTheme.bgGradient),
  };
}

/**
 * Resolves frame label string according to slide properties or project-wide formatting.
 * Supports optional / hidden frame numbers.
 */
export function resolveFrameLabel(slide, slideIndex = 0, totalSlides = 1, globalSettings = null) {
  // If slide explicitly disables frame label
  if (slide.showFrameLabel === false) {
    return '';
  }

  // If globally disabled and slide does not explicitly force it
  if (globalSettings?.globalShowFrameLabel === false && slide.showFrameLabel !== true && !slide.frameLabel) {
    return '';
  }

  const format = globalSettings?.globalFrameFormat || 'frame';
  if ((format === 'none' || format === 'hidden') && !slide.frameLabel && slide.showFrameLabel !== true) {
    return '';
  }

  // If slide has explicit custom frame label and not empty, use it
  if (slide.frameLabel && slide.frameLabel.trim()) {
    return slide.frameLabel.trim();
  }

  const prefix = (globalSettings?.globalFramePrefix || 'FRAME').trim() || 'FRAME';
  const padIndex = String(slideIndex + 1).padStart(2, '0');
  const padTotal = String(Math.max(1, totalSlides || 1)).padStart(2, '0');

  switch (format) {
    case 'count':
      return `${padIndex} / ${padTotal}`;
    case 'slide':
      return `SLIDE ${padIndex}`;
    case 'news':
      return `NEWS #${padIndex}`;
    case 'step':
      return `STEP ${padIndex}`;
    case 'prefix':
      return `${prefix} ${padIndex}`;
    case 'none':
    case 'hidden':
      return '';
    case 'frame':
    default:
      return `FRAME ${padIndex}`;
  }
}

/**
 * Resolves font family for headline drawing.
 */
function resolveHeadlineFont(fontName) {
  switch (fontName) {
    case 'Archivo Black':
      return '"Archivo Black", Anton, sans-serif';
    case 'Space Mono':
      return '"Space Mono", monospace, sans-serif';
    case 'Montserrat':
      return '"Montserrat", "Archivo Black", sans-serif';
    case 'Inter':
      return '"Inter", sans-serif';
    case 'Anton':
    default:
      return 'Anton, "Archivo Black", "Arial Narrow", sans-serif';
  }
}

/**
 * Transforms string into Title Case.
 */
function toTitleCase(str) {
  return String(str || '').replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

/**
 * Draws customizable light watermark / brand handle onto canvas.
 */
export function drawWatermark(ctx, slide, globalSettings, theme) {
  const text = (slide.watermarkText || globalSettings?.watermarkText || '').trim();
  const enabled = slide.watermarkEnabled != null
    ? slide.watermarkEnabled
    : (globalSettings?.watermarkEnabled ?? Boolean(text));

  if (!enabled || !text) return;

  const position = slide.watermarkPosition || globalSettings?.watermarkPosition || 'bottom_right';
  const opacity = Math.min(1, Math.max(0.05, globalSettings?.watermarkOpacity != null ? globalSettings.watermarkOpacity : 0.30));
  const style = slide.watermarkStyle || globalSettings?.watermarkStyle || 'pill';

  ctx.save();
  ctx.globalAlpha = opacity;

  const fontMono = '700 22px "Space Mono", monospace, sans-serif';
  const fontSans = '700 20px Inter, sans-serif';
  ctx.font = style === 'pill' ? fontMono : fontSans;

  const textWidth = ctx.measureText(text).width;
  const pillPaddingX = 14;
  const pillPaddingY = 7;
  const pillW = textWidth + pillPaddingX * 2;
  const pillH = 34;

  let x = CANVAS_SIZE - PADDING - pillW;
  let y = CANVAS_SIZE - PADDING - pillH;

  if (position === 'top_right') {
    x = CANVAS_SIZE - PADDING - pillW;
    y = PADDING + 12;
  } else if (position === 'top_left') {
    x = PADDING;
    y = PADDING + 12;
  } else if (position === 'bottom_left') {
    x = PADDING;
    y = CANVAS_SIZE - PADDING - pillH;
  } else if (position === 'center_stamp') {
    // 45-degree translucent center stamp
    ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    ctx.rotate(-Math.PI / 4);
    ctx.font = '900 64px Anton, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.accentColor || '#CDFF3C';
    ctx.fillText(text.toUpperCase(), 0, 0);
    ctx.restore();
    return;
  } else if (position === 'under_header') {
    x = CANVAS_SIZE - PADDING - pillW;
    y = PADDING + IMAGE_PANEL_HEIGHT + 14;
  }

  if (style === 'pill') {
    // Glassmorphic pill badge with border
    const isLight = theme.id === 'clean_light' || theme.bgColor === '#F5F5F7';
    ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)';
    drawRoundedRectPath(ctx, x, y, pillW, pillH, 8);
    ctx.fill();

    ctx.strokeStyle = theme.accentColor || '#CDFF3C';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = theme.headlineColor || '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + pillW / 2, y + pillH / 2 + 1);
  } else {
    // Minimal raw text with subtle styling
    ctx.fillStyle = theme.headlineColor || '#FFFFFF';
    ctx.textAlign = (position === 'top_right' || position === 'bottom_right' || position === 'under_header') ? 'right' : 'left';
    ctx.textBaseline = 'top';
    const tx = ctx.textAlign === 'right' ? (CANVAS_SIZE - PADDING) : PADDING;
    ctx.fillText(text, tx, y + 6);
  }

  ctx.restore();
}

/**
 * Formats headline string based on casing settings.
 */
function formatHeadline(headline, casing = 'normal') {
  let raw = headline || '';
  if (casing === 'uppercase') return raw.toUpperCase();
  if (casing === 'titlecase') return toTitleCase(raw);
  if (casing === 'lowercase') return raw.toLowerCase();
  return raw;
}

/**
 * Draws the poster background according to theme settings.
 */
function drawBackground(ctx, theme) {
  if (theme.bgType === 'gradient' && theme.bgGradient) {
    const angleRad = ((theme.bgGradient.angle || 135) * Math.PI) / 180;
    const half = CANVAS_SIZE / 2;
    const x1 = half - half * Math.cos(angleRad);
    const y1 = half - half * Math.sin(angleRad);
    const x2 = half + half * Math.cos(angleRad);
    const y2 = half + half * Math.sin(angleRad);
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, theme.bgGradient.from);
    grad.addColorStop(1, theme.bgGradient.to);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = theme.bgColor || '#0B0B0B';
  }
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

/**
 * Renders a complete 1080x1080 slide onto a Canvas element with support for:
 * 1. 6 distinct Poster Design Templates
 * 2. Optional / Disabled Frame labels
 * 3. Light Watermarks & Branding
 * 4. Custom typography & themes
 */
export async function renderSlideToCanvas(slide, slideIndex = 0, targetCanvas = null, globalSettings = null, totalSlides = 1) {
  const canvas = targetCanvas || document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d');

  const theme = resolveSlideTheme(slide, globalSettings, slideIndex, totalSlides);
  const templateId = slide.templateId || globalSettings?.globalTemplateId || 'classic_studio';

  // Draw Poster Background
  drawBackground(ctx, theme);
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  // Load Images — supports new images[] multi-slot and legacy single image field
  const rawImages = slide.images && slide.images.length > 0
    ? slide.images
    : (slide.image ? [{ url: slide.image, fit: slide.fit || 'cover', focal: slide.focal != null ? slide.focal : 50 }] : []);

  const loadedImages = await Promise.all(
    rawImages.map(async (slot) => {
      const src = typeof slot === 'string' ? slot : slot?.url;
      if (!src) return null;
      try { return await loadCanvasImage(src); } catch { return null; }
    })
  );
  const img = loadedImages[0] || null;
  // Per-slot proxy for drawImagePanel (carries fit/focal from slot)
  const makeSlotProxy = (idx) => ({
    ...slide,
    fit: rawImages[idx]?.fit || slide.fit || 'cover',
    focal: rawImages[idx]?.focal != null ? rawImages[idx].focal : (slide.focal != null ? slide.focal : 50),
  });

  const maxContentWidth = CANVAS_SIZE - PADDING * 2; // 940px
  const frameText = resolveFrameLabel(slide, slideIndex, totalSlides, globalSettings);
  const showAccentRule = globalSettings?.globalShowAccentRule !== false;
  const activeFontName = slide.fontChoice || globalSettings?.globalFontChoice || 'Anton';
  const fontFam = resolveHeadlineFont(activeFontName);
  const rawHeadline = formatHeadline(slide.headline || '', globalSettings?.globalHeadlineCase || 'normal');

  // Subtext Font Sizing
  let baseSubFontSize = 36;
  if (globalSettings?.globalSubtextSize === 'compact') baseSubFontSize = 30;
  if (globalSettings?.globalSubtextSize === 'large') baseSubFontSize = 42;
  let subFontSize = baseSubFontSize;

  // =========================================================================
  // TEMPLATE 1: CLASSIC STUDIO (Default Standard)
  // =========================================================================
  if (templateId === 'classic_studio') {
    let curY = PADDING;

    // 1. Image Panel (16:9 400px)
    drawImagePanel(ctx, slide, img, PADDING, curY, maxContentWidth, IMAGE_PANEL_HEIGHT, theme, globalSettings?.globalImageFit);
    curY += IMAGE_PANEL_HEIGHT + 34;

    // 2. Frame Label
    if (frameText) {
      ctx.fillStyle = theme.accentColor;
      ctx.font = '700 28px "Space Mono", monospace, sans-serif';
      drawLetterSpaced(ctx, frameText, PADDING, curY, 6);
      curY += 40;
    }

    // Accent Rule Line
    if (showAccentRule) {
      ctx.fillStyle = theme.accentColor;
      drawRoundedRectPath(ctx, PADDING, curY, 60, 4, 2);
      ctx.fill();
      curY += 4 + 36;
    } else {
      curY += frameText ? 16 : 8;
    }

    // 3. Subtext measurement
    ctx.font = `400 ${subFontSize}px Inter, sans-serif`;
    let subLines = wrapText(ctx, slide.subtext, maxContentWidth);
    while (subLines.length > 5 && subFontSize > 24) {
      subFontSize -= 2;
      ctx.font = `400 ${subFontSize}px Inter, sans-serif`;
      subLines = wrapText(ctx, slide.subtext, maxContentWidth);
    }
    if (subLines.length > 5) subLines = subLines.slice(0, 5);
    const subLineHeight = subFontSize * 1.34;
    const totalSubHeight = slide.subtext ? subLines.length * subLineHeight : 0;

    // 4. Headline auto-shrink
    const headTop = curY;
    const gap = slide.subtext ? 26 : 0;
    let headFontSize = 148;
    let headLines = [''];

    while (headFontSize > 50) {
      ctx.font = `${headFontSize}px ${fontFam}`;
      headLines = wrapText(ctx, rawHeadline, maxContentWidth);
      const neededHeight = headLines.length * (headFontSize * 0.98) + gap + totalSubHeight;
      if (headLines.length <= 4 && headTop + neededHeight <= CANVAS_SIZE - PADDING) break;
      headFontSize -= 4;
    }

    const headLineHeight = headFontSize * 0.98;
    const maxHeadLines = Math.max(1, Math.floor(((CANVAS_SIZE - PADDING) - headTop - gap - totalSubHeight) / headLineHeight));
    const allowedLines = Math.min(4, maxHeadLines);
    if (headLines.length > allowedLines) {
      headLines = headLines.slice(0, allowedLines);
      headLines[allowedLines - 1] = headLines[allowedLines - 1].replace(/\s+$/, '').replace(/…$/, '') + '…';
    }

    // Draw Headline
    ctx.fillStyle = theme.headlineColor || '#FFFFFF';
    ctx.font = `${headFontSize}px ${fontFam}`;
    let hy = headTop;
    for (const line of headLines) {
      ctx.fillText(line, PADDING, hy);
      hy += headLineHeight;
    }

    // Draw Subtext
    if (slide.subtext) {
      ctx.fillStyle = theme.subtextColor || '#D8D8D8';
      ctx.font = `400 ${subFontSize}px Inter, sans-serif`;
      let sy = hy + gap;
      for (const line of subLines) {
        ctx.fillText(line, PADDING, sy);
        sy += subLineHeight;
      }
    }
  }

  // =========================================================================
  // TEMPLATE 2: HEADLINE FIRST (Viral Hook at Top)
  // =========================================================================
  else if (templateId === 'headline_first') {
    let curY = PADDING;

    // Top Frame Label & Accent Line
    if (frameText) {
      ctx.fillStyle = theme.accentColor;
      ctx.font = '700 26px "Space Mono", monospace, sans-serif';
      drawLetterSpaced(ctx, frameText, PADDING, curY, 6);
      curY += 36;
    }
    if (showAccentRule) {
      ctx.fillStyle = theme.accentColor;
      drawRoundedRectPath(ctx, PADDING, curY, 60, 4, 2);
      ctx.fill();
      curY += 4 + 20;
    }

    // Big Headline at Top (2-3 lines)
    let headFontSize = 120;
    let headLines = [''];
    while (headFontSize > 54) {
      ctx.font = `${headFontSize}px ${fontFam}`;
      headLines = wrapText(ctx, rawHeadline, maxContentWidth);
      if (headLines.length <= 3) break;
      headFontSize -= 4;
    }
    if (headLines.length > 3) headLines = headLines.slice(0, 3);
    const headLineHeight = headFontSize * 0.98;

    ctx.fillStyle = theme.headlineColor || '#FFFFFF';
    ctx.font = `${headFontSize}px ${fontFam}`;
    for (const line of headLines) {
      ctx.fillText(line, PADDING, curY);
      curY += headLineHeight;
    }
    curY += 24;

    // Center Image Panel
    const imgHeight = 360;
    drawImagePanel(ctx, slide, img, PADDING, curY, maxContentWidth, imgHeight, theme, globalSettings?.globalImageFit);
    curY += imgHeight + 24;

    // Subtext at bottom
    if (slide.subtext) {
      ctx.fillStyle = theme.subtextColor || '#D8D8D8';
      ctx.font = `400 ${subFontSize}px Inter, sans-serif`;
      let subLines = wrapText(ctx, slide.subtext, maxContentWidth);
      if (subLines.length > 3) subLines = subLines.slice(0, 3);
      for (const line of subLines) {
        ctx.fillText(line, PADDING, curY);
        curY += subFontSize * 1.32;
      }
    }
  }

  // =========================================================================
  // TEMPLATE 3: CINEMATIC FULL-BLEED HERO (Edge-to-edge + Glass Card)
  // =========================================================================
  else if (templateId === 'hero_fullbleed') {
    // 1. Full Bleed Background Image
    drawImagePanel(ctx, slide, img, 0, 0, CANVAS_SIZE, CANVAS_SIZE, theme, 'cover', 0);

    // 2. Full-Canvas Dark Gradient Vignette for Readability
    const scrim = ctx.createLinearGradient(0, 0, 0, CANVAS_SIZE);
    scrim.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    scrim.addColorStop(0.4, 'rgba(0, 0, 0, 0.25)');
    scrim.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
    scrim.addColorStop(1, 'rgba(0, 0, 0, 0.96)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 3. Frosted Glass Container Card at Lower-Third
    const cardX = 48;
    const cardY = 510;
    const cardW = CANVAS_SIZE - cardX * 2; // 984px
    const cardH = CANVAS_SIZE - cardY - 48; // 522px
    const innerPad = 36;

    ctx.save();
    drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, 20);
    ctx.fillStyle = 'rgba(11, 11, 11, 0.88)';
    ctx.fill();
    ctx.strokeStyle = theme.accentColor || '#CDFF3C';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    let curY = cardY + innerPad;
    const innerContentW = cardW - innerPad * 2;

    if (frameText) {
      ctx.fillStyle = theme.accentColor;
      ctx.font = '700 26px "Space Mono", monospace, sans-serif';
      drawLetterSpaced(ctx, frameText, cardX + innerPad, curY, 6);
      curY += 36;
    }
    if (showAccentRule) {
      ctx.fillStyle = theme.accentColor;
      drawRoundedRectPath(ctx, cardX + innerPad, curY, 60, 4, 2);
      ctx.fill();
      curY += 4 + 20;
    }

    // Headline inside Card
    let headFontSize = 110;
    let headLines = [''];
    while (headFontSize > 50) {
      ctx.font = `${headFontSize}px ${fontFam}`;
      headLines = wrapText(ctx, rawHeadline, innerContentW);
      if (headLines.length <= 3) break;
      headFontSize -= 4;
    }
    if (headLines.length > 3) headLines = headLines.slice(0, 3);
    const headLineHeight = headFontSize * 0.98;

    ctx.fillStyle = theme.headlineColor || '#FFFFFF';
    ctx.font = `${headFontSize}px ${fontFam}`;
    for (const line of headLines) {
      ctx.fillText(line, cardX + innerPad, curY);
      curY += headLineHeight;
    }
    curY += 18;

    // Subtext inside Card
    if (slide.subtext) {
      ctx.fillStyle = theme.subtextColor || '#D8D8D8';
      ctx.font = `400 ${subFontSize}px Inter, sans-serif`;
      let subLines = wrapText(ctx, slide.subtext, innerContentW);
      if (subLines.length > 3) subLines = subLines.slice(0, 3);
      for (const line of subLines) {
        ctx.fillText(line, cardX + innerPad, curY);
        curY += subFontSize * 1.32;
      }
    }
  }

  // =========================================================================
  // TEMPLATE 4: EDITORIAL MAGAZINE (Refined Proportions & Pull-Quote Style)
  // =========================================================================
  else if (templateId === 'editorial_split') {
    let curY = PADDING;

    // Top Image (370px)
    drawImagePanel(ctx, slide, img, PADDING, curY, maxContentWidth, 370, theme, globalSettings?.globalImageFit, 8);
    curY += 370 + 30;

    // Editorial Tracking Frame Tag e.g. "— FRAME 01 / REPORT —"
    if (frameText) {
      ctx.fillStyle = theme.accentColor;
      ctx.font = '700 24px "Space Mono", monospace, sans-serif';
      drawLetterSpaced(ctx, `— ${frameText} —`, PADDING, curY, 4);
      curY += 38;
    }

    // Headline
    let headFontSize = 130;
    let headLines = [''];
    while (headFontSize > 52) {
      ctx.font = `${headFontSize}px ${fontFam}`;
      headLines = wrapText(ctx, rawHeadline, maxContentWidth);
      if (headLines.length <= 3) break;
      headFontSize -= 4;
    }
    if (headLines.length > 3) headLines = headLines.slice(0, 3);
    const headLineHeight = headFontSize * 0.98;

    ctx.fillStyle = theme.headlineColor || '#FFFFFF';
    ctx.font = `${headFontSize}px ${fontFam}`;
    for (const line of headLines) {
      ctx.fillText(line, PADDING, curY);
      curY += headLineHeight;
    }
    curY += 24;

    // Subtext with Editorial Accent Line at Left
    if (slide.subtext) {
      ctx.fillStyle = theme.accentColor;
      ctx.fillRect(PADDING, curY, 4, 80);

      ctx.fillStyle = theme.subtextColor || '#D8D8D8';
      ctx.font = `400 ${subFontSize}px Inter, sans-serif`;
      let subLines = wrapText(ctx, slide.subtext, maxContentWidth - 24);
      if (subLines.length > 3) subLines = subLines.slice(0, 3);
      let sy = curY;
      for (const line of subLines) {
        ctx.fillText(line, PADDING + 20, sy);
        sy += subFontSize * 1.34;
      }
    }
  }

  // =========================================================================
  // TEMPLATE 5: BORDERED LUXURY CARD (Inset Canvas Frame)
  // =========================================================================
  else if (templateId === 'card_frame') {
    const framePad = 40;
    const innerW = CANVAS_SIZE - framePad * 2; // 1000px
    const innerH = CANVAS_SIZE - framePad * 2; // 1000px

    // Inset Card Border
    ctx.save();
    drawRoundedRectPath(ctx, framePad, framePad, innerW, innerH, 20);
    ctx.strokeStyle = theme.accentColor || '#CDFF3C';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    let curY = framePad + 36;
    const contentW = innerW - 72;
    const contentX = framePad + 36;

    // Photo Panel
    drawImagePanel(ctx, slide, img, contentX, curY, contentW, 370, theme, globalSettings?.globalImageFit, 14);
    curY += 370 + 30;

    // Frame Pill Badge
    if (frameText) {
      const pillTextW = ctx.measureText(frameText).width + 24;
      ctx.fillStyle = theme.accentColor;
      drawRoundedRectPath(ctx, contentX, curY, pillTextW, 32, 6);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = '800 20px "Space Mono", monospace, sans-serif';
      ctx.fillText(frameText, contentX + 12, curY + 6);
      curY += 46;
    }

    // Headline
    let headFontSize = 120;
    let headLines = [''];
    while (headFontSize > 50) {
      ctx.font = `${headFontSize}px ${fontFam}`;
      headLines = wrapText(ctx, rawHeadline, contentW);
      if (headLines.length <= 3) break;
      headFontSize -= 4;
    }
    if (headLines.length > 3) headLines = headLines.slice(0, 3);
    const headLineHeight = headFontSize * 0.98;

    ctx.fillStyle = theme.headlineColor || '#FFFFFF';
    ctx.font = `${headFontSize}px ${fontFam}`;
    for (const line of headLines) {
      ctx.fillText(line, contentX, curY);
      curY += headLineHeight;
    }
    curY += 20;

    // Subtext
    if (slide.subtext) {
      ctx.fillStyle = theme.subtextColor || '#D8D8D8';
      ctx.font = `400 ${subFontSize}px Inter, sans-serif`;
      let subLines = wrapText(ctx, slide.subtext, contentW);
      if (subLines.length > 3) subLines = subLines.slice(0, 3);
      for (const line of subLines) {
        ctx.fillText(line, contentX, curY);
        curY += subFontSize * 1.32;
      }
    }
  }

  // =========================================================================
  // TEMPLATE 6: MINIMAL TYPO FOCUS (Oversized Quote + Split Photo)
  // =========================================================================
  else if (templateId === 'minimal_quote') {
    let curY = PADDING;

    // Decorative Oversized Quotation Mark in Background
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = theme.accentColor || '#CDFF3C';
    ctx.font = '900 240px Anton, sans-serif';
    ctx.fillText('“', PADDING - 20, PADDING - 40);
    ctx.restore();

    // Frame tag
    if (frameText) {
      ctx.fillStyle = theme.accentColor;
      ctx.font = '700 26px "Space Mono", monospace, sans-serif';
      drawLetterSpaced(ctx, frameText, PADDING, curY, 6);
      curY += 40;
    }

    // Dominant Headline
    let headFontSize = 136;
    let headLines = [''];
    while (headFontSize > 54) {
      ctx.font = `${headFontSize}px ${fontFam}`;
      headLines = wrapText(ctx, rawHeadline, maxContentWidth);
      if (headLines.length <= 3) break;
      headFontSize -= 4;
    }
    if (headLines.length > 3) headLines = headLines.slice(0, 3);
    const headLineHeight = headFontSize * 0.98;

    ctx.fillStyle = theme.headlineColor || '#FFFFFF';
    ctx.font = `${headFontSize}px ${fontFam}`;
    for (const line of headLines) {
      ctx.fillText(line, PADDING, curY);
      curY += headLineHeight;
    }
    curY += 36;

    // Bottom Split: Compact Square Photo on Left (340x340), Subtext on Right
    const bottomPhotoSize = 340;
    drawImagePanel(ctx, slide, img, PADDING, curY, bottomPhotoSize, bottomPhotoSize, theme, globalSettings?.globalImageFit, 16);

    if (slide.subtext) {
      const rightColX = PADDING + bottomPhotoSize + 32;
      const rightColW = maxContentWidth - bottomPhotoSize - 32;

      ctx.fillStyle = theme.accentColor;
      drawRoundedRectPath(ctx, rightColX, curY, 40, 4, 2);
      ctx.fill();

      ctx.fillStyle = theme.subtextColor || '#D8D8D8';
      ctx.font = `400 ${subFontSize}px Inter, sans-serif`;
      let subLines = wrapText(ctx, slide.subtext, rightColW);
      if (subLines.length > 6) subLines = subLines.slice(0, 6);
      let sy = curY + 22;
      for (const line of subLines) {
        ctx.fillText(line, rightColX, sy);
        sy += subFontSize * 1.34;
      }
    }
  }

  // =========================================================================
  // NEW SLIDE LAYOUTS: split_image, text_only, dual_image, collage_3
  // These run AFTER the poster template system above.
  // full_bleed and top_image just use the poster template system naturally.
  // =========================================================================

  if (slide.layout === 'split_image') {
    const splitX = CANVAS_SIZE / 2 + 20;
    const photoW = CANVAS_SIZE - splitX - 40;
    const photoH = CANVAS_SIZE - 80;
    drawImagePanel(ctx, makeSlotProxy(0), img, splitX, 40, photoW, photoH, theme, 'cover', 20);
    ctx.fillStyle = theme.accentColor;
    ctx.fillRect(splitX - 12, 70, 3, CANVAS_SIZE - 140);
    const leftW = splitX - PADDING - 16;
    let curY = PADDING + 20;
    if (frameText) {
      ctx.fillStyle = theme.accentColor;
      ctx.font = '700 22px "Space Mono", monospace, sans-serif';
      drawLetterSpaced(ctx, frameText, PADDING, curY, 5);
      curY += 34;
    }
    if (showAccentRule) {
      ctx.fillStyle = theme.accentColor;
      drawRoundedRectPath(ctx, PADDING, curY, 50, 4, 2);
      ctx.fill();
      curY += 28;
    }
    let headFontSizeSL = 120;
    let headLinesSL = [''];
    while (headFontSizeSL > 44) {
      ctx.font = `${headFontSizeSL}px ${fontFam}`;
      headLinesSL = wrapText(ctx, rawHeadline, leftW);
      if (headLinesSL.length <= 5 && curY + headLinesSL.length * headFontSizeSL < CANVAS_SIZE - 200) break;
      headFontSizeSL -= 4;
    }
    if (headLinesSL.length > 5) headLinesSL = headLinesSL.slice(0, 5);
    ctx.fillStyle = theme.headlineColor;
    ctx.font = `${headFontSizeSL}px ${fontFam}`;
    for (const line of headLinesSL) { ctx.fillText(line, PADDING, curY); curY += headFontSizeSL * 0.98; }
    curY += 24;
    if (slide.subtext) {
      ctx.fillStyle = theme.subtextColor;
      ctx.font = `400 ${subFontSize}px Inter, sans-serif`;
      let subLinesSL = wrapText(ctx, slide.subtext, leftW);
      if (subLinesSL.length > 5) subLinesSL = subLinesSL.slice(0, 5);
      for (const line of subLinesSL) { ctx.fillText(line, PADDING, curY); curY += subFontSize * 1.34; }
    }
  } else if (slide.layout === 'text_only') {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = theme.accentColor;
    ctx.font = `900 700px ${fontFam}`;
    ctx.textBaseline = 'bottom';
    ctx.fillText(rawHeadline.charAt(0) || '?', PADDING - 30, CANVAS_SIZE + 60);
    ctx.restore();
    ctx.textBaseline = 'top';
    let curY = PADDING + 40;
    if (frameText) {
      ctx.fillStyle = theme.accentColor;
      ctx.font = '700 28px "Space Mono", monospace, sans-serif';
      drawLetterSpaced(ctx, frameText, PADDING, curY, 6);
      curY += 44;
    }
    if (showAccentRule) {
      ctx.fillStyle = theme.accentColor;
      drawRoundedRectPath(ctx, PADDING, curY, 80, 5, 2);
      ctx.fill();
      curY += 36;
    }
    let headFontSizeTO = 160;
    let headLinesTO = [''];
    while (headFontSizeTO > 60) {
      ctx.font = `${headFontSizeTO}px ${fontFam}`;
      headLinesTO = wrapText(ctx, rawHeadline, maxContentWidth);
      if (headLinesTO.length <= 4 && curY + headLinesTO.length * headFontSizeTO * 0.98 < CANVAS_SIZE - 250) break;
      headFontSizeTO -= 5;
    }
    if (headLinesTO.length > 5) headLinesTO = headLinesTO.slice(0, 5);
    ctx.fillStyle = theme.headlineColor;
    ctx.font = `${headFontSizeTO}px ${fontFam}`;
    for (const line of headLinesTO) { ctx.fillText(line, PADDING, curY); curY += headFontSizeTO * 0.98; }
    curY += 36;
    if (slide.subtext) {
      ctx.fillStyle = theme.accentColor;
      ctx.fillRect(PADDING, curY, 5, 120);
      ctx.fillStyle = theme.subtextColor;
      ctx.font = `400 ${subFontSize + 4}px Inter, sans-serif`;
      let subLinesTO = wrapText(ctx, slide.subtext, maxContentWidth - 28);
      if (subLinesTO.length > 5) subLinesTO = subLinesTO.slice(0, 5);
      for (let i = 0; i < subLinesTO.length; i++) {
        ctx.fillText(subLinesTO[i], PADDING + 22, curY + 8 + i * (subFontSize + 4) * 1.34);
      }
    }
  } else if (slide.layout === 'dual_image') {
    let curY = PADDING;
    const gapDI = 16;
    const photoHDI = 400;
    const photoWDI = (maxContentWidth - gapDI) / 2;
    drawImagePanel(ctx, makeSlotProxy(0), loadedImages[0] || null, PADDING, curY, photoWDI, photoHDI, theme, 'cover', 12);
    drawImagePanel(ctx, makeSlotProxy(1), loadedImages[1] || null, PADDING + photoWDI + gapDI, curY, photoWDI, photoHDI, theme, 'cover', 12);
    curY += photoHDI + 30;
    if (frameText) {
      ctx.fillStyle = theme.accentColor;
      ctx.font = '700 26px "Space Mono", monospace, sans-serif';
      drawLetterSpaced(ctx, frameText, PADDING, curY, 5);
      curY += 38;
    }
    if (showAccentRule) {
      ctx.fillStyle = theme.accentColor;
      drawRoundedRectPath(ctx, PADDING, curY, 60, 4, 2);
      ctx.fill();
      curY += 30;
    }
    let headFontSizeDI = 120;
    let headLinesDI = [''];
    while (headFontSizeDI > 50) {
      ctx.font = `${headFontSizeDI}px ${fontFam}`;
      headLinesDI = wrapText(ctx, rawHeadline, maxContentWidth);
      if (headLinesDI.length <= 2 && curY + headLinesDI.length * headFontSizeDI * 0.98 < CANVAS_SIZE - 130) break;
      headFontSizeDI -= 4;
    }
    if (headLinesDI.length > 3) headLinesDI = headLinesDI.slice(0, 3);
    ctx.fillStyle = theme.headlineColor;
    ctx.font = `${headFontSizeDI}px ${fontFam}`;
    for (const line of headLinesDI) { ctx.fillText(line, PADDING, curY); curY += headFontSizeDI * 0.98; }
    curY += 18;
    if (slide.subtext) {
      ctx.fillStyle = theme.subtextColor;
      ctx.font = `400 ${subFontSize}px Inter, sans-serif`;
      let subLinesDI = wrapText(ctx, slide.subtext, maxContentWidth);
      if (subLinesDI.length > 2) subLinesDI = subLinesDI.slice(0, 2);
      for (const line of subLinesDI) { ctx.fillText(line, PADDING, curY); curY += subFontSize * 1.32; }
    }
  } else if (slide.layout === 'collage_3') {
    let curY = PADDING;
    const gapC3 = 10;
    const bigWC3 = maxContentWidth * 0.58;
    const smallWC3 = maxContentWidth - bigWC3 - gapC3;
    const collageHC3 = 440;
    const smallHC3 = (collageHC3 - gapC3) / 2;
    drawImagePanel(ctx, makeSlotProxy(0), loadedImages[0] || null, PADDING, curY, bigWC3, collageHC3, theme, 'cover', 12);
    drawImagePanel(ctx, makeSlotProxy(1), loadedImages[1] || null, PADDING + bigWC3 + gapC3, curY, smallWC3, smallHC3, theme, 'cover', 12);
    drawImagePanel(ctx, makeSlotProxy(2), loadedImages[2] || null, PADDING + bigWC3 + gapC3, curY + smallHC3 + gapC3, smallWC3, smallHC3, theme, 'cover', 12);
    curY += collageHC3 + 28;
    if (frameText) {
      ctx.fillStyle = theme.accentColor;
      ctx.font = '700 24px "Space Mono", monospace, sans-serif';
      drawLetterSpaced(ctx, frameText, PADDING, curY, 5);
      curY += 36;
    }
    let headFontSizeC3 = 108;
    let headLinesC3 = [''];
    while (headFontSizeC3 > 50) {
      ctx.font = `${headFontSizeC3}px ${fontFam}`;
      headLinesC3 = wrapText(ctx, rawHeadline, maxContentWidth);
      if (headLinesC3.length <= 2 && curY + headLinesC3.length * headFontSizeC3 < CANVAS_SIZE - 80) break;
      headFontSizeC3 -= 4;
    }
    if (headLinesC3.length > 2) headLinesC3 = headLinesC3.slice(0, 2);
    ctx.fillStyle = theme.headlineColor;
    ctx.font = `${headFontSizeC3}px ${fontFam}`;
    for (const line of headLinesC3) { ctx.fillText(line, PADDING, curY); curY += headFontSizeC3 * 0.98; }
  }

  // 5. Image Credit (Metadata caption at bottom-left)
  const creditText = (
    (slide.images?.length > 0 ? slide.images.map(i => i?.credit).filter(Boolean).join(', ') : '') ||
    slide.credit || globalSettings?.globalCredit || ''
  );

  if (creditText && creditText.trim()) {
    ctx.fillStyle = theme.creditColor || '#666666';
    ctx.font = '400 20px Inter, sans-serif';
    ctx.fillText('Img: ' + creditText.trim(), PADDING, CANVAS_SIZE - PADDING - 24);
  }

  // 6. Light Watermarks & Brand Handle
  drawWatermark(ctx, slide, globalSettings, theme);

  return canvas;
}
