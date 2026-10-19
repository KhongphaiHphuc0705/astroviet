import type { NatureTone } from "../../model/labels";

/**
 * Standard SVG stroke color classes according to aspect nature tone.
 * Maps to Tailwind CSS utility tokens:
 * - Harmonious: stroke-accent-secondary
 * - Tense: stroke-accent-primary
 * - Neutral: stroke-secondary
 * - Unknown: stroke-muted
 */
export const TONE_STROKE_CLASSES: Record<NatureTone, string> = {
  harmonious: "stroke-accent-secondary",
  tense: "stroke-accent-primary",
  neutral: "stroke-secondary",
  unknown: "stroke-muted",
};

/**
 * Standard SVG fill color classes according to aspect nature tone (for dots / endpoints).
 * Maps to Tailwind CSS utility tokens:
 * - Harmonious: fill-accent-secondary
 * - Tense: fill-accent-primary
 * - Neutral: fill-secondary
 * - Unknown: fill-muted
 */
export const TONE_FILL_CLASSES: Record<NatureTone, string> = {
  harmonious: "fill-accent-secondary",
  tense: "fill-accent-primary",
  neutral: "fill-secondary",
  unknown: "fill-muted",
};
