// PN-01 to PN-A: panel states, model-backed content, interactions, and accessibility.
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { axe } from "vitest-axe";

import { chartFull, chartNoHouses } from "../../api/mocks/fixtures";
import { toChartViewModel } from "../../model/chartViewModel";
import { buildInterpretationModel } from "../../model/interpretation";

import { InterpretationPanel } from "./InterpretationPanel";

function build(dto: typeof chartFull) {
  const vm = toChartViewModel(dto);
  return { vm, model: buildInterpretationModel(dto, vm) };
}

it("PN-01 and PN-02: should render fixture-backed groups and expand core by default", () => {
  const { vm, model } = build(chartFull);
  render(<InterpretationPanel vm={vm} model={model} />);
  expect(
    screen.getByRole("heading", { level: 2, name: "Diễn giải" }),
  ).toBeVisible();
  expect(screen.getByText("Có 21 diễn giải cho lá số này")).toBeVisible();
  const core = screen.getByRole("heading", {
    level: 3,
    name: "Cốt lõi",
  }).parentElement!;
  expect(
    within(core)
      .getAllByRole("button")
      .filter((button) => button.getAttribute("aria-expanded") === "true"),
  ).toHaveLength(3);
  const planets = screen.getByRole("heading", {
    level: 3,
    name: "Các hành tinh",
  }).parentElement!;
  expect(
    within(planets)
      .getAllByRole("button")
      .filter((button) => button.getAttribute("aria-expanded") === "false"),
  ).toHaveLength(8);
});

it("PN-03 and PN-12: should retain independently toggled items after rerender", async () => {
  const user = userEvent.setup();
  const props = build(chartFull);
  const { rerender } = render(<InterpretationPanel {...props} />);
  await user.click(screen.getByRole("button", { name: /Sao Thủy/ }));
  expect(screen.getByRole("button", { name: /Sao Thủy/ })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  rerender(<InterpretationPanel {...props} />);
  expect(screen.getByRole("button", { name: /Sao Thủy/ })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  expect(screen.getByRole("button", { name: /Mặt Trời/ })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
});

it("PN-05: should move focus to the group heading without changing the URL hash", async () => {
  const user = userEvent.setup();
  const { vm, model } = build(chartFull);
  render(<InterpretationPanel vm={vm} model={model} />);
  const hash = window.location.hash;
  await user.click(screen.getByRole("link", { name: "Các hành tinh (8)" }));
  expect(document.activeElement).toBe(
    screen.getByRole("heading", { level: 3, name: "Các hành tinh" }),
  );
  expect(window.location.hash).toBe(hash);
});

it("PN-07 and PN-08: should show neutral no-house copy without inferring birth time", () => {
  const { vm, model } = build(chartNoHouses);
  const { container } = render(<InterpretationPanel vm={vm} model={model} />);
  expect(screen.getByText("Có 10 diễn giải cho lá số này")).toBeVisible();
  expect(screen.getByText(/Dữ liệu Nhà/)).toBeVisible();
  expect(container.textContent).not.toMatch(/giờ sinh|birth/i);
  expect(screen.queryByText(/Theo nhà/)).not.toBeInTheDocument();
  expect(
    screen.getByText("Cung Mọc chưa khả dụng cho lá số này."),
  ).toBeInTheDocument();
});

it("PN-06 and PN-06b: should distinguish unpublished content from unavailable model data", () => {
  const base = build(chartFull);
  const unpublishedDto = {
    ...chartFull,
    interpretations: [],
    interpretationVersion: null,
  };
  const unpublished = buildInterpretationModel(unpublishedDto, base.vm);
  const { rerender } = render(
    <InterpretationPanel vm={base.vm} model={unpublished} />,
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "Nội dung diễn giải chưa được phát hành",
  );
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();

  const broken = buildInterpretationModel(
    { ...chartFull, interpretations: null as never },
    base.vm,
  );
  rerender(<InterpretationPanel vm={base.vm} model={broken} />);
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Hiện chưa thể hiển thị diễn giải",
  );
  expect(
    screen.queryByText("Nội dung diễn giải chưa được phát hành"),
  ).not.toBeInTheDocument();
});

it("PN-04: should not render empty groups in navigation or sections", () => {
  const { vm, model } = build(chartFull);
  const singleGroupModel = {
    ...model,
    groups: [model.groups[0]!], // only core group
  };
  render(<InterpretationPanel vm={vm} model={singleGroupModel} />);
  expect(
    screen.getByRole("heading", { level: 3, name: "Cốt lõi" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { level: 3, name: "Các hành tinh" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /Các hành tinh/ }),
  ).not.toBeInTheDocument();
});

it("PN-09: should not leak malformed or unsupported entries into the DOM", () => {
  const base = build(chartFull);
  const malformedDto = {
    ...chartFull,
    interpretations: [
      ...(chartFull.interpretations ?? []),
      {
        type: "PlanetInSign",
        planet: "Sun",
        sign: "Aries",
        language: "en",
        contentSource: "manual",
        interpretationVersion: "1.0",
        bodyText: "This English text must not leak into DOM",
      } as never,
      {
        type: "UnknownType" as never,
        planet: "Sun",
        sign: "Aries",
        language: "vi",
        contentSource: "manual",
        interpretationVersion: "1.0",
        bodyText: "Unknown type text",
      },
    ],
  };
  const malformedModel = buildInterpretationModel(
    malformedDto as never,
    base.vm,
  );
  const { container } = render(
    <InterpretationPanel vm={base.vm} model={malformedModel} />,
  );
  expect(
    screen.getByRole("heading", { level: 2, name: "Diễn giải" }),
  ).toBeInTheDocument();
  expect(container.textContent).not.toContain(
    "This English text must not leak into DOM",
  );
  expect(container.textContent).not.toContain("Unknown type text");
  expect(container.textContent).not.toMatch(/UnknownType|contentSource|_in_/);
});

it("PN-10: should be purely props-driven without external state side effects", () => {
  const { vm, model } = build(chartFull);
  const { rerender } = render(<InterpretationPanel vm={vm} model={model} />);
  expect(screen.getByText("Có 21 diễn giải cho lá số này")).toBeInTheDocument();

  const updatedModel = { ...model, availableCount: 5 };
  rerender(<InterpretationPanel vm={vm} model={updatedModel} />);
  expect(screen.getByText("Có 5 diễn giải cho lá số này")).toBeInTheDocument();
});

it("PN-11: should operate independently of selection state", () => {
  const { vm, model } = build(chartFull);
  const { rerender } = render(<InterpretationPanel vm={vm} model={model} />);
  const initialButtons = screen.getAllByRole("button");
  const initialExpandedStates = initialButtons.map((btn) =>
    btn.getAttribute("aria-expanded"),
  );

  rerender(<InterpretationPanel vm={{ ...vm }} model={{ ...model }} />);
  const rerenderedButtons = screen.getAllByRole("button");
  const rerenderedStates = rerenderedButtons.map((btn) =>
    btn.getAttribute("aria-expanded"),
  );

  expect(rerenderedStates).toEqual(initialExpandedStates);
});

it("PN-A: should pass axe for full and no-house chart states", async () => {
  const full = build(chartFull);
  const { container, rerender } = render(<InterpretationPanel {...full} />);
  expect(await axe(container)).toHaveNoViolations();
  rerender(<InterpretationPanel {...build(chartNoHouses)} />);
  expect(await axe(container)).toHaveNoViolations();
});
