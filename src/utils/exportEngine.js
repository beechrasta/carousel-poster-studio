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
 * Saves selected (or all) deck slides as 1080x1080 PNGs into a user-chosen folder.
 * Uses the File System Access API (showDirectoryPicker). Falls back to sequential
 * browser-download links if the API is unavailable.
 *
 * @param {Array}    slides         - All slide objects in the deck
 * @param {number[]|null} selectedIndices - Indices to export, or null to export all
 * @param {Object}   globalSettings - Project global settings
 * @param {Function} onProgress     - Progress callback ({ current, total, percent })
 */
export async function saveSlidesToFolder(
  slides,
  selectedIndices = null,
  globalSettings = null,
  onProgress = () => {}
) {
  const indices = selectedIndices ?? slides.map((_, i) => i);
  const total = indices.length;

  // --- Native File System Access API path ---
  if (typeof window.showDirectoryPicker === 'function') {
    let dirHandle;
    try {
      dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    } catch (err) {
      // User cancelled the picker
      if (err.name === 'AbortError') return { cancelled: true };
      throw err;
    }

    for (let n = 0; n < total; n++) {
      const i = indices[n];
      onProgress({ current: n + 1, total, percent: Math.round(((n + 0.5) / total) * 100) });

      const canvas = await renderSlideToCanvas(slides[i], i, null, globalSettings, slides.length);
      const blob = await canvasToBlob(canvas);
      const filename = `slide-${String(i + 1).padStart(2, '0')}.png`;

      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      onProgress({ current: n + 1, total, percent: Math.round(((n + 1) / total) * 100) });
    }

    return { saved: total, cancelled: false };
  }

  // --- Fallback: sequential browser downloads ---
  for (let n = 0; n < total; n++) {
    const i = indices[n];
    onProgress({ current: n + 1, total, percent: Math.round(((n + 0.5) / total) * 100) });
    const canvas = await renderSlideToCanvas(slides[i], i, null, globalSettings, slides.length);
    const blob = await canvasToBlob(canvas);
    const filename = `slide-${String(i + 1).padStart(2, '0')}.png`;
    downloadBlob(blob, filename);
    // Small delay between downloads so browsers don't block them
    if (n < total - 1) await new Promise(r => setTimeout(r, 400));
    onProgress({ current: n + 1, total, percent: Math.round(((n + 1) / total) * 100) });
  }

  return { saved: total, cancelled: false };
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
