export type Difficulty = "easy" | "medium" | "hard";

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const shuffle = <T>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const row = (i: number) => Math.floor(i / 9);
const col = (i: number) => i % 9;

function isSafe(board: number[], i: number, val: number) {
  const r = row(i),
    c = col(i);
  for (let x = 0; x < 9; x++) {
    if (board[r * 9 + x] === val) return false;
    if (board[x * 9 + c] === val) return false;
  }
  const br = Math.floor(r / 3) * 3,
    bc = Math.floor(c / 3) * 3;
  for (let rr = 0; rr < 3; rr++)
    for (let cc = 0; cc < 3; cc++) {
      if (board[(br + rr) * 9 + (bc + cc)] === val) return false;
    }
  return true;
}

function solve(board: number[]): boolean {
  const idx = board.indexOf(0);
  if (idx === -1) return true;
  for (const v of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (isSafe(board, idx, v)) {
      board[idx] = v;
      if (solve(board)) return true;
      board[idx] = 0;
    }
  }
  return false;
}

export function generateSolved(): number[] {
  const board = Array(81).fill(0);
  for (let b = 0; b < 3; b++) {
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const br = b * 3,
      bc = b * 3;
    let k = 0;
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) {
        board[(br + r) * 9 + (bc + c)] = nums[k++];
      }
  }
  solve(board);
  return board;
}

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

export function generatePuzzle(diff: Difficulty) {
  const solved = generateSolved();
  const puzzle = [...solved];
  const ranges: Record<Difficulty, [number, number]> = {
    easy: [36, 49],
    medium: [30, 35],
    hard: [24, 29],
  };
  const [minClues, maxClues] = ranges[diff];
  const targetClues =
    Math.floor(Math.random() * (maxClues - minClues + 1)) + minClues;
  const order = shuffle(range(81));
  for (const idx of order) {
    const backup = puzzle[idx];
    if (backup === 0) continue;
    puzzle[idx] = 0;
    const temp = [...puzzle];
    if (countSolutions(temp, 2) !== 1) puzzle[idx] = backup;
    const cluesLeft = puzzle.filter((v) => v !== 0).length;
    if (cluesLeft <= targetClues) break;
  }
  const fixed = puzzle.map((v) => v !== 0);
  return {
    puzzle: puzzle.map((v) => (v ? String(v) : "")),
    fixed,
    solution: solved.map((v) => String(v)),
  };
}

export function computeConflicts(vals: string[]) {
  const bad = new Set<number>();
  const groups: number[][] = [];
}
