import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { chartFull, chartNoHouses } from "../../api/mocks/fixtures";
import { toChartViewModel } from "../../model/chartViewModel";
import { buildInterpretationModel } from "../../model/interpretation";

import { InterpretationPanel } from "./InterpretationPanel";

describe("InterpretationPanel degraded states", () => {
  it("D5-H03: F-Contradiction with house flag mismatch displays neutral house notice and omits house sections", () => {
    // Raw houses has 11 houses instead of 12, while isHouseDataAvailable flag is true
    const contradictionDto = {
      ...chartFull,
      isHouseDataAvailable: true,
      houses: chartFull.houses.slice(0, 11),
    };
    const vm = toChartViewModel(contradictionDto);
    expect(vm.flags.houseDataAvailable).toBe(false);

    const model = buildInterpretationModel(contradictionDto, vm);
    expect(model.houseDataAvailable).toBe(false);

    render(<InterpretationPanel vm={vm} model={model} />);

    // Neutral house notice is shown in Overview
    expect(
      screen.getByText(
        "Dữ liệu Nhà và một số góc trong lá số này chưa khả dụng. Bạn vẫn có thể xem các diễn giải theo cung.",
      ),
    ).toBeInTheDocument();

    // No house interpretation blocks exist in DOM
    expect(screen.queryByText("Theo nhà")).toBeNull();
  });

  it("D5-A01: F-NoHouse renders Ascendant with unavailable copy, disclosure works, no view on chart button, planets retain sign interpretations", async () => {
    const user = userEvent.setup();
    const vm = toChartViewModel(chartNoHouses);
    const model = buildInterpretationModel(chartNoHouses, vm);
    render(<InterpretationPanel vm={vm} model={model} />);

    // Ascendant item in Core group
    const ascendantHeaderBtn = screen.getByRole("button", {
      name: /^Cung Mọc/,
    });
    expect(ascendantHeaderBtn).toBeInTheDocument();
    // Default expanded in Core group
    expect(ascendantHeaderBtn).toHaveAttribute("aria-expanded", "true");

    // Copy C-11 rendered
    expect(
      screen.getByText("Cung Mọc chưa khả dụng cho lá số này."),
    ).toBeInTheDocument();

    // No "Xem trên biểu đồ" button for Ascendant
    expect(
      screen.queryByRole("button", { name: /Xem trên biểu đồ: Cung Mọc/i }),
    ).toBeNull();

    // Disclosure collapse and expand works
    await user.click(ascendantHeaderBtn);
    expect(ascendantHeaderBtn).toHaveAttribute("aria-expanded", "false");
    await user.click(ascendantHeaderBtn);
    expect(ascendantHeaderBtn).toHaveAttribute("aria-expanded", "true");

    // Other planets still retain their sign interpretation
    expect(
      screen.getByRole("button", { name: /^Mặt Trời/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Mặt Trời ở Ma Kết tượng trưng cho tham vọng/i),
    ).toBeInTheDocument();
  });

  it("D5-A02: Chart with houses but missing Ascendant entry displays missing item copy, NOT unavailable copy", () => {
    // chartFull has Ascendant angle in vm.angles, but remove Ascendant interpretation entry
    const missingAscendantDto = {
      ...chartFull,
      interpretations: chartFull.interpretations.filter(
        (i) => i.subjectKey !== "Ascendant_in_Aries",
      ),
    };
    const vm = toChartViewModel(missingAscendantDto);
    const model = buildInterpretationModel(missingAscendantDto, vm);

    render(<InterpretationPanel vm={vm} model={model} />);

    const ascendantSection = screen
      .getByRole("button", { name: /^Cung Mọc/ })
      .closest("article")!;

    // Should display missing item text, NOT unavailable text
    expect(
      within(ascendantSection).getByText("Chưa có nội dung cho mục này"),
    ).toBeInTheDocument();
    expect(
      within(ascendantSection).queryByText(
        "Cung Mọc chưa khả dụng cho lá số này.",
      ),
    ).toBeNull();
  });

  it("D5-V02: F-VerEmpty with version 1.0 and empty interpretations renders S-08 warning alert and NOT unpublished alert", () => {
    const verEmptyDto = {
      ...chartFull,
      interpretationVersion: "1.0",
      interpretations: [],
    };
    const vm = toChartViewModel(verEmptyDto);
    const model = buildInterpretationModel(verEmptyDto, vm);

    expect(model.status).toBe("unavailable");

    render(<InterpretationPanel vm={vm} model={model} />);

    // Must render S-08 Alert warning
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(
      "Hiện chưa thể hiển thị diễn giải cho lá số này.",
    );

    // Must NOT render S-03 unpublished info alert
    expect(
      screen.queryByText("Nội dung diễn giải chưa được phát hành"),
    ).toBeNull();
  });

  it("D5-V03: F-NullItems with version null and valid entries renders full interpretation content normally without alert", () => {
    const nullItemsDto = {
      ...chartFull,
      interpretationVersion: null,
      interpretations: chartFull.interpretations,
    };
    const vm = toChartViewModel(nullItemsDto);
    const model = buildInterpretationModel(nullItemsDto, vm);

    expect(model.status).toBe("ready");
    expect(model.items.length).toBe(11);

    render(<InterpretationPanel vm={vm} model={model} />);

    // Content renders normally
    expect(
      screen.getByText("Có 21 diễn giải cho lá số này"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Cốt lõi" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Các hành tinh" }),
    ).toBeInTheDocument();

    // No alert is rendered
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("D5-V04: scans DOM across all degraded states to ensure version, null, tone, and contentSource are never exposed", () => {
    const states = [
      // S-02 Full
      { dto: chartFull },
      // S-03 Unpublished
      {
        dto: {
          ...chartFull,
          interpretationVersion: null,
          interpretations: [],
        },
      },
      // S-05 No houses
      { dto: chartNoHouses },
      // S-08 Unavailable
      {
        dto: {
          ...chartFull,
          interpretationVersion: "1.0",
          interpretations: [],
        },
      },
    ];

    for (const { dto } of states) {
      const vm = toChartViewModel(dto);
      const model = buildInterpretationModel(dto, vm);
      const { container, unmount } = render(
        <InterpretationPanel vm={vm} model={model} />,
      );

      const text = container.textContent ?? "";

      // 1. Never exposes raw version strings
      expect(text).not.toContain("1.0");
      expect(text).not.toMatch(/\bversion\b/i);

      // 2. Never exposes "null" literal
      expect(text).not.toMatch(/\bnull\b/i);

      // 3. Never exposes raw tone strings
      expect(text).not.toMatch(/\b(neutral|assertive|gentle)\b/i);

      // 4. Never exposes contentSource (Hybrid, etc.)
      expect(text).not.toMatch(/\bHybrid\b/i);
      expect(text).not.toMatch(/\bcontentSource\b/i);

      unmount();
    }
  });

  it("D5-P02: F-Unsupported ignores unknown subject types from DOM, renders valid items, and records defect issue", () => {
    const unsupportedDto = {
      ...chartFull,
      interpretations: [
        ...chartFull.interpretations,
        {
          subjectType: "UnknownSubject",
          subjectKey: "Unknown_Key_12345",
          language: "vi",
          bodyText: "Raw unknown body text should never render",
        },
      ],
    } as unknown as typeof chartFull;

    const vm = toChartViewModel(unsupportedDto);
    const model = buildInterpretationModel(unsupportedDto, vm);

    expect(model.issues.some((i) => i.code === "SUBJECT_UNSUPPORTED")).toBe(
      true,
    );

    const { container } = render(<InterpretationPanel vm={vm} model={model} />);

    // Valid items still render normally
    expect(
      screen.getByText("Có 21 diễn giải cho lá số này"),
    ).toBeInTheDocument();

    // No leaked raw unknown strings in DOM
    expect(container.textContent).not.toContain("UnknownSubject");
    expect(container.textContent).not.toContain("Unknown_Key_12345");
    expect(container.textContent).not.toContain(
      "Raw unknown body text should never render",
    );
  });

  it("D5-P03: Multiple parts missing sets status to partial, renders missing copy without new Alert, and shows accurate count", () => {
    // Remove 3 entries: Sun in sign, Mars in house, Venus in sign
    const missingKeys = new Set([
      "Sun_in_Capricorn",
      "Mars_in_House_8",
      "Venus_in_Aquarius",
    ]);
    const multiMissingDto = {
      ...chartFull,
      interpretations: chartFull.interpretations.filter(
        (i) => !missingKeys.has(i.subjectKey),
      ),
    };

    const vm = toChartViewModel(multiMissingDto);
    const model = buildInterpretationModel(multiMissingDto, vm);

    expect(model.status).toBe("partial");
    // 21 - 3 = 18 available entries
    expect(model.availableCount).toBe(18);

    render(<InterpretationPanel vm={vm} model={model} />);

    // Count accurately reflects available interpretations
    expect(
      screen.getByText("Có 18 diễn giải cho lá số này"),
    ).toBeInTheDocument();

    // No alert is rendered because partial missing is not an unavailable chart
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();

    // Missing copy appears for the missing parts
    const missingCopies = screen.getAllByText("Chưa có nội dung cho mục này");
    expect(missingCopies.length).toBe(3);

    // Other existing interpretations are still rendered intact
    expect(screen.getByText(/Mặt Trăng ở Bảo Bình/i)).toBeInTheDocument();
  });

  it("D5-E01: F-Malformed filters out malformed entries cleanly, renders valid siblings, and prevents raw key leaks", () => {
    const malformedDto = {
      ...chartFull,
      interpretations: [
        ...chartFull.interpretations,
        null,
        123,
        "string-entry",
        { subjectType: null, subjectKey: "Malformed_1" },
        {
          subjectType: "PlanetInSign",
          subjectKey: "",
          language: "vi",
          bodyText: "No key",
        },
        {
          subjectType: "PlanetInSign",
          subjectKey: "Invalid_Sign_Key",
          language: "vi",
          bodyText: "Bad key",
        },
        {
          subjectType: "PlanetInSign",
          subjectKey: "Sun_in_Capricorn",
          language: "en",
          bodyText: "English not supported",
        },
        {
          subjectType: "PlanetInSign",
          subjectKey: "Sun_in_Capricorn",
          language: "vi",
          bodyText: "   ",
        },
      ] as unknown as typeof chartFull.interpretations,
    };

    const vm = toChartViewModel(malformedDto);
    const model = buildInterpretationModel(malformedDto, vm);

    expect(model.issues.some((i) => i.code === "ENTRY_MALFORMED")).toBe(true);
    expect(model.status).toBe("ready");

    const { container } = render(<InterpretationPanel vm={vm} model={model} />);

    // Valid siblings render normally
    expect(
      screen.getByText("Có 21 diễn giải cho lá số này"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Mặt Trời ở Ma Kết tượng trưng cho tham vọng/i),
    ).toBeInTheDocument();

    // No malformed or raw keys leaked into DOM
    expect(container.textContent).not.toContain("Malformed_1");
    expect(container.textContent).not.toContain("Invalid_Sign_Key");
    expect(container.textContent).not.toContain("English not supported");
    expect(container.textContent).not.toContain("string-entry");
  });
});
