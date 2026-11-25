"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ComponentProps, FC } from "react";

import { useKeyboardControls } from "@/hooks/use-keyboard-controls";
import { usePauseWhenHidden } from "@/hooks/use-pause-when-hidden";
import { getShownHint, useSudokuStore } from "@/hooks/use-sudoku-store";
import { cn } from "@/lib/utils";

import { SudokuGrid } from "./sudoku-grid";
import { SudokuHeader } from "./sudoku-header";
import { SudokuHintPanel } from "./sudoku-hint-panel";
import { SudokuKeypad } from "./sudoku-keypad";
import { SudokuModeToggle } from "./sudoku-mode-toggle";
import { SudokuToolbar } from "./sudoku-toolbar";

interface ISudokuGameProps extends ComponentProps<"div"> {}

export const SudokuGame: FC<ISudokuGameProps> = ({ className, ...props }) => {
  useKeyboardControls();
  usePauseWhenHidden();
  const hasHint = useSudokuStore((s) => getShownHint(s) != null);

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
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={hasHint ? "hint" : "tools"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          className="flex flex-col gap-3"
        >
          {hasHint ? (
            <SudokuHintPanel />
          ) : (
            <>
              <SudokuModeToggle className="mt-1" />
              <SudokuToolbar />
            </>
          )}
        </motion.div>
      </AnimatePresence>
      <SudokuKeypad />
    </div>
  );
};
