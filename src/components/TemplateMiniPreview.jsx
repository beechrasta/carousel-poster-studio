import React, { useMemo, useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  wrapText,
  CANVAS_SIZE,
  PADDING,
  IMAGE_PANEL_HEIGHT,
} from '../utils/canvasRenderer';

/**
 * TemplateMiniPreview
 * ---------------------------------------------------------------------------
 * A pixel-faithful, scaled down replica of the 1080 x 1080 poster composition.
 *
 * It is built inside a fixed 1080 x 1080 stage (so every offset matches
 * canvasRenderer exactly) and then scaled down with a container query unit,
 * which means the card previews the real layout instead of a generic mock.
 */

const CONTENT_W = CANVAS_SIZE - PADDING * 2; // 940
const BOTTOM = CANVAS_SIZE - PADDING; // 1010

const FONT_STACKS = {
  Anton: "Anton, 'Archivo Black', 'Arial Narrow', sans-serif",
  'Archivo Black': "'Archivo Black', Anton, sans-serif",
  Montserrat: "Montserrat, 'Archivo Black', sans-serif",
  'Space Mono': "'Space Mono', monospace, sans-serif",
  Inter: 'Inter, sans-serif',
};

const MONO = "'Space Mono', monospace, sans-serif";

/** Watches web font loading so measurement never happens with fallback metrics. */
function useFontsLoaded() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const done = () => { if (!cancelled) setLoaded(true); };
    if (typeof document !== 'undefined' && document.fonts) {
      Promise.all([
        document.fonts.load('148px Anton'),
        document.fonts.load('148px "Archivo Black"'),
        document.fonts.load('900 148px Montserrat'),
      ]).then(done, done);
    } else {
      done();
    }
    return () => { cancelled = true; };
  }, []);
  return loaded;
}

/** Memoised text measurer that mirrors the canvas font string. */
function useMeasurer(enabled) {
  return useMemo(() => {
    const ctx = document.createElement('canvas').getContext('2d');
    return (text, size, fontStack = FONT_STACKS.Anton, maxWidth = CONTENT_W) => {
      if (!text) return [];
      ctx.font = `${size}px ${fontStack}`;
      return wrapText(ctx, text, maxWidth);
    };
  }, [enabled]);
}

/**
 * Tracks the preview width and derives the poster scale factor (1080 -> card).
 * Measured in JS rather than CSS because transform: scale() only takes a
 * plain number, so it cannot be expressed as a length ratio.
 */
function useStageScale() {
  const ref = useRef(null);
  const [scale, setScale] = useState(0.3);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / CANVAS_SIZE);
    };
    update();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, scale];
}

/* -------------------------------------------------------------------------- */
/* Primitives                                                                  */
/* -------------------------------------------------------------------------- */

function Photo({ x, y, w, h, r = 12, light = false, faint = false }) {
  return (
    <div
      className={`tpl-photo${faint ? ' tpl-photo-faint' : ''}`}
      style={{
        left: x, top: y, width: w, height: h, borderRadius: r,
        background: light ? '#E5E7EB' : '#161616',
      }}
    >
      <div
        className="tpl-photo-inner"
        style={{ borderColor: light ? '#D1D5DB' : '#323232' }}
      />
      <div className="tpl-photo-label" style={{ color: light ? '#9CA3AF' : '#5A5A5A' }}>
        PHOTO
      </div>
    </div>
  );
}

function FrameTag({ x, y, text, accent, size = 28, spacing = 6, color }) {
  if (!text) return null;
  return (
    <div
      className="tpl-tag"
      style={{
        left: x, top: y,
        fontSize: size, letterSpacing: spacing,
        color: color || accent,
      }}
    >
      {text}
    </div>
  );
}

function AccentRule({ x, y, w = 60, accent, h = 4 }) {
  return <div className="tpl-rule" style={{ left: x, top: y, width: w, height: h, background: accent }} />;
}

function Headline({ x, y, lines, size, color, fontStack }) {
  const lh = size * 0.98;
  return (
    <div className="tpl-headline" style={{ left: x, top: y, color, fontFamily: fontStack }}>
      {lines.map((line, i) => (
        <div key={i} style={{ fontSize: size, lineHeight: `${lh}px`, height: lh }}>
          {line}
        </div>
      ))}
    </div>
  );
}

function Body({ x, y, lines, size, color, maxLines = 5 }) {
  const lh = size * 1.34;
  const shown = lines.slice(0, maxLines);
  return (
    <div className="tpl-body" style={{ left: x, top: y, color, fontSize: size, lineHeight: `${lh}px` }}>
      {shown.map((line, i) => (
        <div key={i} style={{ height: lh }}>{line}</div>
      ))}
    </div>
  );
}

