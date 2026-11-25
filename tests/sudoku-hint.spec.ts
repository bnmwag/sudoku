import { describe, expect, it } from "vitest";

import { createCells, type ICell } from "@/lib/sudoku-board";
import { generatePuzzle, generateSolved } from "@/lib/sudoku-helpers";
import { getHint, getHintCells } from "@/lib/sudoku-hint";
import { getHintText, getStepText } from "@/lib/sudoku-hint-text";

/**
 * Board from a solved grid with some cells cleared.
 * @param solution Solved values.
 * @param empty Cells to clear.
 */
const createBoard = (solution: number[], empty: number[]): ICell[] =>
  createCells(solution.map((v, i) => (empty.includes(i) ? "" : String(v))));

describe("getHint()", () => {
  it("leads to the solution on generated puzzles of every difficulty", () => {
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      for (let n = 0; n < 8; n++) {
        const { puzzle, solution } = generatePuzzle(difficulty);
        const answer = solution.map(Number);
        const cells = createCells(puzzle);

        for (let hint = getHint(cells, answer); hint; ) {
          expect(hint.digit).toBe(answer[hint.index]);
          expect(hint.steps.length).toBeLessThanOrEqual(4);
          cells[hint.index] = { ...cells[hint.index], value: hint.digit };
          hint = getHint(cells, answer);
        }
        expect(cells.map((c) => c.value)).toEqual(answer);
      }
    }
  });

  it("flags a wrong digit first and names the clash", () => {
    const solution = generateSolved();
    const cells = createBoard(solution, [0, 1]);
    cells[0] = { ...cells[0], value: solution[2] };

    const hint = getHint(cells, solution);
    expect(hint).toMatchObject({ kind: "wrong", index: 0, conflict: 2 });
    expect(hint && getHintText(hint, cells)).toMatch(
      new RegExp(`^There's already an? ${solution[2]} in this row\\.$`),
    );
    expect(hint && getHintCells(hint, cells).reason).toEqual(new Set([2]));
  });

  it("finds a full house when one cell is missing", () => {
    const solution = generateSolved();
    const cells = createBoard(solution, [40]);

    const hint = getHint(cells, solution);
    expect(hint).toMatchObject({
      kind: "full-house",
      index: 40,
      digit: solution[40],
      house: { kind: "box", index: 4 },
    });
  });

  it("returns null on a solved board", () => {
    const solution = generateSolved();
    expect(getHint(createBoard(solution, []), solution)).toBeNull();
  });
});

describe("getStepText()", () => {
  it("explains a pointing step with 1-based names", () => {
    expect(
      getStepText({
        kind: "pointing",
        digits: [3],
        houses: [{ kind: "box", index: 3 }],
        targets: [{ kind: "row", index: 4 }],
        cells: [36, 37],
      }),
    ).toBe(
      "In box 4, 3 only fits in row 5. So 3 can't go anywhere else in row 5.",
    );
  });
});
