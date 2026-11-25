"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { type ComponentProps, type FC, useEffect } from "react";

import { useSudokuStore } from "@/hooks/use-sudoku-store";
import { cn } from "@/lib/utils";

import { SudokuDone } from "./sudoku-done";
import { SudokuGame } from "./sudoku-game";
import { SudokuMenu } from "./sudoku-menu";

interface ISudokuProps extends ComponentProps<"div"> {}

const SCREEN_TRANSITION = {
  type: "spring",
  stiffness: 260,
  damping: 28,
} as const;

export const Sudoku: FC<ISudokuProps> = ({ className, ...props }) => {
  const hydrated = useSudokuStore((s) => s.hydrated);
  const screen = useSudokuStore((s) => s.screen);

  useEffect(() => {
    const restore = async () => {
      await useSudokuStore.persist.rehydrate();
      useSudokuStore.getState().finishHydration();
    };
    restore().catch((error: unknown) => {
      console.error("Could not restore the saved game", error);
      useSudokuStore.getState().finishHydration();
    });
  }, []);

  if (!hydrated) return null;

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("relative", className)} {...props}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={screen}
            initial={{ opacity: 0, scale: 0.98, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(6px)" }}
            transition={SCREEN_TRANSITION}
          >
            {screen === "menu" && <SudokuMenu />}
            {screen === "game" && <SudokuGame />}
            {screen === "done" && <SudokuDone />}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
};
