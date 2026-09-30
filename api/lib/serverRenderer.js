import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register bundled Google Fonts if available
try {
  const fontsDir = path.join(__dirname, '..', 'fonts');
  if (fs.existsSync(fontsDir)) {
    const fontFiles = [
      { file: 'Anton-Regular.ttf', family: 'Anton' },
      { file: 'ArchivoBlack-Regular.ttf', family: 'Archivo Black' },
      { file: 'SpaceMono-Bold.ttf', family: 'Space Mono', weight: '700' },
      { file: 'SpaceMono-Regular.ttf', family: 'Space Mono', weight: '400' },
      { file: 'Inter-Bold.ttf', family: 'Inter', weight: '700' },
      { file: 'Inter-Regular.ttf', family: 'Inter', weight: '400' },
    ];
    for (const font of fontFiles) {
      const p = path.join(fontsDir, font.file);
      if (fs.existsSync(p)) {
        GlobalFonts.registerFromPath(p, font.family);
      }
    }
  }
} catch (e) {
  console.warn('Font registration notice:', e.message);
}

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
  },
};

export const THEME_KEYS = Object.keys(POSTER_THEMES);

function wrapText(ctx, text, maxW) {
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

function drawRoundedRectPath(ctx, x, y, width, height, radius) {
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

function drawLetterSpaced(ctx, text, startX, startY, spacing) {
  let curX = startX;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  for (const char of String(text || '')) {
    ctx.fillText(char, curX, startY);
    curX += ctx.measureText(char).width + spacing;
  }
  ctx.textAlign = prevAlign;
}

function drawImagePanel(ctx, slide, img, x, y, width, height, theme, globalFit, customRadius = 12) {
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
      const scale = Math.max(width / img.width, height / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const focal = Math.min(100, Math.max(0, slide.focal != null ? slide.focal : 50)) / 100;
      const dx = x + (width - dw) / 2;
      const dy = y + (height - dh) * focal;
      ctx.drawImage(img, dx, dy, dw, dh);
    }
  } else {
    const isLightTheme = theme.id === 'clean_light' || (theme.bgColor && theme.bgColor.toLowerCase() === '#f5f5f7');
    ctx.fillStyle = isLightTheme ? '#E5E7EB' : '#161616';
    ctx.fillRect(x, y, width, height);
    ctx.setLineDash([12, 10]);
    ctx.strokeStyle = isLightTheme ? '#D1D5DB' : '#323232';
    ctx.lineWidth = 2.5;
    drawRoundedRectPath(ctx, x + 16, y + 16, width - 32, height - 32, 10);
    ctx.stroke();
    ctx.setLineDash([]);

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

function resolveSlideTheme(slide, globalSettings = null, slideIndex = 0, totalSlides = 1) {
  const mode = globalSettings?.themeMode || 'individual';
  let themeKey = slide.theme || slide.themeId || globalSettings?.globalThemeId || 'dark_lime';

  if (mode === 'uniform') {
    themeKey = globalSettings?.globalThemeId || 'dark_lime';
  } else if (mode === 'alternating') {
    const primary = globalSettings?.globalThemeId || 'dark_lime';
    const secondary = globalSettings?.secondaryThemeId || 'neon_cyber';
    themeKey = slideIndex % 2 === 0 ? primary : secondary;
  } else if (mode === 'rainbow') {
    const keys = THEME_KEYS;
    themeKey = keys[slideIndex % keys.length];
  }

  const baseTheme = POSTER_THEMES[themeKey] || POSTER_THEMES.dark_lime;

  return {
    ...baseTheme,
    accentColor: slide.accentColor || slide.customAccentColor || globalSettings?.customAccentColor || baseTheme.accentColor,
    bgColor: slide.bgColor || slide.customBgColor || globalSettings?.customBgColor || baseTheme.bgColor,
    headlineColor: slide.headlineColor || slide.customHeadlineColor || globalSettings?.customHeadlineColor || baseTheme.headlineColor,
    subtextColor: slide.subtextColor || slide.customSubtextColor || globalSettings?.customSubtextColor || baseTheme.subtextColor,
    bgType: slide.bgType || slide.customBgType || baseTheme.bgType,
    bgGradient: slide.bgGradient || slide.customBgGradient || baseTheme.bgGradient,
  };
}

function resolveFrameLabel(slide, slideIndex = 0, totalSlides = 1, globalSettings = null) {
  if (slide.showFrameLabel === false) return '';
  if (globalSettings?.globalShowFrameLabel === false && slide.showFrameLabel !== true && !slide.frameLabel) return '';

  if (slide.frameLabel && slide.frameLabel.trim()) return slide.frameLabel.trim();

  const format = globalSettings?.globalFrameFormat || 'frame';
  if ((format === 'none' || format === 'hidden') && !slide.frameLabel && slide.showFrameLabel !== true) return '';

  const prefix = (globalSettings?.globalFramePrefix || 'FRAME').trim() || 'FRAME';
  const padIndex = String(slideIndex + 1).padStart(2, '0');
  const padTotal = String(Math.max(1, totalSlides || 1)).padStart(2, '0');

  switch (format) {
    case 'count': return `${padIndex} / ${padTotal}`;
    case 'slide': return `SLIDE ${padIndex}`;
    case 'news': return `NEWS #${padIndex}`;
    case 'step': return `STEP ${padIndex}`;
    case 'prefix': return `${prefix} ${padIndex}`;
    case 'none':
    case 'hidden': return '';
    case 'frame':
    default: return `FRAME ${padIndex}`;
  }
}

function resolveHeadlineFont(fontName) {
  switch (fontName) {
    case 'Archivo Black': return '"Archivo Black", Anton, sans-serif';
    case 'Space Mono': return '"Space Mono", monospace, sans-serif';
    case 'Inter': return '"Inter", sans-serif';
    case 'Anton':
    default: return 'Anton, "Archivo Black", sans-serif';
  }
}

function drawWatermark(ctx, slide, globalSettings, theme) {
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
  } else if (position === 'under_header') {
    x = CANVAS_SIZE - PADDING - pillW;
    y = PADDING + IMAGE_PANEL_HEIGHT + 14;
  }

  if (style === 'pill') {
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
    ctx.fillStyle = theme.headlineColor || '#FFFFFF';
    ctx.textAlign = (position === 'top_right' || position === 'bottom_right' || position === 'under_header') ? 'right' : 'left';
    ctx.textBaseline = 'top';
    const tx = ctx.textAlign === 'right' ? (CANVAS_SIZE - PADDING) : PADDING;
    ctx.fillText(text, tx, y + 6);
  }

  ctx.restore();
}

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
 * Loads an image from URL, Base64 data URL, or file path in Node.js
 */
export async function loadServerImage(src) {
  if (!src) return null;
  try {
    if (typeof src !== 'string') return null;

    if (src.startsWith('data:image/')) {
      const base64Data = src.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      return await loadImage(buffer);
    }

    if (src.startsWith('http://') || src.startsWith('https://')) {
      const res = await fetch(src);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      return await loadImage(Buffer.from(arrayBuffer));
    }

    if (fs.existsSync(src)) {
      const buffer = fs.readFileSync(src);
      return await loadImage(buffer);
    }

    return null;
  } catch (err) {
    console.warn('Failed to load image:', src, err.message);
    return null;
  }
}

/**
 * Main serverless canvas renderer for a single slide.
 * Returns Canvas instance (call .toBuffer('image/png') or .toDataURL()).
 */
export async function renderSlideServer(slide, slideIndex = 0, globalSettings = null, totalSlides = 1) {
  const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  const ctx = canvas.getContext('2d');

  const theme = resolveSlideTheme(slide, globalSettings, slideIndex, totalSlides);
  const templateId = slide.template || slide.templateId || globalSettings?.globalTemplateId || 'classic_studio';

  drawBackground(ctx, theme);
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  // Load images
  const rawImages = slide.images && slide.images.length > 0
    ? slide.images
    : (slide.image ? [{ url: slide.image, fit: slide.fit || 'cover', focal: slide.focal != null ? slide.focal : 50 }] : []);

  const loadedImages = await Promise.all(
    rawImages.map(async (slot) => {
      const src = typeof slot === 'string' ? slot : slot?.url;
      if (!src) return null;
      return await loadServerImage(src);
    })
  );
  const img = loadedImages[0] || null;

  const makeSlotProxy = (idx) => ({
    ...slide,
    fit: rawImages[idx]?.fit || slide.fit || 'cover',
    focal: rawImages[idx]?.focal != null ? rawImages[idx].focal : (slide.focal != null ? slide.focal : 50),
  });

  const maxContentWidth = CANVAS_SIZE - PADDING * 2;
  const frameText = resolveFrameLabel(slide, slideIndex, totalSlides, globalSettings);
  const showAccentRule = globalSettings?.globalShowAccentRule !== false;
  const activeFontName = slide.fontFamily || slide.fontChoice || globalSettings?.globalFontChoice || 'Anton';
  const fontFam = resolveHeadlineFont(activeFontName);
  const rawHeadline = String(slide.headline || '').trim();

  let subFontSize = 36;
  if (globalSettings?.globalSubtextSize === 'compact') subFontSize = 30;
  if (globalSettings?.globalSubtextSize === 'large') subFontSize = 42;

  // TEMPLATE 1: CLASSIC STUDIO
  if (templateId === 'classic_studio') {
    let curY = PADDING;

    drawImagePanel(ctx, slide, img, PADDING, curY, maxContentWidth, IMAGE_PANEL_HEIGHT, theme, globalSettings?.globalImageFit);
    curY += IMAGE_PANEL_HEIGHT + 34;

    if (frameText) {
      ctx.fillStyle = theme.accentColor;
      ctx.font = '700 28px "Space Mono", monospace, sans-serif';
      drawLetterSpaced(ctx, frameText, PADDING, curY, 6);
      curY += 40;
    }

    if (showAccentRule) {
      ctx.fillStyle = theme.accentColor;
      drawRoundedRectPath(ctx, PADDING, curY, 60, 4, 2);
      ctx.fill();
      curY += 4 + 36;
    } else {
      curY += frameText ? 16 : 8;
    }

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

    ctx.fillStyle = theme.headlineColor || '#FFFFFF';
    ctx.font = `${headFontSize}px ${fontFam}`;
    let hy = headTop;
    for (const line of headLines) {
      ctx.fillText(line, PADDING, hy);
      hy += headLineHeight;
    }

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

  // TEMPLATE 2: HEADLINE FIRST
  else if (templateId === 'headline_first') {
    let curY = PADDING;

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

    const imgHeight = 360;
    drawImagePanel(ctx, slide, img, PADDING, curY, maxContentWidth, imgHeight, theme, globalSettings?.globalImageFit);
    curY += imgHeight + 24;

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

  // TEMPLATE 3: CINEMATIC FULL-BLEED HERO
  else if (templateId === 'hero_fullbleed') {
    drawImagePanel(ctx, slide, img, 0, 0, CANVAS_SIZE, CANVAS_SIZE, theme, 'cover', 0);

    const scrim = ctx.createLinearGradient(0, 0, 0, CANVAS_SIZE);
    scrim.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    scrim.addColorStop(0.4, 'rgba(0, 0, 0, 0.25)');
    scrim.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
    scrim.addColorStop(1, 'rgba(0, 0, 0, 0.96)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const cardX = 48;
    const cardY = 510;
    const cardW = CANVAS_SIZE - cardX * 2;
    const cardH = CANVAS_SIZE - cardY - 48;
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

  // TEMPLATE 4: EDITORIAL SPLIT
  else if (templateId === 'editorial_split') {
    let curY = PADDING;

    drawImagePanel(ctx, slide, img, PADDING, curY, maxContentWidth, 370, theme, globalSettings?.globalImageFit, 8);
    curY += 370 + 30;

    if (frameText) {
      ctx.fillStyle = theme.accentColor;
      ctx.font = '700 24px "Space Mono", monospace, sans-serif';
      drawLetterSpaced(ctx, `— ${frameText} —`, PADDING, curY, 4);
      curY += 38;
    }

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

  // TEMPLATE 5: CARD FRAME
  else if (templateId === 'card_frame') {
    const framePad = 40;
    const innerW = CANVAS_SIZE - framePad * 2;
    const innerH = CANVAS_SIZE - framePad * 2;

    ctx.save();
    drawRoundedRectPath(ctx, framePad, framePad, innerW, innerH, 20);
    ctx.strokeStyle = theme.accentColor || '#CDFF3C';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    let curY = framePad + 36;
    const contentW = innerW - 72;
    const contentX = framePad + 36;

    drawImagePanel(ctx, slide, img, contentX, curY, contentW, 370, theme, globalSettings?.globalImageFit, 14);
    curY += 370 + 30;

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

  // TEMPLATE 6: MINIMAL QUOTE
  else if (templateId === 'minimal_quote') {
    let curY = PADDING;

    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = theme.accentColor || '#CDFF3C';
    ctx.font = '900 240px Anton, sans-serif';
    ctx.fillText('“', PADDING - 20, PADDING - 40);
    ctx.restore();

    if (frameText) {
      ctx.fillStyle = theme.accentColor;
      ctx.font = '700 26px "Space Mono", monospace, sans-serif';
      drawLetterSpaced(ctx, frameText, PADDING, curY, 6);
      curY += 40;
    }

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

  // LAYOUT OVERRIDES (split_image, text_only, dual_image, collage_3)
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

  const creditText = (
    (slide.images?.length > 0 ? slide.images.map(i => i?.credit).filter(Boolean).join(', ') : '') ||
    slide.credit || globalSettings?.globalCredit || ''
  );

  if (creditText && creditText.trim() && creditText.trim() !== 'AI Generated' && creditText.trim() !== 'None') {
    ctx.fillStyle = theme.creditColor || '#666666';
    ctx.font = '400 20px Inter, sans-serif';
    ctx.fillText('Img: ' + creditText.trim(), PADDING, CANVAS_SIZE - PADDING - 24);
  }

  drawWatermark(ctx, slide, globalSettings, theme);

  return canvas;
}
