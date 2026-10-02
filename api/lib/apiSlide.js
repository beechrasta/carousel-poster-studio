/**
 * API-level frame-label normalization (issue #1).
 *
 * The render API must never invent a header badge the caller didn't ask for:
 * an omitted, null, or blank `frameLabel` means "no badge".
 *
 * Explicit labels are always respected, and an explicit `showFrameLabel`
 * flag (true or false) is never overridden here.
 */
export function normalizeApiFrameLabel(slide) {
  if (!slide || typeof slide !== 'object') return slide;
  const label = slide.frameLabel;
  const hasLabel =
    typeof label === 'string' ? label.trim().length > 0 : label != null;
  if (hasLabel || slide.showFrameLabel === true) return slide;
  return { ...slide, showFrameLabel: false };
}
