"use client";

import confetti from "canvas-confetti";
import { type FC, useEffect } from "react";
import { useSudoku } from "@/hooks/use-sudoku";

export const SudokuTimer: FC = () => {
  const { completedInMs, startAt } = useSudoku();

  useEffect(() => {
    if (completedInMs != null) {
      confetti({ spread: 70, origin: { y: 0.6 } });
      confetti({ particleCount: 120, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({
        particleCount: 120,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }
  }, [completedInMs]);

  if (completedInMs == null || startAt == null) return null;

  const s = Math.floor(completedInMs / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");

  return (
    <span className="ml-3 opacity-80">
      Completed in {mm}:{ss}
    </span>
  );
};
