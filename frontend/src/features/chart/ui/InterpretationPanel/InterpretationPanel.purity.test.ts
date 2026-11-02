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
const source = (name: string) => readFileSync(resolve(directory, name), "utf8");

describe("interpretation component source constraints", () => {
  it("renders only safe text and has no selection or network side effects", () => {
    for (const name of componentFiles) {
      const code = source(name);
      expect(code).not.toMatch(
        /dangerouslySetInnerHTML|insertAdjacentHTML|innerHTML/,
      );
      expect(code).not.toMatch(
        /useReducer|fetch\(|axios|localStorage|window\.location|dispatch\(|onSelect/,
      );
      expect(code).not.toMatch(/giờ sinh|birth|_in_|subjectKey/);
      expect(
        [...code].every((character) => character.codePointAt(0)! <= 127),
      ).toBe(true);
    }
  });

  it("keeps user-facing text and disallowed headings out of components", () => {
    const allComponents = componentFiles.map(source).join("\n");
    expect(allComponents).not.toMatch(
      /Vị trí hành tinh|Nhà và các góc|Góc chiếu|Chi tiết đang chọn|Lá số sinh|Lá số của tôi/,
    );
  });
});
