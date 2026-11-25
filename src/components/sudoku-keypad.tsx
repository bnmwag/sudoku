"use client";

import { motion } from "motion/react";
import type { ComponentProps, FC } from "react";

import { useSudokuStore } from "@/hooks/use-sudoku-store";
import {
  LAYOUT_SPRING,
  PRESS_SPRING,
  PRESSED_SCALE,
} from "@/lib/motion-presets";
import type { InputMode } from "@/lib/sudoku-board";
import { getDigitCounts } from "@/lib/sudoku-board";
import { cn } from "@/lib/utils";

interface ISudokuKeypadProps extends ComponentProps<"div"> {}

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const ALIGN_CLASSES: Record<InputMode, string> = {
  normal: "items-center justify-center",
  corner: "items-start justify-start p-1.5",
  center: "items-center justify-center",
};

export const SudokuKeypad: FC<ISudokuKeypadProps> = ({
  className,
  ...props
}) => {
  const cells = useSudokuStore((s) => s.game?.cells);
  const mode = useSudokuStore((s) => s.heldMode ?? s.mode);
  const inputDigit = useSudokuStore((s) => s.inputDigit);

  const counts = cells ? getDigitCounts(cells) : Array<number>(10).fill(0);

  return (
    <div
      className={cn(
        "grid grid-cols-9 gap-px border border-neutral-800 bg-neutral-200 dark:border-neutral-500 dark:bg-neutral-800",
        className,
      )}
      {...props}
    >
      {DIGITS.map((digit) => {
        const left = Math.max(0, 9 - counts[digit]);
        return (
          <motion.button
            key={digit}
            type="button"
            aria-label={`${digit}, ${left} left`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => inputDigit(digit)}
            whileTap={{ scale: PRESSED_SCALE }}
            transition={PRESS_SPRING}
            className={cn(
              "relative flex h-14 cursor-pointer bg-background transition-colors duration-100 hover:bg-foreground hover:text-background",
              ALIGN_CLASSES[mode],
              left === 0 && "text-neutral-300 dark:text-neutral-700",
            )}
          >
            <motion.span
              layout
              transition={LAYOUT_SPRING}
              className={cn(
                "leading-none tabular-nums",
                mode === "normal" ? "text-2xl" : "text-sm",
              )}
            >
              {digit}
            </motion.span>
            <span className="absolute right-1 bottom-1 text-[9px] leading-none tabular-nums opacity-40">
              {left > 0 ? left : ""}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
