#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { renderSlideServer } from '../api/lib/serverRenderer.js';

async function main() {
  const args = process.argv.slice(2);
  let filePath = '';
  let outDir = './output-posters';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' || args[i] === '-f') {
      filePath = args[++i];
    } else if (args[i] === '--out' || args[i] === '-o') {
      outDir = args[++i];
    }
  }

  if (!filePath) {
    console.log(`
Carousel Poster Studio CLI 🎨⚡

Usage:
  node scripts/generate.js --file <path-to-json-or-yaml> [--out <output-directory>]

Example:
  node scripts/generate.js --file ./examples/carousel.json --out ./dist-posters
    `);
    process.exit(0);
  }

  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    console.error(`Error: File not found at ${absPath}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(absPath, 'utf8');
  let data;
  try {
    data = JSON.parse(rawContent);
  } catch (err) {
    console.error('Error parsing JSON:', err.message);
    process.exit(1);
  }

  const slides = Array.isArray(data.slides) ? data.slides : (data.slide ? [data.slide] : [data]);
  const globalSettings = data.globalSettings || {};

  const absOut = path.resolve(outDir);
  if (!fs.existsSync(absOut)) {
    fs.mkdirSync(absOut, { recursive: true });
  }

  console.log(`🚀 Rendering ${slides.length} slide(s) to ${absOut}...`);

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const num = String(i + 1).padStart(2, '0');
    console.log(`  [${i + 1}/${slides.length}] Rendering Slide ${num}: "${slide.headline || 'Untitled'}"...`);

    const canvas = await renderSlideServer(slide, i, globalSettings, slides.length);
    const buffer = canvas.toBuffer('image/png');
    const outFileName = `slide-${num}.png`;
    const outFilePath = path.join(absOut, outFileName);

    fs.writeFileSync(outFilePath, buffer);
  }

  console.log(`✨ All done! Generated ${slides.length} posters in ${absOut}`);
}

main().catch(err => {
  console.error('CLI Error:', err);
  process.exit(1);
});
