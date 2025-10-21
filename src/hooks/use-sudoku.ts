"use client";

import { useSudokuStore } from "./use-sudoku-store";

export function useSudoku() {
  const state = useSudokuStore((s) => s);
  const counts = (() => {
    const map = Array(10).fill(0);
    for (const v of state.cells) if (v) map[Number(v)]++;
    return map as number[];
  })();
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };
  const moveIndex = (i: number, dir: "up" | "down" | "left" | "right") => {
    const r = Math.floor(i / 9),
      c = i % 9;
    let nr = r,
      nc = c;
    if (dir === "up") nr = Math.max(0, r - 1);
    if (dir === "down") nr = Math.min(8, r + 1);
    if (dir === "left") nc = Math.max(0, c - 1);
    if (dir === "right") nc = Math.min(8, c + 1);
    return nr * 9 + nc;
  };
  return { ...state, counts, formatTime, moveIndex };
}
