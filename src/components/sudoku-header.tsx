"use client";

import { motion } from "motion/react";
import type { ComponentProps, FC } from "react";

import { useSudokuStore } from "@/hooks/use-sudoku-store";
import { ICON_BUTTON_CLASS } from "@/lib/class-names";
import { PRESS_SPRING, PRESSED_SCALE } from "@/lib/motion-presets";
import { cn } from "@/lib/utils";

import { MenuIcon, PauseIcon, PlayIcon } from "./icons";
import { Kbd } from "./kbd";
import { SudokuSolveWithAi } from "./sudoku-solve-with-ai";
import { SudokuTimer } from "./sudoku-timer";

interface ISudokuHeaderProps extends ComponentProps<"div"> {}

export const SudokuHeader: FC<ISudokuHeaderProps> = ({
  className,
  ...props
}) => {
  const difficulty = useSudokuStore((s) => s.game?.difficulty);
  const isRunning = useSudokuStore((s) => s.game?.resumedAt != null);
  const togglePause = useSudokuStore((s) => s.togglePause);
  const openMenu = useSudokuStore((s) => s.openMenu);

  return (
    <div
      className={cn("flex items-center justify-between gap-2", className)}
      {...props}
    >
      <div className="flex items-baseline gap-3">
        <span className="text-xs uppercase">{difficulty}</span>
        <SudokuTimer className="opacity-60" />
      </div>
      <div className="flex items-center gap-1">
        <SudokuSolveWithAi />
        <div className="flex items-center gap-1">
          <motion.button
            type="button"
            aria-label={isRunning ? "Pause" : "Resume"}
            title={isRunning ? "Pause (P)" : "Resume (P)"}
            onClick={togglePause}
            whileTap={{ scale: PRESSED_SCALE }}
            transition={PRESS_SPRING}
            className={ICON_BUTTON_CLASS}
          >
            {isRunning ? (
              <PauseIcon className="size-4" />
            ) : (
              <PlayIcon className="size-4" />
            )}
          </motion.button>
          <Kbd>P</Kbd>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            type="button"
            aria-label="Menu"
            title="Menu (M)"
            onClick={openMenu}
            whileTap={{ scale: PRESSED_SCALE }}
            transition={PRESS_SPRING}
            className={ICON_BUTTON_CLASS}
          >
            <MenuIcon className="size-4" />
          </motion.button>
          <Kbd>M</Kbd>
        </div>
      </div>
    </div>
  );
};
