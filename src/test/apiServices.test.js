import { describe, it, expect } from 'vitest';
import { 
  parseStoriesFromResponse, 
  extractStoriesHeuristic, 
  sanitizeNewsText, 
  SYSTEM_PROMPT 
} from '../utils/apiServices';

describe('API Services & Copy Parsing Engine', () => {
  it('contains the verbatim system prompt as specified in spec', () => {
    expect(SYSTEM_PROMPT).toContain('You write carousel-poster copy about AI and tech news.');
    expect(SYSTEM_PROMPT).toContain('HEADLINE: under 10 words, bold, funny, attention-grabbing.');
    expect(SYSTEM_PROMPT).toContain('SUBTEXT: 2-4 short lines that summarize the story with a joke, roast, or witty twist.');
    expect(SYSTEM_PROMPT).toContain('Tone: blunt, witty, internet-native, like a smart friend roasting tech news.');
  });

  it('accurately parses standard HEADLINE: and SUBTEXT: formatted response', () => {
    const rawLLMOutput = `
HEADLINE: OpenAI just killed its own model before launch
SUBTEXT: GPT-6.1 'Astra' got scrapped for being too deceptive in testing. The AI was literally too shady to ship, a day before DevDay.

HEADLINE: Nvidia wants to be the seatbelt of the AI world
SUBTEXT: New Open Agent Safety Platform, 100+ companies signed on, claims it would've stopped the Hugging Face breach.
    `;

    const parsed = parseStoriesFromResponse(rawLLMOutput);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].headline).toBe('OpenAI just killed its own model before launch');
    expect(parsed[0].subtext).toContain('Astra');
    expect(parsed[1].headline).toBe('Nvidia wants to be the seatbelt of the AI world');
  });

  it('handles edge case formatting with quotes and extra whitespace', () => {
    const rawLLMOutput = `
HEADLINE: "Congress finally discovered AI exists"
SUBTEXT: "Florida wants OpenAI in court, Sanders and AOC want to ban superintelligence."
    `;

    const parsed = parseStoriesFromResponse(rawLLMOutput);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].headline).toBe('Congress finally discovered AI exists');
    expect(parsed[0].subtext).toBe('Florida wants OpenAI in court, Sanders and AOC want to ban superintelligence.');
  });

  it('sanitizes long meta tracking URLs and redirects', () => {
    const rawWithLinks = `Trump denies offering Iran sanctions relief [Reuters](https://l.meta.ai/?u=https%3A%2F%2Fwww.reuters.com&h=xyz)`;
    const cleaned = sanitizeNewsText(rawWithLinks);
    expect(cleaned).toContain('(Reuters)');
    expect(cleaned).not.toContain('https://l.meta.ai');
  });

  it('correctly extracts individual slides from multi-section news dump via heuristic parser', () => {
    const multiStoryDump = `
World
Trump denies offering Iran sanctions relief — after Axios/CNN reported he was willing to ease sanctions for nuclear concessions, Trump posted "I offered them NOTHING" on Truth Social. [Reuters](https://l.meta.ai/?u=...)
US forces exit Iraq by Wednesday — ending 20+ years of deployment; Iran-backed groups are calling it a historic victory. [Reuters](https://l.meta.ai/?u=...)

US domestic
Taxpayer-funded "final battle" ad — Trump aired a government-funded TV spot during NFL games warning of a "final battle". [USA Today](https://l.meta.ai/?u=...)

India
J&K Assembly passes statehood resolution amid BJP walkout. [Economic Times](https://l.meta.ai/?u=...)
Rahul Gandhi alleges EC deleted 727 of 728 voters in Delhi's Bela Estate. [Economic Times](https://l.meta.ai/?u=...)
    `;

    const extracted = extractStoriesHeuristic(multiStoryDump);
    expect(extracted.length).toBeGreaterThanOrEqual(5);
    expect(extracted[0].headline).toContain('Trump denies offering Iran sanctions relief');
    expect(extracted[0].subtext).toContain('Truth Social');
    expect(extracted[1].headline).toContain('US forces exit Iraq');
    expect(extracted[2].headline).toContain('Taxpayer-funded');
    expect(extracted[3].headline).toContain('J&K Assembly passes statehood resolution');
    expect(extracted[4].headline).toContain('Rahul Gandhi alleges EC deleted');
  });
});
