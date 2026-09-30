import { describe, it, expect } from 'vitest';
import {
  PRESET_TEMPLATES,
  buildTemplateSlides,
  buildTemplateDeckSettings,
  getTemplateSlideCount,
} from '../utils/presetTemplates';
import { POSTER_THEMES, POSTER_LAYOUT_TEMPLATES } from '../utils/canvasRenderer';

const DEFAULTS = {
  themeMode: 'individual',
  globalThemeId: 'clean_light',
  globalTemplateId: 'classic_studio',
  globalFontChoice: 'Anton',
  globalHeadlineCase: 'normal',
};

describe('Featured Poster Templates', () => {
  it('every template references a real theme and a real poster composition', () => {
    for (const tpl of PRESET_TEMPLATES) {
      expect(POSTER_THEMES[tpl.themeId], `${tpl.id} themeId`).toBeDefined();
      expect(POSTER_LAYOUT_TEMPLATES[tpl.templateId], `${tpl.id} templateId`).toBeDefined();
    }
  });

  it('template ids are unique', () => {
    const ids = PRESET_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every template ships at least one slide of non-empty copy', () => {
    for (const tpl of PRESET_TEMPLATES) {
      expect(tpl.slides.length, `${tpl.id} slide count`).toBeGreaterThan(0);
      for (const slide of tpl.slides) {
        expect(slide.headline.trim().length).toBeGreaterThan(0);
        expect(slide.subtext.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('getTemplateSlideCount stays derived from the slide data', () => {
    for (const tpl of PRESET_TEMPLATES) {
      expect(getTemplateSlideCount(tpl)).toBe(tpl.slides.length);
    }
  });

  it('buildTemplateSlides assigns unique ids and inherits template theme + font', () => {
    for (const tpl of PRESET_TEMPLATES) {
      const a = buildTemplateSlides(tpl);
      const b = buildTemplateSlides(tpl);

      expect(a.length).toBe(tpl.slides.length);
      // Two decks from the same template must not collide on slide ids
      expect(new Set([...a, ...b].map((s) => s.id)).size).toBe(a.length * 2);

      for (const slide of a) {
        expect(slide.themeId).toBe(tpl.themeId);
        expect(slide.fontChoice).toBe(tpl.fontChoice);
        expect(slide.layout).toBe('full_bleed');
        expect(slide.images).toEqual([]);
      }
    }
  });

  it('buildTemplateSlides accepts an injected id factory', () => {
    let n = 0;
    const slides = buildTemplateSlides(PRESET_TEMPLATES[0], () => `custom_${++n}`);
    expect(slides[0].id).toBe('custom_1');
    expect(slides[1].id).toBe('custom_2');
  });

  it('buildTemplateDeckSettings applies theme, composition and typography recipe', () => {
    const tpl = PRESET_TEMPLATES.find((t) => t.id === 'tpl_cyber_roast');
    const settings = buildTemplateDeckSettings(tpl, DEFAULTS);

    expect(settings.themeMode).toBe('uniform');
    expect(settings.globalThemeId).toBe(tpl.themeId);
    expect(settings.globalTemplateId).toBe(tpl.templateId);
    expect(settings.globalFontChoice).toBe(tpl.fontChoice);
    expect(settings.globalFrameFormat).toBe(tpl.deckSettings.globalFrameFormat);
    expect(settings.watermarkEnabled).toBe(true);
  });

  it('buildTemplateDeckSettings never mutates the passed defaults', () => {
    const snapshot = { ...DEFAULTS };
    for (const tpl of PRESET_TEMPLATES) {
      buildTemplateDeckSettings(tpl, DEFAULTS);
    }
    expect(DEFAULTS).toEqual(snapshot);
  });

  it('covers all six poster compositions across the showcase', () => {
    const used = new Set(PRESET_TEMPLATES.map((t) => t.templateId));
    expect(used.size).toBe(Object.keys(POSTER_LAYOUT_TEMPLATES).length);
  });
});
