"use client";

import { type FC, useEffect } from "react";
import { useSudoku } from "@/hooks/use-sudoku";
import type { Difficulty } from "@/lib/sudoku-helpers";
import { cn } from "@/lib/utils";
import { uuid } from "@/lib/uuid";

export const SudokuDifficulty: FC = () => {
  const { difficulty, setDifficulty } = useSudoku();

  useEffect(() => {
    if (!difficulty) setDifficulty("easy");
  }, [difficulty, setDifficulty]);

  return (
    <div className="inline-flex">
      {["easy", "medium", "hard"].map((d) => (
        <button
          key={uuid()}
          type="button"
          onClick={() => {
            setDifficulty(d as Difficulty);
          }}
          className={cn(
            "text-xs px-1.5 uppercase cursor-pointer",
            d === difficulty
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "bg-transparent",
          )}
        >
          {d}
        </button>
      ))}
    </div>
  );
};