/**
 * Shrinks a headline from `start` until it fits within `maxLines` and inside
 * the remaining vertical budget, exactly like the canvas auto-shrink loops.
 */
function fitHeadline(measure, text, fontStack, start, opts) {
  const {
    maxWidth = CONTENT_W,
    maxLines = 4,
    top = 0,
    reservedBelow = 0,
    min = 50,
    step = 4,
  } = opts || {};

  let size = start;
  let lines = measure(text, size, fontStack, maxWidth);
  while (size > min) {
    lines = measure(text, size, fontStack, maxWidth);
    const needed = top + lines.length * size * 0.98 + reservedBelow;
    if (lines.length <= maxLines && needed <= BOTTOM) break;
    size -= step;
  }
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s+$/, '') + '…';
  }
  return { size, lines };
}

/* -------------------------------------------------------------------------- */
/* Frame label + headline casing (mirror the renderer's formatters)           */
/* -------------------------------------------------------------------------- */

function applyCase(text, mode) {
  if (!text) return '';
  if (mode === 'uppercase') return text.toUpperCase();
  if (mode === 'lowercase') return text.toLowerCase();
  if (mode === 'titlecase') {
    return text.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
  }
  return text;
}

function frameLabel(deck, index, total, prefix = 'FRAME') {
  const fmt = deck.globalFrameFormat || 'frame';
  if (fmt === 'none' || fmt === 'hidden') return '';
  const pad = String(index + 1).padStart(2, '0');
  const padTotal = String(Math.max(1, total)).padStart(2, '0');
  switch (fmt) {
    case 'count': return `${pad} / ${padTotal}`;
    case 'slide': return `SLIDE ${pad}`;
    case 'news': return `NEWS #${pad}`;
    case 'step': return `STEP ${pad}`;
    case 'prefix': return `${(deck.globalFramePrefix || prefix).trim() || prefix} ${pad}`;
    default: return `FRAME ${pad}`;
  }
}

/* -------------------------------------------------------------------------- */
/* Main                                                                        */
/* -------------------------------------------------------------------------- */

