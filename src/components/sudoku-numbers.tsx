"use client";

import type { FC } from "react";
import { useSudoku } from "@/hooks/use-sudoku";
import { cn } from "@/lib/utils";
import { uuid } from "@/lib/uuid";

export const SudokuNumbers: FC = () => {
  const { counts } = useSudoku();

  return (
    <div className="flex items-center gap-x-2 flex-wrap text-sm">
      {Array.from({ length: 9 }, (_, k) => k + 1).map((n) => (
        <div
          key={uuid()}
          className={cn("py-1 text-center", counts[n] >= 9 ? "opacity-30" : "")}
        >
          {n}
        </div>
      ))}
    </div>
  );
};
