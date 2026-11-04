/// <reference types="node" />
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const directory = dirname(fileURLToPath(import.meta.url));
const componentFiles = [
  "InterpretationPanel.tsx",
  "InterpretationItem.tsx",
  "InterpretationOverview.tsx",
];
const allFiles = [...componentFiles, "interpretationCopy.ts", "index.ts"];
const source = (name: string) => readFileSync(resolve(directory, name), "utf8");

describe("interpretation component source constraints", () => {
  it("AR-01, AR-02, AR-03: renders only safe text and has no selection or network side effects", () => {
    for (const name of componentFiles) {
      const code = source(name);
      // AR-01: no innerHTML variants
      expect(code).not.toMatch(
        /dangerouslySetInnerHTML|insertAdjacentHTML|innerHTML/,
      );
      // AR-02: no state machines, network, storage, or selection bindings
      expect(code).not.toMatch(
        /useReducer|fetch\(|axios|localStorage|window\.location|dispatch\(|onSelect/,
      );
      expect(code).not.toMatch(/selection/);
      // AR-03: ASCII-only in component files, no raw keys
      expect(code).not.toMatch(/_in_|subjectKey/);
      expect(
        [...code].every((character) => character.codePointAt(0)! <= 127),
      ).toBe(true);
    }
  });

  it("AR-04: enforces strict import allowlist and forbids dynamic or side-effect imports", () => {
    const allowedImportPattern =
      /^import\s+(?:type\s+)?(?:(?:\*\s+as\s+\w+)|(?:[\w\s{},]+))\s+from\s+["'](react|lucide-react|@shared\/[^"']+|(?:\.\/|\.\.\/\.\.\/model\/)[^"']+)["'];?$/;

    for (const name of allFiles) {
      const code = source(name);
      // No dynamic import(), require(), or side-effect only import "..."
      expect(code).not.toMatch(/\bimport\s*\(/);
      expect(code).not.toMatch(/\brequire\s*\(/);
      expect(code).not.toMatch(/^import\s+["'][^"']+["'];?$/m);

      const importStatements = code.match(/^import\s+[^;]+;/gm) ?? [];
      for (const statement of importStatements) {
        expect(statement).toMatch(allowedImportPattern);
      }
    }
  });

  it("AR-05: enforces copy constraints on interpretationCopy.ts without colliding with F4", () => {
    const copyCode = source("interpretationCopy.ts");

    // 1. Never mentions birth time or birth
    expect(copyCode).not.toMatch(/giờ sinh|birth/i);

    // 2. No forbidden Playwright heading sub-strings
    expect(copyCode).not.toMatch(
      /Vị trí hành tinh|Nhà và các góc|Góc chiếu|Chi tiết đang chọn|Lá số sinh|Lá số của tôi/,
    );

    // 3. Disclosure labels don't start with action commands for charts
    expect(copyCode).not.toMatch(/["'](Chọn |Xóa bộ lọc theo)/);

    // 4. No verbatim collision with full Vitest F4 strings
    expect(copyCode).not.toContain("Dữ liệu Nhà và các góc chưa khả dụng");
    expect(copyCode).not.toContain("Dữ liệu chưa đầy đủ");
    expect(copyCode).not.toContain("Hệ nhà");
    expect(copyCode).not.toContain("Tính lúc");
  });

  it("AR-06: maintains M3 baseline for live region tokens across Panel, Item, Overview, and copy", () => {
    const livePattern = /aria-live|role="status"|role="alert"|aria-atomic/;
    for (const name of [
      "InterpretationItem.tsx",
      "InterpretationOverview.tsx",
      "interpretationCopy.ts",
    ]) {
      const code = source(name);
      expect(code).not.toMatch(livePattern);
    }

    const panelCode = source("InterpretationPanel.tsx");
    expect(panelCode).not.toMatch(livePattern);
    // Panel contains exactly one <Alert component
    const alertMatches = panelCode.match(/<Alert\b/g);
    expect(alertMatches).toHaveLength(1);
  });

  it("AR-07: ensures M3 components and focusChartObject contain no async timers or effects", () => {
    const asyncEffectPattern =
      /\b(?:setTimeout|setInterval|requestAnimationFrame|queueMicrotask|useEffect|useLayoutEffect)\b/;

    for (const name of componentFiles) {
      const code = source(name);
      expect(code).not.toMatch(asyncEffectPattern);
    }

    const focusHelperPath = resolve(
      directory,
      "../ChartViewerShell/focusChartObject.ts",
    );
    const focusCode = readFileSync(focusHelperPath, "utf8");
    expect(focusCode).not.toMatch(asyncEffectPattern);
  });

  it("AR-08: ensures copy constraints for C-14 and C-15 without colliding with F4", () => {
    const copyCode = source("interpretationCopy.ts");
    // C-14/C-15 do not contain "Chi tiết đang chọn", "Bỏ chọn", and do not start with "Chọn "
    expect(copyCode).not.toContain("Chi tiết đang chọn");
    expect(copyCode).not.toContain("Bỏ chọn");
    expect(copyCode).not.toMatch(/["']Chọn\s/);
    expect(copyCode).not.toMatch(/giờ sinh/i);
  });
});
