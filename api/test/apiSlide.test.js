import { describe, it, expect } from 'vitest';
import { normalizeApiFrameLabel } from '../lib/apiSlide.js';

describe('normalizeApiFrameLabel (issue #1)', () => {
  it('hides the badge when frameLabel is omitted', () => {
    const out = normalizeApiFrameLabel({ headline: 'X' });
    expect(out.showFrameLabel).toBe(false);
  });

  it('hides the badge for empty, blank, or null labels', () => {
    expect(normalizeApiFrameLabel({ frameLabel: '' }).showFrameLabel).toBe(false);
    expect(normalizeApiFrameLabel({ frameLabel: '   ' }).showFrameLabel).toBe(false);
    expect(normalizeApiFrameLabel({ frameLabel: null }).showFrameLabel).toBe(false);
  });

  it('keeps explicit labels untouched', () => {
    const out = normalizeApiFrameLabel({ frameLabel: 'BREAKING' });
    expect(out.frameLabel).toBe('BREAKING');
    expect('showFrameLabel' in out).toBe(false);
  });

  it('respects an explicit showFrameLabel=true (auto label allowed)', () => {
    const out = normalizeApiFrameLabel({ showFrameLabel: true });
    expect(out.showFrameLabel).toBe(true);
  });

  it('does not mutate the input slide', () => {
    const slide = { headline: 'X' };
    normalizeApiFrameLabel(slide);
    expect('showFrameLabel' in slide).toBe(false);
  });
});
