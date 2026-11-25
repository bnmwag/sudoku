"use client";

import { motion } from "motion/react";
import type { ComponentProps, FC } from "react";

import { useSudokuStore } from "@/hooks/use-sudoku-store";
import { LAYOUT_SPRING, PRESS_SPRING } from "@/lib/motion-presets";
import type { InputMode } from "@/lib/sudoku-board";
import { cn } from "@/lib/utils";

import { Kbd } from "./kbd";

interface ISudokuModeToggleProps extends ComponentProps<"fieldset"> {}

const MODES: { mode: InputMode; label: string; key: string }[] = [
  { mode: "normal", label: "Normal", key: "Z" },
  { mode: "corner", label: "Corner", key: "X" },
  { mode: "center", label: "Center", key: "C" },
];

export const SudokuModeToggle: FC<ISudokuModeToggleProps> = ({
  className,
  ...props
}) => {
  const mode = useSudokuStore((s) => s.heldMode ?? s.mode);
  const setMode = useSudokuStore((s) => s.setMode);

  return (
    <fieldset
      aria-label="Input mode"
      className={cn("m-0 grid min-w-0 grid-cols-3 border-0 p-0", className)}
      {...props}
    >
      {MODES.map((item) => {
        const isActive = item.mode === mode;
        return (
          <motion.button
            key={item.mode}
            type="button"
            aria-pressed={isActive}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMode(item.mode)}
            whileTap={{ scale: 0.95 }}
            transition={PRESS_SPRING}
            className={cn(
              "relative flex h-8 cursor-pointer items-center justify-center gap-1.5 text-xs uppercase transition-colors duration-150",
              isActive
                ? "text-background"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-900",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="mode-indicator"
                transition={LAYOUT_SPRING}
                className="absolute inset-0 bg-foreground"
              />
            )}
            <span className="relative">{item.label}</span>
            <Kbd className="relative">{item.key}</Kbd>
          </motion.button>
        );
      })}
    </fieldset>
  );
};
