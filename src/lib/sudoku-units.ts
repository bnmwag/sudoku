const range9 = Array.from({ length: 9 }, (_, i) => i);

/**
 * Row index 0..8 for a linear cell index.
 * @param i Linear index (0..80).
 */
export const getRow = (i: number) => Math.floor(i / 9);

/**
 * Column index 0..8 for a linear cell index.
 * @param i Linear index (0..80).
 */
export const getCol = (i: number) => i % 9;

/**
 * Box index 0..8 for a linear cell index.
 * @param i Linear index (0..80).
 */
export const getBox = (i: number) =>
  Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3);

/** Cell indices of every row. */
export const ROWS: number[][] = range9.map((r) => range9.map((c) => r * 9 + c));

/** Cell indices of every column. */
export const COLS: number[][] = range9.map((c) => range9.map((r) => r * 9 + c));

/** Cell indices of every 3x3 box. */
export const BOXES: number[][] = range9.map((b) => {
  const top = Math.floor(b / 3) * 3;
  const left = (b % 3) * 3;
  return range9.map((k) => (top + Math.floor(k / 3)) * 9 + left + (k % 3));
});

/** Rows, then columns, then boxes. */
export const UNITS: number[][] = [...ROWS, ...COLS, ...BOXES];

/** For each cell, every other cell sharing its row, column or box. */
export const PEERS: number[][] = Array.from({ length: 81 }, (_, i) => {
  const peers = new Set([
    ...ROWS[getRow(i)],
    ...COLS[getCol(i)],
    ...BOXES[getBox(i)],
  ]);
  peers.delete(i);
  return [...peers];
});
