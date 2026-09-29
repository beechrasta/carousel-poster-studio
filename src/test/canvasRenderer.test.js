import { describe, it, expect } from 'vitest';
import { 
  wrapText, 
  renderSlideToCanvas, 
  resolveSlideTheme, 
  resolveFrameLabel,
  POSTER_THEMES,
  POSTER_LAYOUT_TEMPLATES, 
  CANVAS_SIZE, 
  PADDING 
} from '../utils/canvasRenderer';

describe('Canvas 2D Renderer & Typography Engine', () => {
  it('correctly calculates canvas dimensions and margins', () => {
    expect(CANVAS_SIZE).toBe(1080);
    expect(PADDING).toBe(70);
  });

  it('correctly word wraps long text based on max width constraint', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const sampleText = 'OpenAI just killed its own model before launch due to safety concerns';
    const lines = wrapText(ctx, sampleText, 250); // mock width gives 10px per character
    
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toBe(sampleText);
  });

  it('contains 7 distinct card themes including gradients and solid colors', () => {
    expect(Object.keys(POSTER_THEMES).length).toBe(7);
    expect(POSTER_THEMES.dark_lime.bgColor).toBe('#0B0B0B');
    expect(POSTER_THEMES.clean_light.bgColor).toBe('#F5F5F7');
    expect(POSTER_THEMES.neon_cyber.bgType).toBe('gradient');
    expect(POSTER_THEMES.midnight_slate.bgType).toBe('gradient');
    expect(POSTER_THEMES.sunset_blaze.bgType).toBe('gradient');
    expect(POSTER_THEMES.emerald_matrix.bgType).toBe('gradient');
    expect(POSTER_THEMES.mono_stark.bgType).toBe('solid');
  });

  it('contains 6 distinct poster design layout templates', () => {
    expect(Object.keys(POSTER_LAYOUT_TEMPLATES).length).toBe(6);
    expect(POSTER_LAYOUT_TEMPLATES.classic_studio.name).toBe('Classic Studio');
    expect(POSTER_LAYOUT_TEMPLATES.headline_first.name).toBe('Headline First');
    expect(POSTER_LAYOUT_TEMPLATES.hero_fullbleed.name).toBe('Cinematic Full-Bleed');
    expect(POSTER_LAYOUT_TEMPLATES.editorial_split.name).toBe('Editorial Magazine');
    expect(POSTER_LAYOUT_TEMPLATES.card_frame.name).toBe('Bordered Luxury Card');
    expect(POSTER_LAYOUT_TEMPLATES.minimal_quote.name).toBe('Minimal Typo Focus');
  });

  it('resolves theme with custom user overrides properly', () => {
    const slideWithCustom = {
      themeId: 'neon_cyber',
      customAccentColor: '#FFFF00',
      customHeadlineColor: '#00FF00',
    };
    const resolved = resolveSlideTheme(slideWithCustom);
    expect(resolved.accentColor).toBe('#FFFF00');
    expect(resolved.headlineColor).toBe('#00FF00');
    expect(resolved.bgType).toBe('gradient');
  });

  it('resolves uniform global theme mode across all slides', () => {
    const slide1 = { themeId: 'dark_lime' };
    const slide2 = { themeId: 'neon_cyber' };
    const globalSettings = {
      themeMode: 'uniform',
      globalThemeId: 'clean_light',
    };

    const res1 = resolveSlideTheme(slide1, globalSettings, 0);
    const res2 = resolveSlideTheme(slide2, globalSettings, 1);

    expect(res1.id).toBe('clean_light');
    expect(res2.id).toBe('clean_light');
    expect(res1.bgColor).toBe('#F5F5F7');
  });

  it('resolves random theme mode with seed variation', () => {
    const slide1 = {};
    const slide2 = {};
    const globalSettings = {
      themeMode: 'random',
      randomSeed: 42,
    };

    const res1 = resolveSlideTheme(slide1, globalSettings, 0);
    const res2 = resolveSlideTheme(slide2, globalSettings, 1);

    expect(res1).toBeDefined();
    expect(res2).toBeDefined();
    expect(res1.id).not.toBe(res2.id);
  });

  it('resolves alternating two-theme cycle mode', () => {
    const slide = {};
    const globalSettings = {
      themeMode: 'alternating',
      globalThemeId: 'dark_lime',
      secondaryThemeId: 'sunset_blaze',
    };

    const res0 = resolveSlideTheme(slide, globalSettings, 0);
    const res1 = resolveSlideTheme(slide, globalSettings, 1);
    const res2 = resolveSlideTheme(slide, globalSettings, 2);
    const res3 = resolveSlideTheme(slide, globalSettings, 3);

    expect(res0.id).toBe('dark_lime');
    expect(res1.id).toBe('sunset_blaze');
    expect(res2.id).toBe('dark_lime');
    expect(res3.id).toBe('sunset_blaze');
  });

  it('resolves rainbow flow mode across 7 themes', () => {
    const slide = {};
    const globalSettings = {
      themeMode: 'rainbow',
    };

    const res0 = resolveSlideTheme(slide, globalSettings, 0);
    const res1 = resolveSlideTheme(slide, globalSettings, 1);
    const res2 = resolveSlideTheme(slide, globalSettings, 2);

    expect(res0.id).toBe('dark_lime');
    expect(res1.id).toBe('clean_light');
    expect(res2.id).toBe('neon_cyber');
  });

  it('resolves frame label formats and optional hidden state correctly', () => {
    const slide = {};
    expect(resolveFrameLabel(slide, 0, 5, { globalFrameFormat: 'frame' })).toBe('FRAME 01');
    expect(resolveFrameLabel(slide, 2, 5, { globalFrameFormat: 'count' })).toBe('03 / 05');
    expect(resolveFrameLabel(slide, 1, 5, { globalFrameFormat: 'slide' })).toBe('SLIDE 02');
    expect(resolveFrameLabel(slide, 3, 5, { globalFrameFormat: 'news' })).toBe('NEWS #04');
    expect(resolveFrameLabel(slide, 0, 5, { globalFrameFormat: 'step' })).toBe('STEP 01');
    expect(resolveFrameLabel(slide, 0, 5, { globalFrameFormat: 'prefix', globalFramePrefix: 'TECH DROP' })).toBe('TECH DROP 01');
    expect(resolveFrameLabel(slide, 0, 5, { globalFrameFormat: 'hidden' })).toBe('');
    expect(resolveFrameLabel(slide, 0, 5, { globalFrameFormat: 'none' })).toBe('');
    expect(resolveFrameLabel(slide, 0, 5, { globalShowFrameLabel: false })).toBe('');
    expect(resolveFrameLabel({ showFrameLabel: false }, 0, 5, { globalFrameFormat: 'frame' })).toBe('');
    
    // Explicit slide override takes precedence
    expect(resolveFrameLabel({ frameLabel: 'EXCLUSIVE BREAKING' }, 0, 5, { globalFrameFormat: 'frame' })).toBe('EXCLUSIVE BREAKING');
  });

  it('renders across all 6 poster design layout templates without errors', async () => {
    const mockSlide = {
      id: 'test-slide-1',
      headline: 'Congress finally discovered AI exists',
      subtext: 'Everyone has a plan. None of them agree.',
      image: null,
      fit: 'cover',
      focal: 50,
      credit: 'Photo: Tech Wire',
      fontChoice: 'Anton',
      themeId: 'neon_cyber',
      watermarkText: '@testcreator',
      watermarkEnabled: true,
    };

    for (const tplId of Object.keys(POSTER_LAYOUT_TEMPLATES)) {
      const targetCanvas = document.createElement('canvas');
      const rendered = await renderSlideToCanvas(
        { ...mockSlide, templateId: tplId }, 
        0, 
        targetCanvas,
        { globalTemplateId: tplId }
      );
      expect(rendered).toBeDefined();
      expect(rendered.width).toBe(1080);
      expect(rendered.height).toBe(1080);
    }
  });
});
