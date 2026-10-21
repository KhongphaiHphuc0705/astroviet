/**
 * Pure domain interaction and selection model for Chart Viewer (Milestone F4-M8).
 * Pure TypeScript: no React, DOM, or API dependencies (Quality Gate G-1).
 *
 * Implements decisions:
 * - D-M8-01 (Canonical Selection discriminated union & identity)
 * - D-M8-03 (Independent hovered, focused, selected; preview = focused ?? hovered)
 * - D-M8-04 (Planet filter is derived consequence of selection)
 * - D-M8-07 (Escape behavior resets selection only)
 * - D-M8-09 (Single polite live announcement generator)
 */

import type { AspectKey, ChartViewModel, PlanetKey } from "./chartViewModel";

export type InteractionTarget =
  { kind: "planet"; key: PlanetKey } | { kind: "aspect"; key: AspectKey };

export type Selection = { kind: "none" } | InteractionTarget;

export interface Announcement {
  seq: number;
  kind: "selected" | "cleared";
}

export interface InteractionState {
  selection: Selection;
  hovered: InteractionTarget | null;
  focused: InteractionTarget | null;
  announcement: Announcement | null;
}

export type InteractionAction =
  | { type: "hoverEnter"; target: InteractionTarget }
  | { type: "hoverLeave"; target: InteractionTarget }
  | { type: "focusEnter"; target: InteractionTarget }
  | { type: "focusLeave"; target: InteractionTarget }
  | { type: "select"; target: InteractionTarget }
  | { type: "clear" }
  | { type: "escape" };

export const INITIAL_INTERACTION_STATE: InteractionState = {
  selection: { kind: "none" },
  hovered: null,
  focused: null,
  announcement: null,
};

export function isSameTarget(
  a: InteractionTarget | null,
  b: InteractionTarget | null,
): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  return a.kind === b.kind && a.key === b.key;
}

export function selectionToTarget(
  selection: Selection,
): InteractionTarget | null {
  if (selection.kind === "none") return null;
  return selection;
}

/**
 * Pure reducer governing all chart viewer selection and preview state transitions.
 * Enforces 8 core invariants:
 * 1. selection always belongs to discriminated union.
 * 2. hover/focus changes never modify selection or announcement.
 * 3. selecting the same target twice toggles to none.
 * 4. clear/escape when already none returns the exact same state reference.
 * 5. announcement.seq increments strictly when persistent selection changes.
 * 6. fully deterministic and free of external/DOM side effects.
 * 7. hoverLeave/focusLeave with non-matching target is safely ignored (race protection).
 * 8. no derived fields stored in state.
 */
export function interactionReducer(
  state: InteractionState,
  action: InteractionAction,
): InteractionState {
  switch (action.type) {
    case "hoverEnter": {
      if (isSameTarget(state.hovered, action.target)) {
        return state;
      }
      return {
        ...state,
        hovered: action.target,
      };
    }

    case "hoverLeave": {
      if (!isSameTarget(state.hovered, action.target)) {
        return state;
      }
      return {
        ...state,
        hovered: null,
      };
    }

    case "focusEnter": {
      if (isSameTarget(state.focused, action.target)) {
        return state;
      }
      return {
        ...state,
        focused: action.target,
      };
    }

    case "focusLeave": {
      if (!isSameTarget(state.focused, action.target)) {
        return state;
      }
      return {
        ...state,
        focused: null,
      };
    }

    case "select": {
      const currentTarget = selectionToTarget(state.selection);
      if (isSameTarget(currentTarget, action.target)) {
        // Toggle selection off
        return {
          ...state,
          selection: { kind: "none" },
          announcement: {
            seq: (state.announcement?.seq ?? 0) + 1,
            kind: "cleared",
          },
        };
      }
      return {
        ...state,
        selection: action.target,
        announcement: {
          seq: (state.announcement?.seq ?? 0) + 1,
          kind: "selected",
        },
      };
    }

    case "clear":
    case "escape": {
      if (state.selection.kind === "none") {
        return state;
      }
      return {
        ...state,
        selection: { kind: "none" },
        announcement: {
          seq: (state.announcement?.seq ?? 0) + 1,
          kind: "cleared",
        },
      };
    }

    default: {
      return state;
    }
  }
}

