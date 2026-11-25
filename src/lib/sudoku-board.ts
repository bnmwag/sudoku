import { computeConflicts } from "@/lib/sudoku-helpers";
import { getCol, getRow, PEERS, UNITS } from "@/lib/sudoku-units";

/** How a digit press is applied to the selected cells. */
export type InputMode = "normal" | "corner" | "center";

export interface ICell {
  /** Placed digit 1..9, or 0 when empty. */
  value: number;
  /** True for clues from the puzzle. */
  given: boolean;
  /** Corner marks, sorted ascending. */
  corner: number[];
  /** Center marks, sorted ascending. */
  center: number[];
}

export const INPUT_MODES: InputMode[] = ["normal", "corner", "center"];

/**
 * Creates board cells from a generated puzzle.
 * @param puzzle 81 strings, "1".."9" or "" for blanks.
 */
export const createCells = (puzzle: string[]): ICell[] =>
  puzzle.map((v) => ({
    value: v ? Number(v) : 0,
    given: v !== "",
    corner: [],
    center: [],
  }));

/**
 * Board values as strings, the format the generator and solver use.
 * @param cells Board cells.
 */
export const getValueStrings = (cells: ICell[]) =>
  cells.map((c) => (c.value ? String(c.value) : ""));

/**
 * Indices of cells that repeat a digit in their row, column or box.
 * @param cells Board cells.
 */
export const getConflicts = (cells: ICell[]): Set<number> =>
  computeConflicts(getValueStrings(cells));

/**
 * Indices of filled cells whose digit differs from the solution.
 * @param cells Board cells.
 * @param solution Solved values 1..9.
 */
export const getWrongCells = (cells: ICell[], solution: number[]) => {
  const wrong = new Set<number>();
  cells.forEach((c, i) => {
    if (c.value && c.value !== solution[i]) wrong.add(i);
  });
  return wrong;
};

/**
 * How many times each digit is placed. Index 0 is unused.
 * @param cells Board cells.
 */
export const getDigitCounts = (cells: ICell[]) => {
  const counts = Array<number>(10).fill(0);
  for (const c of cells) if (c.value) counts[c.value]++;
  return counts;
};

/**
 * Indices into UNITS of every row, column or box that is full and has no repeats.
 * @param cells Board cells.
 */
export const getCompletedUnits = (cells: ICell[]) => {
  const done = new Set<number>();
  UNITS.forEach((unit, u) => {
    const digits = new Set(unit.map((i) => cells[i].value));
    if (digits.size === 9 && !digits.has(0)) done.add(u);
  });
  return done;
};

/**
 * True when every cell matches the solution.
 * @param cells Board cells.
 * @param solution Solved values 1..9.
 */
export const isSolved = (cells: ICell[], solution: number[]) =>
  cells.every((c, i) => c.value === solution[i]);

/**
 * Adds or removes one digit from a sorted list of marks.
 * @param marks Current marks.
 * @param digit Digit 1..9.
 * @param add Add when true, remove when false.
 */
const setMark = (marks: number[], digit: number, add: boolean) => {
  if (!add) return marks.filter((d) => d !== digit);
  if (marks.includes(digit)) return marks;
  return [...marks, digit].sort((a, b) => a - b);
};

/**
 * Removes a digit from the corner and center marks of every peer of the given cells.
 * Mutates `cells`, which must already be a copy.
 * @param cells Board cells (copy).
 * @param sources Cells that just received `digit`.
 * @param digit Digit 1..9.
 */
const clearPeerMarks = (cells: ICell[], sources: number[], digit: number) => {
  for (const i of sources) {
    for (const p of PEERS[i]) {
      const peer = cells[p];
      if (!peer.corner.includes(digit) && !peer.center.includes(digit)) {
        continue;
      }
      cells[p] = {
        ...peer,
        corner: setMark(peer.corner, digit, false),
        center: setMark(peer.center, digit, false),
      };
    }
  }
};

/**
 * Applies a digit to every editable cell in the selection.
 * Normal mode places the digit, or clears it when every target already holds it.
 * Corner and center mode toggle the mark on empty targets.
 * @param cells Board cells.
 * @param selection Selected cell indices.
 * @param digit Digit 1..9.
 * @param mode Input mode.
 * @param autoClearNotes Remove the digit from peer marks when placing it.
 * @returns The new cells, or null when nothing could change.
 */
export const applyDigit = (
  cells: ICell[],
  selection: number[],
  digit: number,
  mode: InputMode,
  autoClearNotes: boolean,
): ICell[] | null => {
  const editable = selection.filter((i) => !cells[i].given);
  const next = [...cells];

  if (mode === "normal") {
    if (editable.length === 0) return null;
    const clear = editable.every((i) => cells[i].value === digit);
    for (const i of editable) {
      next[i] = { ...next[i], value: clear ? 0 : digit };
    }
    if (!clear && autoClearNotes) clearPeerMarks(next, editable, digit);
    return next;
  }

  const empty = editable.filter((i) => cells[i].value === 0);
  if (empty.length === 0) return null;
  const remove = empty.every((i) => cells[i][mode].includes(digit));
  for (const i of empty) {
    next[i] = { ...next[i], [mode]: setMark(next[i][mode], digit, !remove) };
  }
  return next;
};

/**
 * Erases the selection: placed digits first, marks once no digits are left.
 * @param cells Board cells.
 * @param selection Selected cell indices.
 * @returns The new cells, or null when there was nothing to erase.
 */
export const eraseCells = (
  cells: ICell[],
  selection: number[],
): ICell[] | null => {
  const editable = selection.filter((i) => !cells[i].given);
  const withValue = editable.filter((i) => cells[i].value !== 0);
  const next = [...cells];

  if (withValue.length > 0) {
    for (const i of withValue) next[i] = { ...next[i], value: 0 };
    return next;
  }

  const withMarks = editable.filter(
    (i) => cells[i].corner.length > 0 || cells[i].center.length > 0,
  );
  if (withMarks.length === 0) return null;
  for (const i of withMarks) next[i] = { ...next[i], corner: [], center: [] };
  return next;
};

/**
 * Writes every possible digit into the center marks of each empty cell.
 * @param cells Board cells.
 */
export const fillCandidates = (cells: ICell[]): ICell[] =>
  cells.map((cell, i) => {
    if (cell.value) return cell;
    const used = new Set(PEERS[i].map((p) => cells[p].value));
    const center = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !used.has(d));
    return { ...cell, center };
  });

/**
 * Grid distance between two cells, used to stagger ripple animations.
 * @param a Cell index.
 * @param b Cell index.
 */
export const getCellDistance = (a: number, b: number) =>
  Math.abs(getRow(a) - getRow(b)) + Math.abs(getCol(a) - getCol(b));
