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

// Local isSafe for tests (does not rely on lib internals)
const rowOf = (i: number) => Math.floor(i / 9);
const colOf = (i: number) => i % 9;

function isSafe(board: number[], i: number, val: number) {
  const r = rowOf(i);
  const c = colOf(i);

  // row / column checks
  for (let x = 0; x < 9; x++) {
    if (board[r * 9 + x] === val) return false;
    if (board[x * 9 + c] === val) return false;
  }

  // 3x3 box checks
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let rr = 0; rr < 3; rr++)
    for (let cc = 0; cc < 3; cc++) {
      if (board[(br + rr) * 9 + (bc + cc)] === val) return false;
    }

  return true;
}

// Deterministic single-solution solver for tests
function solveOne(initial: number[]): number[] | null {
  const board = [...initial];
  function backtrack(): boolean {
    const idx = board.indexOf(0);
    if (idx === -1) return true;
    for (let v = 1; v <= 9; v++) {
      if (isSafe(board, idx, v)) {
        board[idx] = v;
        if (backtrack()) return true;
        board[idx] = 0;
      }
    }
    return false;
  }
  return backtrack() ? board : null;
}

const ranges: Record<Difficulty, [number, number]> = {
  easy: [36, 49],
  medium: [30, 35],
  hard: [24, 29],
};

describe("generateSolved()", () => {
  it("returns a full valid solved grid", () => {
    const solved = generateSolved();
    expect(solved).toHaveLength(81);

    for (const r of toRows(solved)) expect(isPerm19(r)).toBe(true);
    for (let c = 0; c < 9; c++) expect(isPerm19(col(solved, c))).toBe(true);
    for (let br = 0; br < 3; br++)
      for (let bc = 0; bc < 3; bc++)
        expect(isPerm19(box(solved, br, bc))).toBe(true);
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
  it("produces a uniquely solvable puzzle whose provided solution is correct (run x3 for flake resistance)", () => {
    const [minClues, maxClues] = ranges[d];

    for (let k = 0; k < 3; k++) {
      const { puzzle, fixed, solution } = generatePuzzle(d);

      // basic shapes
      expect(puzzle).toHaveLength(81);
      expect(fixed).toHaveLength(81);
      expect(solution).toHaveLength(81);

      // fixed cells must be non-empty and must match solution
      puzzle.forEach((v, i) => {
        if (fixed[i]) {
          expect(v).not.toBe("");
          expect(v).toBe(solution[i]);
        }
      });

      // givens should not conflict among themselves
      const givensOnly = puzzle.slice(); // strings
      const conflictsInGivens = computeConflicts(givensOnly);
      expect(conflictsInGivens.size).toBe(0);

      // clue count within expected range
      const clueCount = puzzle.reduce((n, v) => n + (v ? 1 : 0), 0);
      expect(clueCount).toBeGreaterThanOrEqual(minClues);
      expect(clueCount).toBeLessThanOrEqual(maxClues);

      // uniqueness check (early-exit counter)
      const boardNums = puzzle.map(asNum);
      const nSolutions = countSolutions([...boardNums], 2);
      expect(nSolutions).toBe(1);

      // independently solve the puzzle and compare to provided solution
      const solvedByTest = solveOne(boardNums);
      if (!solvedByTest) {
        console.log("Failed to solve:", puzzle);
        console.log("Solution:", solution);
        expect(false).toBe(true);
        return;
      }

      expect(solvedByTest).not.toBeNull();
      const solvedStrings = solvedByTest.map(String);
      expect(solvedStrings).toEqual(solution);

      // final grid must be valid (rows/cols/boxes permutations 1..9)
      for (const r of toRows(solvedByTest)) expect(isPerm19(r)).toBe(true);
      for (let c = 0; c < 9; c++)
        expect(isPerm19(col(solvedByTest, c))).toBe(true);
      for (let br = 0; br < 3; br++)
        for (let bc = 0; bc < 3; bc++)
          expect(isPerm19(box(solvedByTest, br, bc))).toBe(true);

      // also ensure no conflicts on the fully solved board
      const noConflicts = computeConflicts(solvedStrings);
      expect(noConflicts.size).toBe(0);
    }
  });
});
