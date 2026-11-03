import { beforeEach, describe, expect, it } from "vitest";

import { focusChartObject } from "./focusChartObject";

describe("focusChartObject", () => {
  let root: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    root = document.createElement("div");
    document.body.appendChild(root);
  });

  it("FC-01: focuses the interactive element on the wheel when available", () => {
    root.innerHTML = `
      <div data-testid="chart-wheel">
        <svg>
          <g role="button" data-planet="Mars" tabindex="0"></g>
        </svg>
      </div>
      <div>
        <button data-planet-key="Mars">Mars Table Button</button>
      </div>
    `;
    const wheelTarget = root.querySelector(
      '[data-planet="Mars"]',
    ) as SVGElement;
    expect(focusChartObject(root, "Mars")).toBe(true);
    expect(document.activeElement).toBe(wheelTarget);
  });

  it("FC-02: matches exactly by planet key identity ignoring duplicates", () => {
    root.innerHTML = `
      <div data-testid="chart-wheel">
        <svg>
          <g role="button" data-planet="Mars#2" tabindex="0"></g>
          <g role="button" data-planet="Mars" tabindex="0"></g>
        </svg>
      </div>
    `;
    const marsTarget = root.querySelector('[data-planet="Mars"]') as SVGElement;
    expect(focusChartObject(root, "Mars")).toBe(true);
    expect(document.activeElement).toBe(marsTarget);
  });

  it("FC-03: falls back to PlanetTable button when wheel target is absent", () => {
    root.innerHTML = `
      <div data-testid="chart-wheel">
        <svg>
          <g role="button" data-planet="Venus" tabindex="0"></g>
        </svg>
      </div>
      <table>
        <tbody>
          <tr>
            <td>
              <button data-planet-key="Mars">Mars Table</button>
            </td>
          </tr>
        </tbody>
      </table>
    `;
    const tableButton = root.querySelector(
      'button[data-planet-key="Mars"]',
    ) as HTMLButtonElement;
    expect(focusChartObject(root, "Mars")).toBe(true);
    expect(document.activeElement).toBe(tableButton);
  });

  it("FC-04: falls back to card button in mobile view", () => {
    root.innerHTML = `
      <ul>
        <li>
          <button data-planet-key="Mars">Mars Card</button>
        </li>
      </ul>
    `;
    const cardButton = root.querySelector(
      'button[data-planet-key="Mars"]',
    ) as HTMLButtonElement;
    expect(focusChartObject(root, "Mars")).toBe(true);
    expect(document.activeElement).toBe(cardButton);
  });

  it("FC-05: returns false and keeps activeElement unchanged when target is not found", () => {
    const defaultButton = document.createElement("button");
    root.appendChild(defaultButton);
    defaultButton.focus();
    expect(document.activeElement).toBe(defaultButton);

    expect(focusChartObject(root, "Jupiter")).toBe(false);
    expect(document.activeElement).toBe(defaultButton);
  });

  it("FC-06: safely handles strange keys, empty strings or special characters without selector syntax errors", () => {
    expect(focusChartObject(root, "")).toBe(false);
    expect(focusChartObject(root, 'x"]')).toBe(false);
    expect(focusChartObject(null, "Mars")).toBe(false);
  });

  it("FC-07: returns false when target element is disconnected from the DOM", () => {
    const detachedRoot = document.createElement("div");
    detachedRoot.innerHTML = `
      <div data-testid="chart-wheel">
        <svg>
          <g role="button" data-planet="Mars" tabindex="0"></g>
        </svg>
      </div>
    `;
    expect(focusChartObject(detachedRoot, "Mars")).toBe(false);
  });
});
