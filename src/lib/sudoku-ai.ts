import { boxId, colId, constraintScore, rowId } from "./sudoku-helpers";

/**
 * Reason why the AI selected a given move.
 */
export type AIReason =
  | "fix-wrong" // existing user value was wrong, corrected first
  | "naked-single" // cell had exactly one candidate
  | "hidden-single-row" // digit fits in only one cell of a row
  | "hidden-single-col" // digit fits in only one cell of a column
  | "hidden-single-box" // digit fits in only one cell of a 3x3 box
  | "most-constrained"; // fallback: pick tightest cell and place solution

/**
 * One step of AI output.
 */
export interface AIMove {
  /** Index of the cell to fill (0..80). */
  index: number;
  /** Digit to place as a string "1".."9". */
  value: string;
  /** Heuristic used for this choice. */
  reason: AIReason;
}

/** Utility: 0..n-1 */
const R = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Row/col/box unit indices for convenience. */
const rows: number[][] = R(9).map((r) => R(9).map((c) => r * 9 + c));
const cols: number[][] = R(9).map((c) => R(9).map((r) => r * 9 + c));
const boxes: number[][] = R(9).map((b) => {
  const br = Math.floor(b / 3) * 3;
  const bc = (b % 3) * 3;
  const out: number[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) out.push((br + r) * 9 + (bc + c));
  return out;
});

/**
 * Precomputed peers (row ∪ col ∪ box, minus self).
 */
const peers: number[][] = R(81).map((i) => {
  const set = new Set<number>();
  for (const p of rows[rowId(i)]) set.add(p);
  for (const p of cols[colId(i)]) set.add(p);
  for (const p of boxes[boxId(i)]) set.add(p);
  set.delete(i);
  return [...set];
});

type Cand = Set<number>;

/**
 * Compute candidate digit sets for each empty cell.
 * @param cells Board values: "1".."9" or "".
 * @returns Array of 81 candidate sets; empty set for filled cells.
 */
export function computeCandidates(cells: string[]): Cand[] {
  const cand: Cand[] = Array(81);
  for (let i = 0; i < 81; i++) {
    if (cells[i]) {
      cand[i] = new Set();
      continue;
    }
    const used = new Set<number>();
    for (const p of peers[i]) if (cells[p]) used.add(Number(cells[p]));
    const s = new Set<number>();
    for (let d = 1; d <= 9; d++) if (!used.has(d)) s.add(d);
    cand[i] = s;
  }
  return cand;
}

/**
 * Returns an AI move that *looks* like human reasoning.
 * Order: fix wrong → naked single → hidden single (row/col/box) → most constrained.
 *
 * If no move exists (already solved), returns null.
 *
 * @param cells Current values, length 81.
 * @param fixed True for clue cells (uneditable).
 * @param solution Solved board as strings, length 81.
 */
export function nextAIMove(
  cells: string[],
  fixed: boolean[],
  solution: string[],
): AIMove | null {
  // 0) Fix wrong non-fixed entries (corrects mistakes first).
  for (let i = 0; i < 81; i++) {
    if (fixed[i]) continue;
    if (cells[i] && cells[i] !== solution[i]) {
      return { index: i, value: solution[i], reason: "fix-wrong" };
    }
  }

  const cand = computeCandidates(cells);

  // 1) Naked single
  for (let i = 0; i < 81; i++) {
    if (fixed[i]) continue;
    if (!cells[i] && cand[i].size === 1) {
      const [only] = [...cand[i]];
      return { index: i, value: String(only), reason: "naked-single" };
    }
  }

  // 2) Hidden singles in rows, columns, boxes (in that order)
  // rows
  for (let r = 0; r < 9; r++) {
    const where = new Map<number, number[]>();
    for (const i of rows[r]) {
      if (fixed[i] || cells[i]) continue;
      for (const v of cand[i]) {
        if (!where.has(v)) where.set(v, [i]);
        else where.get(v)?.push(i);
      }
    }
    for (const [v, pos] of where) {
      if (pos.length === 1) {
        const i = pos[0];
        return { index: i, value: String(v), reason: "hidden-single-row" };
      }
    }
  }

  // 3) Hidden singles in columns
  for (let c = 0; c < 9; c++) {
    const where = new Map<number, number[]>();
    for (const i of cols[c]) {
      if (fixed[i] || cells[i]) continue;
      for (const v of cand[i]) {
        if (!where.has(v)) where.set(v, [i]);
        else where.get(v)?.push(i);
      }
    }
    for (const [v, pos] of where) {
      if (pos.length === 1) {
        const i = pos[0];
        return { index: i, value: String(v), reason: "hidden-single-col" };
      }
    }
  }

  // 4) Hidden singles in boxes
  for (let b = 0; b < 9; b++) {
    const where = new Map<number, number[]>();
    for (const i of boxes[b]) {
      if (fixed[i] || cells[i]) continue;
      for (const v of cand[i]) {
        if (!where.has(v)) where.set(v, [i]);
        else where.get(v)?.push(i);
      }
    }
    for (const [v, pos] of where) {
      if (pos.length === 1) {
        const i = pos[0];
        return { index: i, value: String(v), reason: "hidden-single-box" };
      }
    }
  }

  let best = -1;
  let score = -1;
  for (let i = 0; i < 81; i++) {
    if (fixed[i] || cells[i]) continue;
    const s = constraintScore(cells, i);
    if (s > score) {
      score = s;
      best = i;
    }
  }
  if (best !== -1) {
    return { index: best, value: solution[best], reason: "most-constrained" };
  }

  return null;
}
