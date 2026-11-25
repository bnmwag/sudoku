"use client";

import type { ComponentProps, FC } from "react";

import { useKeyboardControls } from "@/hooks/use-keyboard-controls";
import { usePauseWhenHidden } from "@/hooks/use-pause-when-hidden";
import { cn } from "@/lib/utils";

import { SudokuGrid } from "./sudoku-grid";
import { SudokuHeader } from "./sudoku-header";
import { SudokuKeypad } from "./sudoku-keypad";
import { SudokuModeToggle } from "./sudoku-mode-toggle";
import { SudokuToolbar } from "./sudoku-toolbar";

interface ISudokuGameProps extends ComponentProps<"div"> {}

export const SudokuGame: FC<ISudokuGameProps> = ({ className, ...props }) => {
  useKeyboardControls();
  usePauseWhenHidden();

  return (
    <div
      className={cn(
        // Fit the board, mode toggle, toolbar and keypad on one phone screen.
        "flex w-[max(17rem,min(100vw_-_2rem,32rem,100svh_-_19rem))] flex-col gap-3",
        className,
      )}
      {...props}
    >
      <SudokuHeader />
      <SudokuGrid />
      <SudokuModeToggle className="mt-1" />
      <SudokuToolbar />
      <SudokuKeypad />
    </div>
  );
};
