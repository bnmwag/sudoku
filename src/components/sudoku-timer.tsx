"use client";

import { type ComponentProps, type FC, useEffect, useState } from "react";

import { getElapsedMs, useSudokuStore } from "@/hooks/use-sudoku-store";
import { cn, formatTime } from "@/lib/utils";

interface ISudokuTimerProps extends ComponentProps<"span"> {}

export const SudokuTimer: FC<ISudokuTimerProps> = ({ className, ...props }) => {
  const game = useSudokuStore((s) => s.game);
  const [now, setNow] = useState(() => Date.now());
  const isRunning = game?.resumedAt != null;

  useEffect(() => {
    if (!isRunning) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [isRunning]);

  if (!game) return null;

  return (
    <span
      className={cn("font-mono text-xs tabular-nums", className)}
      {...props}
    >
      {formatTime(getElapsedMs(game, now))}
    </span>
  );
};
