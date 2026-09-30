#!/usr/bin/env node
/**
 * Renders the first slide of every featured poster template using the same
 * server-side canvas renderer the API / CLI uses. Handy for eyeballing the
 * template recipes without opening the studio.
 *
 * Usage: node scripts/render-presets.js [--out <dir>]
 */

import fs from 'fs';
import path from 'path';
import { renderSlideServer } from '../api/lib/serverRenderer.js';
import { PRESET_TEMPLATES, buildTemplateDeckSettings } from '../src/utils/presetTemplates.js';

const DEFAULT_GLOBALS = { themeMode: 'uniform', globalThemeId: 'clean_light', globalTemplateId: 'classic_studio' };

async function main() {
  const args = process.argv.slice(2);
  let outDir = './output-posters/presets';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out' || args[i] === '-o') outDir = args[++i];
  }

  const absOut = path.resolve(outDir);
  if (!fs.existsSync(absOut)) fs.mkdirSync(absOut, { recursive: true });

  for (const tpl of PRESET_TEMPLATES) {
    const globalSettings = buildTemplateDeckSettings(tpl, DEFAULT_GLOBALS);
    const total = tpl.slides.length;
    const canvas = await renderSlideServer(tpl.slides[0], 0, globalSettings, total);
    const file = path.join(absOut, `${tpl.id}.png`);
    fs.writeFileSync(file, canvas.toBuffer('image/png'));
    console.log(`  [${tpl.templateId.padEnd(15)}] ${tpl.name} -> ${path.relative(process.cwd(), file)}`);
  }

  console.log(`\nRendered ${PRESET_TEMPLATES.length} featured templates to ${absOut}`);
}

main().catch((err) => {
  console.error('Render error:', err);
  process.exit(1);
});
