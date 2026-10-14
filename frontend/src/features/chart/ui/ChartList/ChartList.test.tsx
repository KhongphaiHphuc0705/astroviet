import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { renderWithProviders, screen, within } from "@test/render";

import type { ChartSummary, HouseSystem } from "../../api/types";
import { formatCalculatedAt } from "../ChartViewerShell/formatCalculatedAt";

import { ChartList } from "./ChartList";
import {
  PROFILE_LABEL_FALLBACKS,
  type ChartProfileLookup,
} from "./profileLabel";

describe("ChartList", () => {
  const readyLookup: ChartProfileLookup = {
    status: "ready",
    labelsById: new Map([
      ["profile-1", "Nguyễn Văn A"],
      ["profile-2", "Hồ sơ cá nhân"],
    ]),
    isComplete: true,
  };

  const item1: ChartSummary = {
    id: "a9d7dcb2-68ed-4b67-b6ee-c62690009f24",
    birthProfileId: "profile-1",
    birthProfileLabel: null,
    houseSystem: "Placidus",
    calculatedAt: "2026-10-10T09:56:46.004Z",
  };

  const item2: ChartSummary = {
    id: "b8c6cb11-57dc-3a56-a5dd-b51580008e13",
    birthProfileId: null,
    birthProfileLabel: null,
    houseSystem: "WholeSign",
    calculatedAt: "2026-10-11T14:30:00.000Z",
  };

  const sampleItems: ChartSummary[] = [item1, item2];

  it("A1: renders 'Xem lá số' link pointing to /app/charts/{id} for each item", () => {
    renderWithProviders(<ChartList items={sampleItems} lookup={readyLookup} />);

    const link1 = screen.getByRole("link", {
      name: new RegExp(
        `Xem lá số: Nguyễn Văn A, tính lúc ${formatCalculatedAt(item1.calculatedAt)}`,
      ),
    });
    expect(link1).toHaveAttribute("href", `/app/charts/${item1.id}`);

    const link2 = screen.getByRole("link", {
      name: new RegExp(
        `Xem lá số: ${PROFILE_LABEL_FALLBACKS.deleted}, tính lúc ${formatCalculatedAt(item2.calculatedAt)}`,
      ),
    });
    expect(link2).toHaveAttribute("href", `/app/charts/${item2.id}`);
  });

  it("A2: renders calculatedAt as semantic time element matching formatCalculatedAt and dateTime ISO", () => {
    renderWithProviders(<ChartList items={sampleItems} lookup={readyLookup} />);

    const timeElements = screen.getAllByText((_, el) => el?.tagName === "TIME");
    expect(timeElements).toHaveLength(2);

    const firstTimeEl = timeElements[0];
    const secondTimeEl = timeElements[1];
    expect(firstTimeEl).toBeDefined();
    expect(secondTimeEl).toBeDefined();

    if (firstTimeEl && secondTimeEl) {
      expect(firstTimeEl).toHaveAttribute("dateTime", item1.calculatedAt);
      expect(firstTimeEl.textContent).toBe(
        formatCalculatedAt(item1.calculatedAt),
      );

      expect(secondTimeEl).toHaveAttribute("dateTime", item2.calculatedAt);
      expect(secondTimeEl.textContent).toBe(
        formatCalculatedAt(item2.calculatedAt),
      );
    }
  });

  it("A3: renders HouseSystem badge correctly for Placidus and WholeSign", () => {
    renderWithProviders(<ChartList items={sampleItems} lookup={readyLookup} />);

    expect(screen.getByText("Placidus")).toBeInTheDocument();
    expect(screen.getByText("Whole Sign")).toBeInTheDocument();
  });

  it("A4: renders raw string for unknown houseSystem or 'Không rõ' for empty, without defaulting to Placidus", () => {
    const customItems: ChartSummary[] = [
      {
        id: "c1",
        birthProfileId: "profile-1",
        birthProfileLabel: null,
        houseSystem: "Koch" as HouseSystem,
        calculatedAt: "2026-10-10T09:56:46.004Z",
      },
      {
        id: "c2",
        birthProfileId: "profile-1",
        birthProfileLabel: null,
        houseSystem: "" as HouseSystem,
        calculatedAt: "2026-10-10T09:56:46.004Z",
      },
    ];

    renderWithProviders(<ChartList items={customItems} lookup={readyLookup} />);

    expect(screen.getByText("Koch")).toBeInTheDocument();
    expect(screen.getByText("Không rõ")).toBeInTheDocument();
    expect(screen.queryByText("Placidus")).not.toBeInTheDocument();
  });

  it("A5: resolves and displays profile name from Map", () => {
    renderWithProviders(<ChartList items={sampleItems} lookup={readyLookup} />);

    expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
  });

  it("A6: displays deleted fallback when birthProfileId is null, even when lookup is loading", () => {
    const loadingLookup: ChartProfileLookup = {
      status: "loading",
      labelsById: new Map(),
      isComplete: false,
    };

    renderWithProviders(<ChartList items={[item2]} lookup={loadingLookup} />);

    expect(
      screen.getByText(PROFILE_LABEL_FALLBACKS.deleted),
    ).toBeInTheDocument();
  });

  it("A7: displays deleted fallback when birthProfileId is not in Map and lookup is complete", () => {
    const itemWithMissingProfile: ChartSummary = {
      id: "missing-1",
      birthProfileId: "unknown-id",
      birthProfileLabel: null,
      houseSystem: "Placidus",
      calculatedAt: "2026-10-10T09:56:46.004Z",
    };

    renderWithProviders(
      <ChartList items={[itemWithMissingProfile]} lookup={readyLookup} />,
    );

    expect(
      screen.getByText(PROFILE_LABEL_FALLBACKS.deleted),
    ).toBeInTheDocument();
  });

  it("A8: displays unknown fallback when birthProfileId is not in Map and lookup is incomplete (D-M11-3)", () => {
    const incompleteLookup: ChartProfileLookup = {
      status: "ready",
      labelsById: new Map([["profile-1", "Nguyễn Văn A"]]),
      isComplete: false,
    };
    const itemWithMissingProfile: ChartSummary = {
      id: "missing-2",
      birthProfileId: "unfetched-id",
      birthProfileLabel: null,
      houseSystem: "Placidus",
      calculatedAt: "2026-10-10T09:56:46.004Z",
    };

    renderWithProviders(
      <ChartList items={[itemWithMissingProfile]} lookup={incompleteLookup} />,
    );

    expect(
      screen.getByText(PROFILE_LABEL_FALLBACKS.unknown),
    ).toBeInTheDocument();
  });

  it("A9: displays loading skeleton when lookup is loading and birthProfileId is not null, without showing deleted label", () => {
    const loadingLookup: ChartProfileLookup = {
      status: "loading",
      labelsById: new Map(),
      isComplete: false,
    };

    renderWithProviders(<ChartList items={[item1]} lookup={loadingLookup} />);

    expect(
      screen.getByText(PROFILE_LABEL_FALLBACKS.loading),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(PROFILE_LABEL_FALLBACKS.deleted),
    ).not.toBeInTheDocument();
  });

  it("A10: displays unavailable fallback when lookup has error, while action link remains functional", () => {
    const errorLookup: ChartProfileLookup = {
      status: "error",
      labelsById: new Map(),
      isComplete: false,
    };

    renderWithProviders(<ChartList items={[item1]} lookup={errorLookup} />);

    expect(
      screen.getByText(PROFILE_LABEL_FALLBACKS.unavailable),
    ).toBeInTheDocument();

    const link = screen.getByRole("link", {
      name: new RegExp(`Xem lá số: ${PROFILE_LABEL_FALLBACKS.unavailable}`),
    });
    expect(link).toHaveAttribute("href", `/app/charts/${item1.id}`);
  });

  it("A11: sets accessible aria-label matching template for each label branch", () => {
    const varied1: ChartSummary = {
      id: "c1",
      birthProfileId: "profile-1",
      birthProfileLabel: null,
      houseSystem: "Placidus",
      calculatedAt: "2026-10-10T09:56:46.004Z",
    };
    const varied2: ChartSummary = {
      id: "c2",
      birthProfileId: null,
      birthProfileLabel: null,
      houseSystem: "Placidus",
      calculatedAt: "2026-10-10T09:56:46.004Z",
    };
    const varied3: ChartSummary = {
      id: "c3",
      birthProfileId: "missing-id",
      birthProfileLabel: null,
      houseSystem: "Placidus",
      calculatedAt: "2026-10-10T09:56:46.004Z",
    };

    const incompleteLookup: ChartProfileLookup = {
      status: "ready",
      labelsById: new Map([["profile-1", "Nguyễn Văn A"]]),
      isComplete: false,
    };

    renderWithProviders(
      <ChartList
        items={[varied1, varied2, varied3]}
        lookup={incompleteLookup}
      />,
    );

    const formattedTime = formatCalculatedAt(varied1.calculatedAt);

    expect(
      screen.getByLabelText(
        `Xem lá số: Nguyễn Văn A, tính lúc ${formattedTime}`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        `Xem lá số: ${PROFILE_LABEL_FALLBACKS.deleted}, tính lúc ${formattedTime}`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        `Xem lá số: ${PROFILE_LABEL_FALLBACKS.unknown}, tính lúc ${formattedTime}`,
      ),
    ).toBeInTheDocument();
  });

  it("A12: adheres to semantic structure (list, listitem, h2 per item, link role, no nested buttons)", () => {
    const { container } = renderWithProviders(
      <ChartList items={sampleItems} lookup={readyLookup} />,
    );

    const list = screen.getByRole("list");
    expect(list).toBeInTheDocument();

    const listItems = within(list).getAllByRole("listitem");
    expect(listItems).toHaveLength(2);

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings).toHaveLength(2);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);

    // No nested buttons or interactive nesting
    expect(
      container.querySelectorAll("button button, a a, button a, a button"),
    ).toHaveLength(0);
  });

  it("A13: passes axe accessibility audit without violations", async () => {
    const { container } = renderWithProviders(
      <ChartList items={sampleItems} lookup={readyLookup} />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("A14: does not expose forbidden internal metadata (chartType, isHouseDataAvailable, engine, raw IDs)", () => {
    const { container } = renderWithProviders(
      <ChartList items={sampleItems} lookup={readyLookup} />,
    );

    const textContent = container.textContent ?? "";
    expect(textContent).not.toContain("Natal");
    expect(textContent).not.toContain("isHouseDataAvailable");
    expect(textContent).not.toContain("swisseph-wasm");
    expect(textContent).not.toContain(item1.id);
    expect(textContent).not.toContain(item2.id);
  });

  it("A15: renders nothing when items array is empty", () => {
    const { container } = renderWithProviders(
      <ChartList items={[]} lookup={readyLookup} />,
    );

    expect(container.querySelectorAll("li")).toHaveLength(0);
    expect(container.firstChild).toBeNull();
  });
});