export default function TemplateMiniPreview({ template }) {
  const fontsLoaded = useFontsLoaded();
  const measure = useMeasurer(fontsLoaded);
  const [stageRef, stageScale] = useStageScale();

  const theme = template.theme;
  const deck = template.deckSettings || {};
  const slide = template.slide;
  const total = template.totalSlides || 1;

  const fontStack = FONT_STACKS[template.fontChoice] || FONT_STACKS.Anton;
  const isLight = theme.id === 'clean_light';
  const subBase = deck.globalSubtextSize === 'compact' ? 30 : deck.globalSubtextSize === 'large' ? 42 : 36;
  const showRule = deck.globalShowAccentRule !== false;
  const headline = applyCase(template.headline || '', deck.globalHeadlineCase || 'normal');
  const subtext = slide?.subtext || '';
  const tag = frameLabel(deck, 0, total, 'FRAME');
  const templateId = template.templateId;

  const bg = theme.bgType === 'gradient' && theme.bgGradient
    ? `linear-gradient(${theme.bgGradient.angle || 135}deg, ${theme.bgGradient.from}, ${theme.bgGradient.to})`
    : theme.bgColor;

  const accent = theme.accentColor;
  const headColor = theme.headlineColor;
  const bodyColor = theme.subtextColor;

  const bodyLines = measure(subtext, subBase, FONT_STACKS.Inter);
  let subSize = subBase;
  while (bodyLines.length > 5 && subSize > 24) {
    subSize -= 2;
  }
  const totalSubH = subtext ? bodyLines.length * subSize * 1.34 : 0;

  /* ---- 1. Classic Studio ------------------------------------------------ */
  const classic = () => {
    let y = PADDING;
    y += IMAGE_PANEL_HEIGHT + 34;
    let tagBottom = y;
    if (tag) y += 40;
    if (showRule) { y += 4 + 36; } else { y += tag ? 16 : 8; }
    const gap = subtext ? 26 : 0;
    const { size, lines } = fitHeadline(measure, headline, fontStack, 148, {
      maxLines: 4, top: y, reservedBelow: gap + totalSubH,
    });
    return (
      <>
        <Photo x={PADDING} y={PADDING} w={CONTENT_W} h={IMAGE_PANEL_HEIGHT} light={isLight} />
        <FrameTag x={PADDING} y={tagBottom} text={tag} accent={accent} />
        {showRule && <AccentRule x={PADDING} y={tagBottom + 40} accent={accent} />}
        <Headline x={PADDING} y={y} lines={lines} size={size} color={headColor} fontStack={fontStack} />
        {subtext && (
          <Body x={PADDING} y={y + lines.length * size * 0.98 + gap} lines={bodyLines} size={subSize} color={bodyColor} />
        )}
      </>
    );
  };

  /* ---- 2. Headline First ------------------------------------------------ */
  const headlineFirst = () => {
    let y = PADDING;
    let tagBottom = y;
    if (tag) y += 36;
    let ruleY = -1;
    if (showRule) { ruleY = y; y += 4 + 20; }
    const { size, lines } = fitHeadline(measure, headline, fontStack, 120, {
      maxLines: 3, top: y, reservedBelow: 24 + 360 + 24,
    });
    y += lines.length * size * 0.98 + 24;
    return (
      <>
        <FrameTag x={PADDING} y={tagBottom} text={tag} accent={accent} size={26} />
        {showRule && <AccentRule x={PADDING} y={ruleY} accent={accent} />}
        <Headline x={PADDING} y={y - lines.length * size * 0.98} lines={lines} size={size} color={headColor} fontStack={fontStack} />
        <Photo x={PADDING} y={y} w={CONTENT_W} h={360} light={isLight} />
        {subtext && <Body x={PADDING} y={y + 360 + 24} lines={bodyLines} size={subSize} color={bodyColor} maxLines={3} />}
      </>
    );
  };

  /* ---- 3. Cinematic Full Bleed ----------------------------------------- */
  const heroFullBleed = () => {
    const cardX = 48, cardY = 510;
    const cardW = CANVAS_SIZE - cardX * 2;
    const cardH = CANVAS_SIZE - cardY - 48;
    const pad = 36;
    const innerW = cardW - pad * 2;
    let y = cardY + pad;
    let tagBottom = y;
    if (tag) y += 36;
    let ruleY = -1;
    if (showRule) { ruleY = y; y += 4 + 20; }
    const { size, lines } = fitHeadline(measure, headline, fontStack, 110, {
      maxWidth: innerW, maxLines: 3, top: y, reservedBelow: 18 + subSize * 1.32 * 3,
    });
    return (
      <>
        <Photo x={0} y={0} w={CANVAS_SIZE} h={CANVAS_SIZE} r={0} light={isLight} faint />
        <div className="tpl-scrim" />
        <div
          className="tpl-glass-card"
          style={{ left: cardX, top: cardY, width: cardW, height: cardH, borderColor: accent }}
        />
        <FrameTag x={cardX + pad} y={tagBottom} text={tag} accent={accent} size={26} />
        {showRule && <AccentRule x={cardX + pad} y={ruleY} accent={accent} />}
        <Headline x={cardX + pad} y={y} lines={lines} size={size} color={headColor} fontStack={fontStack} />
        {subtext && (
          <Body
            x={cardX + pad}
            y={y + lines.length * size * 0.98 + 18}
            lines={measure(subtext, subSize, FONT_STACKS.Inter, innerW)}
            size={subSize}
            color={bodyColor}
            maxLines={3}
          />
        )}
      </>
    );
  };

  /* ---- 4. Editorial Magazine ------------------------------------------- */
  const editorialSplit = () => {
    let y = PADDING;
    y += 370 + 30;
    let tagBottom = y;
    if (tag) y += 38;
    const { size, lines } = fitHeadline(measure, headline, fontStack, 130, {
      maxLines: 3, top: y, reservedBelow: 24 + subSize * 1.34 * 3,
    });
    const subY = y + lines.length * size * 0.98 + 24;
    return (
      <>
        <Photo x={PADDING} y={PADDING} w={CONTENT_W} h={370} r={8} light={isLight} />
        <FrameTag x={PADDING} y={tagBottom} text={tag ? `— ${tag} —` : ''} accent={accent} size={24} spacing={4} />
        <Headline x={PADDING} y={y} lines={lines} size={size} color={headColor} fontStack={fontStack} />
        {subtext && (
          <>
            <div className="tpl-bar" style={{ left: PADDING, top: subY, height: 80, background: accent }} />
            <Body
              x={PADDING + 20}
              y={subY}
              lines={measure(subtext, subSize, FONT_STACKS.Inter, CONTENT_W - 24)}
              size={subSize}
              color={bodyColor}
              maxLines={3}
            />
          </>
        )}
      </>
    );
  };

  /* ---- 5. Bordered Luxury Card ----------------------------------------- */
  const cardFrame = () => {
    const framePad = 40;
    const contentX = framePad + 36;
    const contentW = CANVAS_SIZE - framePad * 2 - 72;
    let y = framePad + 36;
    y += 370 + 30;
    let tagBottom = y;
    if (tag) y += 46;
    const { size, lines } = fitHeadline(measure, headline, fontStack, 120, {
      maxWidth: contentW, maxLines: 3, top: y, reservedBelow: 20 + subSize * 1.32 * 3,
    });
    return (
      <>
        <div
          className="tpl-frame-border"
          style={{ left: framePad, top: framePad, width: CANVAS_SIZE - framePad * 2, height: CANVAS_SIZE - framePad * 2, borderColor: accent }}
        />
        <Photo x={contentX} y={framePad + 36} w={contentW} h={370} r={14} light={isLight} />
        {tag && (
          <div className="tpl-pill" style={{ left: contentX, top: tagBottom, background: accent }}>
            <span style={{ color: isLight ? '#FFFFFF' : '#000000' }}>{tag}</span>
          </div>
        )}
        <Headline x={contentX} y={y} lines={lines} size={size} color={headColor} fontStack={fontStack} />
        {subtext && (
          <Body
            x={contentX}
            y={y + lines.length * size * 0.98 + 20}
            lines={measure(subtext, subSize, FONT_STACKS.Inter, contentW)}
            size={subSize}
            color={bodyColor}
            maxLines={3}
          />
        )}
      </>
    );
  };

  /* ---- 6. Minimal Typo Focus ------------------------------------------- */
  const minimalQuote = () => {
    let y = PADDING;
    let tagBottom = y;
    if (tag) y += 40;
    const photoSize = 340;
    const { size, lines } = fitHeadline(measure, headline, fontStack, 136, {
      maxLines: 3, top: y, reservedBelow: 36 + photoSize,
    });
    const bottomY = y + lines.length * size * 0.98 + 36;
    const rightX = PADDING + photoSize + 32;
    const rightW = CONTENT_W - photoSize - 32;
    return (
      <>
        <div className="tpl-quote" style={{ left: PADDING - 20, top: PADDING - 40, color: accent }}>&ldquo;</div>
        <FrameTag x={PADDING} y={tagBottom} text={tag} accent={accent} size={26} />
        <Headline x={PADDING} y={y} lines={lines} size={size} color={headColor} fontStack={fontStack} />
        <Photo x={PADDING} y={bottomY} w={photoSize} h={photoSize} r={16} light={isLight} />
        {subtext && (
          <>
            <AccentRule x={rightX} y={bottomY} w={40} accent={accent} />
            <Body
              x={rightX}
              y={bottomY + 22}
              lines={measure(subtext, subSize, FONT_STACKS.Inter, rightW)}
              size={subSize}
              color={bodyColor}
              maxLines={6}
            />
          </>
        )}
      </>
    );
  };

  const COMPOSERS = {
    classic_studio: classic,
    headline_first: headlineFirst,
    hero_fullbleed: heroFullBleed,
    editorial_split: editorialSplit,
    card_frame: cardFrame,
    minimal_quote: minimalQuote,
  };

  const compose = COMPOSERS[templateId] || classic;

  // Watermark pill (only the pill + top_left/bottom_right positions show in a thumb)
  const wmText = (deck.watermarkText || '').trim();
  const showWatermark = deck.watermarkEnabled && wmText && deck.watermarkStyle !== 'center_stamp';
  const wmTop = deck.watermarkPosition === 'top_right' || deck.watermarkPosition === 'top_left'
    ? PADDING + 12
    : CANVAS_SIZE - PADDING - 46;
  const wmLeft = deck.watermarkPosition === 'top_left' || deck.watermarkPosition === 'bottom_left'
    ? PADDING
    : undefined;
  const wmRight = wmLeft === undefined ? PADDING : undefined;

  return (
    <div className="template-card-preview" ref={stageRef} aria-hidden="true">
      <div className="tpl-stage" style={{ background: bg, transform: `scale(${stageScale})` }}>
        {compose()}

        {showWatermark && (
          <div
            className={`tpl-wm${deck.watermarkStyle === 'pill' ? ' tpl-wm-pill' : ''}`}
            style={{ top: wmTop, left: wmLeft, right: wmRight, color: headColor }}
          >
            <span style={{ color: deck.watermarkStyle === 'pill' ? accent : undefined }}>{wmText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
