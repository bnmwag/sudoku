/**
 * Difficulty presets that influence the number of given clues.
 */
export type Difficulty = "easy" | "medium" | "hard";

/**
 * Inclusive range helper: [0, n).
 * @param n Upper bound (non-negative).
 * @returns Array of indices from 0 to n-1.
 */
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/**
 * In-place Fisher–Yates shuffle (returns a new array).
 * @param arr Input items.
 * @returns Shuffled copy of the input.
 */
const shuffle = <T>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Zero-based row index for a linear cell index.
 * @param i Linear index (0..80).
 */
const row = (i: number) => Math.floor(i / 9);

/**
 * Zero-based column index for a linear cell index.
 * @param i Linear index (0..80).
 */
const col = (i: number) => i % 9;

/**
 * Checks whether placing a value at a position is valid w.r.t. Sudoku rules.
 * Expects `board` to use 0 for blanks and 1..9 for digits.
 *
 * @param board 81-cell board (row-major).
 * @param i Linear index to test (0..80).
 * @param val Digit 1..9 to try.
 * @returns True if `val` can be placed at `i` without conflicts.
 */
function isSafe(board: number[], i: number, val: number) {
  const r = row(i);
  const c = col(i);

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

/**
 * Generates a fully solved Sudoku grid.
 * The result is a 9×9 solution encoded as an 81-length number array.
 *
 * @returns Solved board where all entries are 1..9.
 */
export function generateSolved(): number[] {
  const board = Array(81).fill(0);

  // Precompute peer lists for speed
  const rowOf = (i: number) => Math.floor(i / 9);
  const colOf = (i: number) => i % 9;
  const boxTop = (r: number) => Math.floor(r / 3) * 3;
  const boxLeft = (c: number) => Math.floor(c / 3) * 3;

  const peers: number[][] = Array.from({ length: 81 }, (_, i) => {
    const r = rowOf(i),
      c = colOf(i);
    const ps = new Set<number>();
    for (let x = 0; x < 9; x++) {
      ps.add(r * 9 + x);
      ps.add(x * 9 + c);
    }
    const br = boxTop(r),
      bc = boxLeft(c);
    for (let rr = 0; rr < 3; rr++)
      for (let cc = 0; cc < 3; cc++) ps.add((br + rr) * 9 + (bc + cc));
    ps.delete(i);
    return Array.from(ps);
  });

  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  function candidates(idx: number): number[] {
    const used = new Set<number>();
    for (const p of peers[idx]) {
      const v = board[p];
      if (v) used.add(v);
    }
    const opts = digits.filter((d) => !used.has(d));
    return shuffle(opts);
  }

  function nextIndex(): number {
    // Choose the empty cell with the fewest candidates (MRV)
    let bestIdx = -1;
    let bestSize = 10;
    for (let i = 0; i < 81; i++) {
      if (board[i] !== 0) continue;
      const opts = candidates(i);
      const s = opts.length;
      if (s < bestSize) {
        bestSize = s;
        bestIdx = i;
        if (s <= 1) break; // early exit if very constrained
      }
    }
    return bestIdx;
  }

  function fill(): boolean {
    const idx = nextIndex();
    if (idx === -1) return true; // solved
    const opts = candidates(idx);
    for (const v of opts) {
      if (isSafe(board, idx, v)) {
        board[idx] = v;
        if (fill()) return true;
        board[idx] = 0;
      }
    }
    return false;
  }

  // Kick off with a randomized seed row to diversify solutions quickly
  const firstRow = shuffle(digits);
  for (let c = 0; c < 9; c++) board[c] = firstRow[c];

  // If that seed leads to dead end (unlikely), clear and try again
  if (!fill()) {
    board.fill(0);
    fill();
  }
  return board;
}

/**
 * Counts the number of solutions for the given partially filled board.
 * Uses backtracking with an early exit once `limit` is reached.
 *
 * @param board 81-cell board (0 = blank). Mutated during search.
 * @param limit Maximum number of solutions to search for (default 2).
 * @returns Number of solutions found up to `limit`.
 */
export function countSolutions(board: number[], limit = 2): number {
  let count = 0;
  function backtrack() {
    if (count >= limit) return;
    const idx = board.indexOf(0);
    if (idx === -1) {
      count++;
      return;
    }
    for (let v = 1; v <= 9; v++) {
      if (isSafe(board, idx, v)) {
        board[idx] = v;
        backtrack();
        board[idx] = 0;
        if (count >= limit) return;
      }
    }
  }
  backtrack();
  return count;
}

/**
 * Structure returned by {@link generatePuzzle}.
 */
export interface GeneratedPuzzle {
  /** Starting grid: strings "1".."9" or "" for blanks (length 81). */
  puzzle: string[];
  /** Which cells are given clues (same length as `puzzle`). */
  fixed: boolean[];
  /** The solved grid as strings (length 81). */
  solution: string[];
}

/**
 * Generates a puzzle by removing numbers from a solved grid while preserving
 * uniqueness (exactly one solution). Clue counts depend on `diff`.
 *
 * @param diff Difficulty preset.
 * @returns The puzzle, clue mask, and the full solution.
 */
export function generatePuzzle(diff: Difficulty) {
  const solved = generateSolved();
  const puzzle = [...solved];

  // Difficulty → target clue range
  const ranges: Record<Difficulty, [number, number]> = {
    easy: [36, 49],
    medium: [30, 35],
    hard: [24, 29],
  };
  const [minClues, maxClues] = ranges[diff];
  const targetClues =
    Math.floor(Math.random() * (maxClues - minClues + 1)) + minClues;

  const clueCount = () => puzzle.reduce((n, v) => n + (v !== 0 ? 1 : 0), 0);

  // 180° rotational symmetry pairing: i ↔ 80 - i
  const pairs: Array<[number, number]> = [];
  const used = new Set<number>();
  const idxs = shuffle(range(81));
  for (const i of idxs) {
    if (used.has(i)) continue;
    const j = 80 - i;
    used.add(i);
    used.add(j);
    if (i === j)
      pairs.push([i, j]); // center cell (i=40)
    else pairs.push([i, j]);
  }

  // Try removing symmetric pairs while maintaining uniqueness
  for (const [a, b] of pairs) {
    if (clueCount() <= targetClues) break;

    const keepA = puzzle[a];
    const keepB = puzzle[b];
    if (keepA === 0 && keepB === 0) continue;

    // Tentatively remove both (or just one, if same center cell)
    puzzle[a] = 0;
    if (a !== b) puzzle[b] = 0;

    // Uniqueness check (early-exit 2-solution counter)
    const temp = [...puzzle];
    const unique = countSolutions(temp, 2) === 1;

    // Respect lower bound too
    if (!unique || clueCount() < targetClues) {
      // revert
      puzzle[a] = keepA;
      if (a !== b) puzzle[b] = keepB;
    }
  }

  // If still above target (uniqueness stopped us), do a single-cell cleanup pass without symmetry.
  if (clueCount() > targetClues) {
    const order = shuffle(range(81));
    for (const i of order) {
      if (clueCount() <= targetClues) break;
      if (puzzle[i] === 0) continue;
      const keep = puzzle[i];
      puzzle[i] = 0;
      const temp = [...puzzle];
      if (countSolutions(temp, 2) !== 1) puzzle[i] = keep;
    }
  }

  // Final guard: never below minClues (very unlikely with checks above)
  if (clueCount() < minClues) {
    // Add back random cells from solution until we reach minClues
    const empties = shuffle(range(81).filter((i) => puzzle[i] === 0));
    for (const i of empties) {
      if (clueCount() >= minClues) break;
      puzzle[i] = solved[i];
    }
  }

  const fixed = puzzle.map((v) => v !== 0);
  return {
    puzzle: puzzle.map((v) => (v ? String(v) : "")),
    fixed,
    solution: solved.map((v) => String(v)),
  };
}

/**
 * Computes all conflicting cell indices in a partially filled grid according
 * to Sudoku rules (row/column/box duplicates). Empty cells are ignored.
 *
 * Input is an array of strings so it can be used directly with UI state.
 *
 * @param vals Board values as strings: "1".."9" or "" (length 81).
 * @returns A set of linear indices (0..80) that are in conflict.
 */
export function computeConflicts(vals: string[]): Set<number> {
  const bad = new Set<number>();
  const range = (n: number) => Array.from({ length: n }, (_, i) => i);
  const groups: number[][] = [];

  for (let r = 0; r < 9; r++) groups.push(range(9).map((c) => r * 9 + c));

  for (let c = 0; c < 9; c++) groups.push(range(9).map((r) => r * 9 + c));

  for (let br = 0; br < 3; br++)
    for (let bc = 0; bc < 3; bc++) {
      const base = br * 27 + bc * 3;
      groups.push([
        base,
        base + 1,
        base + 2,
        base + 9,
        base + 10,
        base + 11,
        base + 18,
        base + 19,
        base + 20,
      ]);
    }

  for (const g of groups) {
    const seen = new Map<string, number[]>();
    for (const idx of g) {
      const v = vals[idx];
      if (!v) continue;
      if (!seen.has(v)) seen.set(v, [idx]);
      else seen.get(v)?.push(idx);
    }
    for (const [, idxs] of seen)
      if (idxs.length > 1) {
        for (const i of idxs) bad.add(i);
      }
  }

  return bad;
}

/**
 * Box index 0..8 for a linear cell index.
 * @param i Linear index (0..80).
 */
export const boxId = (i: number) =>
  Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3);

/**
 * Row index 0..8 for a linear cell index.
 * @param i Linear index (0..80).
 */
export const rowId = (i: number) => Math.floor(i / 9);

/**
 * Column index 0..8 for a linear cell index.
 * @param i Linear index (0..80).
 */
export const colId = (i: number) => i % 9;

/**
 * Higher score = more constrained = "smarter" to fill now.
 * Counts how many peers in row/col/box are already filled.
 *
 * @param cells Current cell values.
 * @param i Cell index to score.
 * @returns Score 0..26.
 */
export const constraintScore = (cells: string[], i: number) => {
  const r = rowId(i);
  const c = colId(i);

  let score = 0;

  for (let x = 0; x < 9; x++) if (cells[r * 9 + x]) score++;
  for (let x = 0; x < 9; x++) if (cells[x * 9 + c]) score++;

  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;

  for (let rr = 0; rr < 3; rr++)
    for (let cc = 0; cc < 3; cc++) {
      if (cells[(br + rr) * 9 + (bc + cc)]) score++;
    }
  return score;
};