/**
 * Resolves the previewed target based on D-M8-03:
 * Pointer hover takes precedence when active (`hovered ?? focused`),
 * falling back smoothly to keyboard focus when pointer leaves.
 */
export function resolvePreview(
  focused: InteractionTarget | null,
  hovered: InteractionTarget | null,
): InteractionTarget | null {
  return hovered ?? focused;
}

/**
 * Reconciles selection against available keys to ensure no stale/dead references persist.
 */
export function resolveSelection(
  selection: Selection,
  availability: {
    planetKeys: ReadonlySet<PlanetKey>;
    aspectKeys: ReadonlySet<AspectKey>;
  },
): Selection {
  if (selection.kind === "none") {
    return selection;
  }
  if (selection.kind === "planet") {
    return availability.planetKeys.has(selection.key)
      ? selection
      : { kind: "none" };
  }
  if (selection.kind === "aspect") {
    return availability.aspectKeys.has(selection.key)
      ? selection
      : { kind: "none" };
  }
  return { kind: "none" };
}

export interface EmphasisResult {
  planets: ReadonlySet<PlanetKey>;
  aspects: ReadonlySet<AspectKey>;
  active: boolean;
}

export interface WheelInteraction {
  selection: Selection;
  emphasis: EmphasisResult;
  onSelect(target: InteractionTarget): void;
  onPreview(
    target: InteractionTarget,
    source: "hover" | "focus",
    phase: "enter" | "leave",
  ): void;
}

/**
 * Computes structural emphasis (halo & dimming sets) purely by key lookup.
 * Performs no astrological calculations.
 */
export function computeEmphasis(
  selection: Selection,
  preview: InteractionTarget | null,
  vm: ChartViewModel,
): EmphasisResult {
  const planets = new Set<PlanetKey>();
  const aspects = new Set<AspectKey>();

  function addPlanet(key: PlanetKey): void {
    planets.add(key);
    for (const aspect of vm.aspects) {
      if (aspect.planetA.key === key || aspect.planetB.key === key) {
        aspects.add(aspect.key);
      }
    }
  }

  function addAspect(key: AspectKey): void {
    aspects.add(key);
    const aspect = vm.aspects.find((a) => a.key === key);
    if (aspect) {
      planets.add(aspect.planetA.key);
      planets.add(aspect.planetB.key);
    }
  }

  if (selection.kind === "planet") {
    addPlanet(selection.key);
  } else if (selection.kind === "aspect") {
    addAspect(selection.key);
  }

  if (preview !== null) {
    if (preview.kind === "planet") {
      addPlanet(preview.key);
    } else if (preview.kind === "aspect") {
      addAspect(preview.key);
    }
  }

  const active = planets.size > 0 || aspects.size > 0;

  return {
    planets,
    aspects,
    active,
  };
}

/**
 * Formats polite screen reader announcement in Vietnamese (D-M8-09).
 */
export function buildLiveMessage(
  announcement: Announcement | null,
  selection: Selection,
  vm: ChartViewModel,
): string {
  if (announcement === null) {
    return "";
  }

  if (announcement.kind === "cleared" || selection.kind === "none") {
    return "Đã bỏ chọn.";
  }

  if (selection.kind === "planet") {
    const planet = vm.planets.find((p) => p.key === selection.key);
    if (!planet) {
      return "";
    }
    const degreePart = planet.degreeLabel ? `, ${planet.degreeLabel}` : "";
    const housePart =
      planet.houseNumber !== null && planet.houseNumber !== undefined
        ? `, nhà ${planet.houseNumber}`
        : "";
    const retroPart = planet.isRetrograde ? ", nghịch hành" : "";
    return `Đã chọn ${planet.nameVi} ở ${planet.sign.labelVi}${degreePart}${housePart}${retroPart}.`;
  }

  if (selection.kind === "aspect") {
    const aspect = vm.aspects.find((a) => a.key === selection.key);
    if (!aspect) {
      return "";
    }
    return `Đã chọn góc chiếu ${aspect.type.labelVi.toLowerCase()} giữa ${aspect.planetA.labelVi} và ${aspect.planetB.labelVi}.`;
  }

  return "";
}
