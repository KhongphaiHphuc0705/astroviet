/**
 * Pure domain zoom logic for Chart Wheel on mobile / compact viewports.
 * Enforces zoom bounds (1× - 3× with 0.5× step) and percentage formatting.
 * Pure TypeScript: no React, DOM, or browser dependencies (Quality Gate G-M9-4).
 */

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 3;
export const ZOOM_STEP = 0.5;
export const DEFAULT_ZOOM = 1;

export function canZoomIn(zoom: number): boolean {
  return zoom < ZOOM_MAX;
}

export function canZoomOut(zoom: number): boolean {
  return zoom > ZOOM_MIN;
}

export function zoomIn(zoom: number): number {
  if (!canZoomIn(zoom)) {
    return zoom;
  }
  return Math.min(ZOOM_MAX, +(zoom + ZOOM_STEP).toFixed(1));
}

export function zoomOut(zoom: number): number {
  if (!canZoomOut(zoom)) {
    return zoom;
  }
  return Math.max(ZOOM_MIN, +(zoom - ZOOM_STEP).toFixed(1));
}

export function formatZoomPercent(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}
