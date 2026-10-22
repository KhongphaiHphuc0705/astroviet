import { describe, expect, it } from "vitest";

import { chartFull, chartNoHouses } from "../api/mocks/fixtures";

import { toChartViewModel } from "./chartViewModel";
import {
  buildLiveMessage,
  computeEmphasis,
  INITIAL_INTERACTION_STATE,
  interactionReducer,
  isSameTarget,
  resolvePreview,
  resolveSelection,
  selectionToTarget,
  type InteractionAction,
  type InteractionState,
  type InteractionTarget,
} from "./selection";

describe("selection model (M8 Task 1: U1 - U24)", () => {
  const fullVM = toChartViewModel(chartFull);
  const noHousesVM = toChartViewModel(chartNoHouses);

  const sunTarget: InteractionTarget = { kind: "planet", key: "Sun" };
  const moonTarget: InteractionTarget = { kind: "planet", key: "Moon" };
  const marsTarget: InteractionTarget = { kind: "planet", key: "Mars" };

  const firstAspect = fullVM.aspects[0]!;
  const secondAspect = fullVM.aspects[1]!;
  const aspectTarget: InteractionTarget = {
    kind: "aspect",
    key: firstAspect.key,
  };
  const secondAspectTarget: InteractionTarget = {
    kind: "aspect",
    key: secondAspect.key,
  };

  it("U1: initial state has selection none, hovered null, focused null, announcement null", () => {
    expect(INITIAL_INTERACTION_STATE).toEqual({
      selection: { kind: "none" },
      hovered: null,
      focused: null,
      announcement: null,
    });
  });

  it("U2: hoverEnter sets hovered target", () => {
    const s1 = interactionReducer(INITIAL_INTERACTION_STATE, {
      type: "hoverEnter",
      target: sunTarget,
    });
    expect(s1.hovered).toEqual(sunTarget);
    expect(s1.selection).toEqual({ kind: "none" });
    expect(s1.announcement).toBeNull();
  });

  it("U3: hoverEnter with same target is idempotent and preserves state reference", () => {
    const s1 = interactionReducer(INITIAL_INTERACTION_STATE, {
      type: "hoverEnter",
      target: sunTarget,
    });
    const s2 = interactionReducer(s1, {
      type: "hoverEnter",
      target: sunTarget,
    });
    expect(s2).toBe(s1);
  });

  it("U4: hoverLeave clears hovered when target matches", () => {
    const s1 = interactionReducer(INITIAL_INTERACTION_STATE, {
      type: "hoverEnter",
      target: sunTarget,
    });
    const s2 = interactionReducer(s1, {
      type: "hoverLeave",
      target: sunTarget,
    });
    expect(s2.hovered).toBeNull();
  });

  it("U5: hoverLeave does not clear hovered when target does not match (race protection)", () => {
    const s1 = interactionReducer(INITIAL_INTERACTION_STATE, {
      type: "hoverEnter",
      target: sunTarget,
    });
    const s2 = interactionReducer(s1, {
      type: "hoverLeave",
      target: moonTarget,
    });
    expect(s2).toBe(s1);
    expect(s2.hovered).toEqual(sunTarget);
  });

  it("U6: focusEnter sets focused target", () => {
    const s1 = interactionReducer(INITIAL_INTERACTION_STATE, {
      type: "focusEnter",
      target: marsTarget,
    });
    expect(s1.focused).toEqual(marsTarget);
  });

  it("U7: focusEnter with same target is idempotent and preserves state reference", () => {
    const s1 = interactionReducer(INITIAL_INTERACTION_STATE, {
      type: "focusEnter",
      target: marsTarget,
    });
    const s2 = interactionReducer(s1, {
      type: "focusEnter",
      target: marsTarget,
    });
    expect(s2).toBe(s1);
  });

  it("U8: focusLeave clears focused when target matches", () => {
    const s1 = interactionReducer(INITIAL_INTERACTION_STATE, {
      type: "focusEnter",
      target: marsTarget,
    });
    const s2 = interactionReducer(s1, {
      type: "focusLeave",
      target: marsTarget,
    });
    expect(s2.focused).toBeNull();
  });

  it("U9: focusLeave does not clear focused when target does not match", () => {
    const s1 = interactionReducer(INITIAL_INTERACTION_STATE, {
      type: "focusEnter",
      target: marsTarget,
    });
    const s2 = interactionReducer(s1, {
      type: "focusLeave",
      target: sunTarget,
    });
    expect(s2).toBe(s1);
    expect(s2.focused).toEqual(marsTarget);
  });

  it("U10: select planet sets selection and announcement seq: 1", () => {
    const s1 = interactionReducer(INITIAL_INTERACTION_STATE, {
      type: "select",
      target: sunTarget,
    });
    expect(s1.selection).toEqual(sunTarget);
    expect(s1.announcement).toEqual({ seq: 1, kind: "selected" });
  });

  it("U11: selecting the same planet toggles selection to none and emits cleared announcement", () => {
    const s1 = interactionReducer(INITIAL_INTERACTION_STATE, {
      type: "select",
      target: sunTarget,
    });
    const s2 = interactionReducer(s1, {
      type: "select",
      target: sunTarget,
    });
    expect(s2.selection).toEqual({ kind: "none" });
    expect(s2.announcement).toEqual({ seq: 2, kind: "cleared" });
  });

  it("U12: selecting a different planet replaces selection and increments seq", () => {
    const s1 = interactionReducer(INITIAL_INTERACTION_STATE, {
      type: "select",
      target: sunTarget,
    });
    const s2 = interactionReducer(s1, {
      type: "select",
      target: moonTarget,
    });
    expect(s2.selection).toEqual(moonTarget);
    expect(s2.announcement).toEqual({ seq: 2, kind: "selected" });
  });

  it("U13: select aspect sets aspect selection", () => {
    const s1 = interactionReducer(INITIAL_INTERACTION_STATE, {
      type: "select",
      target: aspectTarget,
    });
    expect(s1.selection).toEqual(aspectTarget);
    expect(s1.announcement).toEqual({ seq: 1, kind: "selected" });
  });

  it("U14: selecting the same aspect toggles back to none", () => {
    const s1 = interactionReducer(INITIAL_INTERACTION_STATE, {
      type: "select",
      target: aspectTarget,
    });
    const s2 = interactionReducer(s1, {
      type: "select",
      target: aspectTarget,
    });
    expect(s2.selection).toEqual({ kind: "none" });
    expect(s2.announcement).toEqual({ seq: 2, kind: "cleared" });
  });

  it("U15: clear resets selection to none and announces cleared", () => {
    const s1 = interactionReducer(INITIAL_INTERACTION_STATE, {
      type: "select",
      target: sunTarget,
    });
    const s2 = interactionReducer(s1, { type: "clear" });
    expect(s2.selection).toEqual({ kind: "none" });
    expect(s2.announcement).toEqual({ seq: 2, kind: "cleared" });
  });

  it("U16: clear when already none preserves exact state reference", () => {
    const s1 = interactionReducer(INITIAL_INTERACTION_STATE, { type: "clear" });
    expect(s1).toBe(INITIAL_INTERACTION_STATE);
  });

  it("U17: escape resets selection to none and announces cleared", () => {
    const s1 = interactionReducer(INITIAL_INTERACTION_STATE, {
      type: "select",
      target: marsTarget,
    });
    const s2 = interactionReducer(s1, { type: "escape" });
    expect(s2.selection).toEqual({ kind: "none" });
    expect(s2.announcement).toEqual({ seq: 2, kind: "cleared" });
  });

  it("U18: escape when already none is a strict no-op preserving reference", () => {
    const s1 = interactionReducer(INITIAL_INTERACTION_STATE, {
      type: "escape",
    });
    expect(s1).toBe(INITIAL_INTERACTION_STATE);
  });

  it("U19: hover and focus actions never mutate selection or announcement", () => {
    const s1 = interactionReducer(INITIAL_INTERACTION_STATE, {
      type: "select",
      target: sunTarget,
    });
    const s2 = interactionReducer(s1, {
      type: "hoverEnter",
      target: moonTarget,
    });
    const s3 = interactionReducer(s2, {
      type: "focusEnter",
      target: marsTarget,
    });
    const s4 = interactionReducer(s3, {
      type: "hoverLeave",
      target: moonTarget,
    });
    const s5 = interactionReducer(s4, {
      type: "focusLeave",
      target: marsTarget,
    });

    expect(s5.selection).toEqual(sunTarget);
    expect(s5.announcement).toEqual(s1.announcement);
  });

  it("U20: property-based random sequence with fixed seed preserves 8 core invariants", () => {
    // Linear Congruential Generator for deterministic pseudo-random sequence
    let seed = 123456789;
    function rand() {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    }

    const targets: InteractionTarget[] = [
      sunTarget,
      moonTarget,
      marsTarget,
      aspectTarget,
      secondAspectTarget,
    ];

    let state: InteractionState = INITIAL_INTERACTION_STATE;
    let expectedSeq = 0;

    for (let i = 0; i < 200; i++) {
      const target = targets[Math.floor(rand() * targets.length)]!;
      const actionType = Math.floor(rand() * 7);
      let action: InteractionAction;

      switch (actionType) {
        case 0:
          action = { type: "hoverEnter", target };
          break;
        case 1:
          action = { type: "hoverLeave", target };
          break;
        case 2:
          action = { type: "focusEnter", target };
          break;
        case 3:
          action = { type: "focusLeave", target };
          break;
        case 4:
          action = { type: "select", target };
          break;
        case 5:
          action = { type: "clear" };
          break;
        default:
          action = { type: "escape" };
          break;
      }

      const prev = state;
      state = interactionReducer(state, action);

      // Invariant 1: selection is discriminated union
      expect(["none", "planet", "aspect"]).toContain(state.selection.kind);

      // Invariant 2: hover/focus never change selection or announcement
      if (
        action.type === "hoverEnter" ||
        action.type === "hoverLeave" ||
        action.type === "focusEnter" ||
        action.type === "focusLeave"
      ) {
        expect(state.selection).toEqual(prev.selection);
        expect(state.announcement).toEqual(prev.announcement);
      }

      // Invariant 5: announcement.seq increments strictly when selection changes
      if (
        !isSameTarget(
          selectionToTarget(prev.selection),
          selectionToTarget(state.selection),
        )
      ) {
        expectedSeq++;
        expect(state.announcement?.seq).toBe(expectedSeq);
      }
    }
  });

  it("U21: resolveSelection preserves valid selection and falls back to none for dead references", () => {
    const availability = {
      planetKeys: new Set(["Sun", "Moon"] as const),
      aspectKeys: new Set(["Sun:Trine:Moon"] as const),
    };

    expect(resolveSelection({ kind: "none" }, availability)).toEqual({
      kind: "none",
    });

    expect(resolveSelection(sunTarget, availability)).toEqual(sunTarget);

    expect(resolveSelection(marsTarget, availability)).toEqual({
      kind: "none",
    });

    expect(
      resolveSelection({ kind: "aspect", key: "Sun:Trine:Moon" }, availability),
    ).toEqual({ kind: "aspect", key: "Sun:Trine:Moon" });

    expect(
      resolveSelection(
        { kind: "aspect", key: "Jupiter:Square:Saturn" },
        availability,
      ),
    ).toEqual({ kind: "none" });
  });

  it("U22: resolvePreview prioritizes pointer hover over keyboard focus (hovered ?? focused)", () => {
    expect(resolvePreview(null, null)).toBeNull();
    expect(resolvePreview(null, sunTarget)).toEqual(sunTarget);
    expect(resolvePreview(marsTarget, null)).toEqual(marsTarget);
    // When both are present, hover prioritizes to support click-then-hover
    expect(resolvePreview(marsTarget, sunTarget)).toEqual(sunTarget);
  });

  it("U23: computeEmphasis computes structural emphasis sets accurately without astrological calculation", () => {
    // 1. Inactive when none
    const emptyEmphasis = computeEmphasis({ kind: "none" }, null, fullVM);
    expect(emptyEmphasis.active).toBe(false);
    expect(emptyEmphasis.planets.size).toBe(0);
    expect(emptyEmphasis.aspects.size).toBe(0);

    // 2. Planet selection: includes planet + all its aspects
    const sunEmphasis = computeEmphasis(sunTarget, null, fullVM);
    expect(sunEmphasis.active).toBe(true);
    expect(sunEmphasis.planets.has("Sun")).toBe(true);
    for (const a of fullVM.aspects) {
      if (a.planetA.key === "Sun" || a.planetB.key === "Sun") {
        expect(sunEmphasis.aspects.has(a.key)).toBe(true);
      }
    }

    // 3. Aspect selection: includes aspect + both endpoint planets
    const aspectEmphasis = computeEmphasis(aspectTarget, null, fullVM);
    expect(aspectEmphasis.active).toBe(true);
    expect(aspectEmphasis.aspects.has(firstAspect.key)).toBe(true);
    expect(aspectEmphasis.planets.has(firstAspect.planetA.key)).toBe(true);
    expect(aspectEmphasis.planets.has(firstAspect.planetB.key)).toBe(true);

    // 4. Preview addition: preview merges into emphasis
    const combinedEmphasis = computeEmphasis(sunTarget, aspectTarget, fullVM);
    expect(combinedEmphasis.planets.has("Sun")).toBe(true);
    expect(combinedEmphasis.planets.has(firstAspect.planetA.key)).toBe(true);
    expect(combinedEmphasis.planets.has(firstAspect.planetB.key)).toBe(true);
    expect(combinedEmphasis.aspects.has(firstAspect.key)).toBe(true);

    // 5. Planet preview merges into emphasis
    const planetPreviewEmphasis = computeEmphasis(
      { kind: "none" },
      moonTarget,
      fullVM,
    );
    expect(planetPreviewEmphasis.active).toBe(true);
    expect(planetPreviewEmphasis.planets.has("Moon")).toBe(true);

    // 6. Unknown aspect key handled safely without crash
    const unknownAspectEmphasis = computeEmphasis(
      { kind: "aspect", key: "Unknown:Aspect" },
      null,
      fullVM,
    );
    expect(unknownAspectEmphasis.aspects.has("Unknown:Aspect")).toBe(true);
  });

  it("U24: buildLiveMessage formats Vietnamese announcements according to D-M8-09 specification", () => {
    expect(buildLiveMessage(null, { kind: "none" }, fullVM)).toBe("");

    expect(
      buildLiveMessage({ seq: 1, kind: "cleared" }, { kind: "none" }, fullVM),
    ).toBe("Đã bỏ chọn.");

    // Planet with house, degree, and retrograde info
    const sunPlanet = fullVM.planets.find((p) => p.key === "Sun")!;
    const sunDegreePart = sunPlanet.degreeLabel
      ? `, ${sunPlanet.degreeLabel}`
      : "";
    const sunRetroPart = sunPlanet.isRetrograde ? ", nghịch hành" : "";
    const sunMsg = buildLiveMessage(
      { seq: 2, kind: "selected" },
      sunTarget,
      fullVM,
    );
    expect(sunMsg).toBe(
      `Đã chọn ${sunPlanet.nameVi} ở ${sunPlanet.sign.labelVi}${sunDegreePart}, nhà ${sunPlanet.houseNumber}${sunRetroPart}.`,
    );

    // Planet without house (chartNoHouses)
    const sunNoHouses = noHousesVM.planets.find((p) => p.key === "Sun")!;
    const noHouseDegreePart = sunNoHouses.degreeLabel
      ? `, ${sunNoHouses.degreeLabel}`
      : "";
    const noHouseRetroPart = sunNoHouses.isRetrograde ? ", nghịch hành" : "";
    const noHouseMsg = buildLiveMessage(
      { seq: 3, kind: "selected" },
      sunTarget,
      noHousesVM,
    );
    expect(noHouseMsg).toBe(
      `Đã chọn ${sunNoHouses.nameVi} ở ${sunNoHouses.sign.labelVi}${noHouseDegreePart}${noHouseRetroPart}.`,
    );

    // Aspect message
    const aspectMsg = buildLiveMessage(
      { seq: 4, kind: "selected" },
      aspectTarget,
      fullVM,
    );
    expect(aspectMsg).toBe(
      `Đã chọn góc chiếu ${firstAspect.type.labelVi.toLowerCase()} giữa ${firstAspect.planetA.labelVi} và ${firstAspect.planetB.labelVi}.`,
    );

    // Missing aspect in buildLiveMessage
    expect(
      buildLiveMessage(
        { seq: 5, kind: "selected" },
        { kind: "aspect", key: "NonExistent:Aspect" },
        fullVM,
      ),
    ).toBe("");

    // Missing planet in buildLiveMessage
    expect(
      buildLiveMessage(
        { seq: 6, kind: "selected" },
        { kind: "planet", key: "NonExistent" },
        fullVM,
      ),
    ).toBe("");
  });

  it("U25: handles fallbacks and unknown actions safely", () => {
    const initialState = INITIAL_INTERACTION_STATE;
    // @ts-expect-error testing unknown action
    expect(interactionReducer(initialState, { type: "UNKNOWN" })).toBe(
      initialState,
    );

    expect(
      resolveSelection(
        // @ts-expect-error testing unknown selection kind
        { kind: "unknown" },
        { planetKeys: new Set(), aspectKeys: new Set() },
      ),
    ).toEqual({ kind: "none" });

    expect(
      buildLiveMessage(
        { seq: 7, kind: "selected" },
        // @ts-expect-error testing unknown selection kind
        { kind: "unknown" },
        fullVM,
      ),
    ).toBe("");
  });
});
