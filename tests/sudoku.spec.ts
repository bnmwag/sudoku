import { describe, expect, it } from "vitest";
import {
  computeConflicts,
  countSolutions,
  type Difficulty,
  generatePuzzle,
  generateSolved,
} from "@/lib/sudoku-helpers";

const asNum = (s: string) => (s ? Number(s) : 0);
const toRows = (arr: number[]) =>
  Array.from({ length: 9 }, (_, r) => arr.slice(r * 9, r * 9 + 9));
const col = (arr: number[], c: number) =>
  Array.from({ length: 9 }, (_, r) => arr[r * 9 + c]);
const box = (arr: number[], br: number, bc: number) => {
  const out: number[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      out.push(arr[(br * 3 + r) * 9 + (bc * 3 + c)]);
    }
  return out;
};
const isPerm19 = (xs: number[]) => {
  const seen = new Set(xs);
  return (
    xs.length === 9 &&
    !seen.has(0) &&
    seen.size === 9 &&
    [...seen].every((n) => n >= 1 && n <= 9)
  );
};

describe("generateSolved()", () => {
  it("returns a full valid solved grid", () => {
    const solved = generateSolved();
    expect(solved).toHaveLength(81);

    for (const r of toRows(solved)) expect(isPerm19(r)).toBe(true);

    for (let c = 0; c < 9; c++) expect(isPerm19(col(solved, c))).toBe(true);

    for (let br = 0; br < 3; br++)
      for (let bc = 0; bc < 3; bc++) {
        expect(isPerm19(box(solved, br, bc))).toBe(true);
      }
  });
});

describe("computeConflicts()", () => {
  it("always returns a Set and detects duplicates", () => {
    const empty = Array(81).fill("");
    const conflictEmpty = computeConflicts(empty);
    expect(conflictEmpty).toBeInstanceOf(Set);
    expect(conflictEmpty.size).toBe(0);

    const rowDuplicate = [...empty];
    rowDuplicate[0] = "1";
    rowDuplicate[1] = "1";
    const conflictRow = computeConflicts(rowDuplicate);
    expect(conflictRow).toBeInstanceOf(Set);
    expect(conflictRow.size).toBeGreaterThan(0);
    expect(conflictRow.has(0) || conflictRow.has(1)).toBe(true);
  });
});

describe.each<[{ d: Difficulty }]>([
  [{ d: "easy" }],
  [{ d: "medium" }],
  [{ d: "hard" }],
])("generatePuzzle($d)", ({ d }) => {
  it("produces a uniquely solvable puzzle (run x3 for flake resistance)", () => {
    for (let k = 0; k < 3; k++) {
      const { puzzle, fixed, solution } = generatePuzzle(d);
      expect(puzzle).toHaveLength(81);
      expect(fixed).toHaveLength(81);
      expect(solution).toHaveLength(81);

      puzzle.forEach((v, i) => {
        if (fixed[i]) expect(v).not.toBe("");
      });

      const boardNums = puzzle.map(asNum);
      const nSolutions = countSolutions([...boardNums], 2);
      expect(nSolutions).toBe(1);

      const filled = puzzle.map((v, i) => (v ? asNum(v) : asNum(solution[i])));

      for (const r of toRows(filled)) expect(isPerm19(r)).toBe(true);
      for (let c = 0; c < 9; c++) expect(isPerm19(col(filled, c))).toBe(true);
      for (let br = 0; br < 3; br++)
        for (let bc = 0; bc < 3; bc++) {
          expect(isPerm19(box(filled, br, bc))).toBe(true);
        }

      const noConflicts = computeConflicts(filled.map(String));
      expect(noConflicts.size).toBe(0);
    }
  });
});
