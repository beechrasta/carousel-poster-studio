import JSZip from 'jszip';
import { renderSlideToCanvas } from './canvasRenderer';

/**
 * Converts a canvas element to a Blob.
 */
export function canvasToBlob(canvas, mimeType = 'image/png', quality = 1.0) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create canvas blob'));
      },
      mimeType,
      quality
    );
  });
}

/**
 * Triggers a browser download of a blob.
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 4000);
}

/**
 * Downloads a single slide as a 1080x1080 PNG.
 */
export async function downloadSlidePNG(slide, slideIndex, globalSettings = null, totalSlides = 1) {
  const canvas = await renderSlideToCanvas(slide, slideIndex, null, globalSettings, totalSlides);
  const blob = await canvasToBlob(canvas);
  const num = String(slideIndex + 1).padStart(2, '0');
  downloadBlob(blob, `slide-${num}.png`);
}

/**
 * Copies a single slide PNG directly to system clipboard.
 */
export async function copySlideToClipboard(slide, slideIndex, globalSettings = null, totalSlides = 1) {
  const canvas = await renderSlideToCanvas(slide, slideIndex, null, globalSettings, totalSlides);
  const blob = await canvasToBlob(canvas);
  
  if (navigator.clipboard && window.ClipboardItem) {
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    return true;
  } else {
    throw new Error('Clipboard API not supported in this browser environment');
  }
}

/**
 * Exports all deck slides as a ZIP archive of 1080x1080 PNGs.
 * @param {Array} slides - Array of slide objects
 * @param {Function} onProgress - Progress callback ({ current, total, percent })
 * @param {Object} [globalSettings] - Optional global project settings
 */
export async function downloadDeckAsZIP(slides, onProgress = () => {}, globalSettings = null) {
  const zip = new JSZip();
  const total = slides.length;

  for (let i = 0; i < total; i++) {
    onProgress({ current: i + 1, total, percent: Math.round(((i + 0.5) / total) * 100) });
    const canvas = await renderSlideToCanvas(slides[i], i, null, globalSettings, total);
    const blob = await canvasToBlob(canvas);
    const filename = `slide-${String(i + 1).padStart(2, '0')}.png`;
    zip.file(filename, blob);
    onProgress({ current: i + 1, total, percent: Math.round(((i + 1) / total) * 100) });
  }

  // Also include project JSON backup inside the ZIP
  const projectBackup = {
    appName: 'Carousel Poster Studio',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    globalSettings,
    slides,
  };
  zip.file('project-data.json', JSON.stringify(projectBackup, null, 2));

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  downloadBlob(zipBlob, 'carousel-posters.zip');
}

/**
 * Exports project as portable JSON file.
 */
export function exportProjectJSON(state) {
  const payload = {
    appName: 'Carousel Poster Studio',
    version: '1.0.0',
    savedAt: new Date().toISOString(),
    globalSettings: state.globalSettings,
    slides: state.slides,
    current: state.current,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'carousel-poster-project.json');
}

/**
 * Converts File or Blob to DataURL.
 */
export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Fetches an image URL and converts it to a DataURL.
 */
export async function urlToDataURL(url) {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch image`);
  }
  const blob = await res.blob();
  if (!blob.type.startsWith('image/')) {
    throw new Error(`URL returned ${blob.type || 'non-image content'}, expected image`);
  }
  return fileToDataURL(blob);
}
