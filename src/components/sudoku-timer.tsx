"use client";

import { type FC, useEffect, useState } from "react";

import { useSudoku } from "@/hooks/use-sudoku";

export const SudokuTimer: FC = () => {
  const { completedInMs, startAt } = useSudoku();
  const [elapsed, setElapsed] = useState(0);

  // 🎉 Fire confetti once on completion
  useEffect(() => {
    if (completedInMs != null) {
    }
  }, [completedInMs]);

  // ⏱ Keep updating elapsed time while playing
  useEffect(() => {
    if (!startAt) return;

    const tick = () => {
      const now = Date.now();
      const diff = completedInMs != null ? completedInMs : now - startAt;
      setElapsed(diff);
    };

    tick(); // initial
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startAt, completedInMs]);

  if (!startAt) return null;

  const seconds = Math.floor(elapsed / 1000);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <span className="ml-3 opacity-80 text-xs font-mono">
      {completedInMs != null ? "Completed with " : ""}
      {mm}:{ss}
    </span>
  );
};
