import { describe, expect, it } from "vitest";

import {
  applyDigit,
  createCells,
  eraseCells,
  fillCandidates,
  getCompletedUnits,
  getWrongCells,
  type ICell,
} from "@/lib/sudoku-board";
import { PEERS } from "@/lib/sudoku-units";

const createEmpty = (): ICell[] => createCells(Array(81).fill(""));

describe("applyDigit()", () => {
  it("places a digit in every editable selected cell", () => {
    const next = applyDigit(createEmpty(), [0, 1, 2], 5, "normal", false);
    expect(next?.slice(0, 3).map((c) => c.value)).toEqual([5, 5, 5]);
  });

  it("clears the digit when every target already holds it", () => {
    const once = applyDigit(createEmpty(), [0], 5, "normal", false) ?? [];
    const twice = applyDigit(once, [0], 5, "normal", false);
    expect(twice?.[0].value).toBe(0);
  });

  it("skips givens and returns null when only givens are selected", () => {
    const puzzle = Array(81).fill("");
    puzzle[0] = "3";
    const cells = createCells(puzzle);
    expect(applyDigit(cells, [0], 5, "normal", false)).toBeNull();
    expect(applyDigit(cells, [0, 1], 5, "normal", false)?.[0].value).toBe(3);
  });

  it("toggles corner and center marks independently", () => {
    let cells = applyDigit(createEmpty(), [0], 4, "corner", false) ?? [];
    cells = applyDigit(cells, [0], 2, "corner", false) ?? [];
    cells = applyDigit(cells, [0], 7, "center", false) ?? [];
    expect(cells[0].corner).toEqual([2, 4]);
    expect(cells[0].center).toEqual([7]);

    cells = applyDigit(cells, [0], 4, "corner", false) ?? [];
    expect(cells[0].corner).toEqual([2]);
  });

  it("adds a mark to all targets unless all of them already have it", () => {
    let cells = applyDigit(createEmpty(), [0], 1, "center", false) ?? [];
    cells = applyDigit(cells, [0, 1], 1, "center", false) ?? [];
    expect(cells[0].center).toEqual([1]);
    expect(cells[1].center).toEqual([1]);
  });

  it("ignores marks on filled cells", () => {
    const filled = applyDigit(createEmpty(), [0], 9, "normal", false) ?? [];
    expect(applyDigit(filled, [0], 1, "corner", false)).toBeNull();
  });

  it("removes a placed digit from peer marks when enabled", () => {
    let cells = applyDigit(createEmpty(), PEERS[0], 6, "center", false) ?? [];
    cells = applyDigit(cells, [80], 6, "corner", false) ?? [];
    cells = applyDigit(cells, [0], 6, "normal", true) ?? [];
    for (const p of PEERS[0]) expect(cells[p].center).not.toContain(6);
    expect(cells[80].corner).toEqual([6]);
  });
});

describe("eraseCells()", () => {
  it("removes digits before marks", () => {
    let cells = applyDigit(createEmpty(), [0], 3, "center", false) ?? [];
    cells = applyDigit(cells, [0], 8, "normal", false) ?? [];

    cells = eraseCells(cells, [0]) ?? [];
    expect(cells[0].value).toBe(0);
    expect(cells[0].center).toEqual([3]);

    cells = eraseCells(cells, [0]) ?? [];
    expect(cells[0].center).toEqual([]);
    expect(eraseCells(cells, [0])).toBeNull();
  });
});

describe("fillCandidates()", () => {
  it("lists the digits not used by any peer", () => {
    const puzzle = Array(81).fill("");
    puzzle[1] = "1";
    puzzle[9] = "2";
    puzzle[10] = "3";
    puzzle[72] = "4";
    const cells = fillCandidates(createCells(puzzle));
    expect(cells[0].center).toEqual([5, 6, 7, 8, 9]);
    expect(cells[1].center).toEqual([]);
  });
});

describe("getCompletedUnits()", () => {
  it("reports a full row without repeats", () => {
    const puzzle = Array(81).fill("");
    for (let c = 0; c < 9; c++) puzzle[c] = String(c + 1);
    expect(getCompletedUnits(createCells(puzzle))).toEqual(new Set([0]));
  });
});

describe("getWrongCells()", () => {
  it("flags digits that differ from the solution", () => {
    const solution = Array(81).fill(1);
    const cells = applyDigit(createEmpty(), [0, 1], 2, "normal", false) ?? [];
    cells[1] = { ...cells[1], value: 1 };
    expect(getWrongCells(cells, solution)).toEqual(new Set([0]));
  });
});
