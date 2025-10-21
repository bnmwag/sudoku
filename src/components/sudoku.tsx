"use client";

import {
  AnimatePresence,
  MotionConfig,
  motion,
  type Transition,
  useReducedMotion,
} from "motion/react";
import type { FC } from "react";
import { useSudoku } from "@/hooks/use-sudoku";
import { cn } from "@/lib/utils";
import { SudokuDifficulty } from "./sudoku-difficulty";
import { SudokuDone } from "./sudoku-done";
import { SudokuGrid } from "./sudoku-grid";
import { SudokuNumbers } from "./sudoku-numbers";
import { SudokuSolveWithAi } from "./sudoku-solve-with-ai";
import { SudokuTimer } from "./sudoku-timer";

interface ISudokuProps extends React.HTMLAttributes<HTMLDivElement> {}

const SPRING: Transition = {
  type: "spring",
  stiffness: 140,
  damping: 18,
  mass: 0.6,
};

export const Sudoku: FC<ISudokuProps> = (props) => {
  const { className, ...rest } = props;
  const { newGame, gameActive, completedInMs } = useSudoku();
  const prefersReduced = useReducedMotion();

  return (
    <MotionConfig
      transition={SPRING}
      reducedMotion={prefersReduced ? "always" : "never"}
    >
      <div
        className={cn("relative inline-block select-none", className)}
        style={{ perspective: 1200 }}
        {...rest}
      >
        <AnimatePresence mode="wait" initial={false}>
          {gameActive ? (
            <motion.div
              key="game"
              initial={{
                clipPath: "circle(0% at 50% 50%)",
                filter: "blur(8px)",
                opacity: 0.2,
                scale: 0.98,
              }}
              animate={{
                clipPath: "circle(150% at 50% 50%)",
                filter: "blur(0px)",
                opacity: 1,
                scale: 1,
              }}
              exit={{
                clipPath: "circle(0% at 50% 50%)",
                filter: "blur(8px)",
                opacity: 0,
                scale: 0.98,
              }}
              transition={{ ...SPRING, duration: 0.5 }}
            >
              <AnimatePresence mode="wait">
                {completedInMs == null ? (
                  <motion.div
                    key="game-content"
                    initial={{
                      clipPath: "circle(150% at 50% 50%)",
                      filter: "blur(0px)",
                      opacity: 1,
                      scale: 1,
                    }}
                    animate={{
                      clipPath: "circle(150% at 50% 50%)",
                      filter: "blur(0px)",
                      opacity: 1,
                      scale: 1,
                    }}
                    exit={{
                      clipPath: "circle(0% at 50% 50%)",
                      filter: "blur(8px)",
                      opacity: 0,
                      scale: 0.98,
                    }}
                    transition={{ ...SPRING, duration: 0.5 }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <SudokuSolveWithAi />
                    </div>
                    <SudokuGrid />
                    <div className="mt-2 flex items-center justify-between">
                      <SudokuNumbers />
                      <SudokuTimer />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="game-done"
                    initial={{
                      clipPath: "circle(0% at 50% 50%)",
                      filter: "blur(8px)",
                      opacity: 0,
                      scale: 0.98,
                    }}
                    animate={{
                      clipPath: "circle(150% at 50% 50%)",
                      filter: "blur(0px)",
                      opacity: 1,
                      scale: 1,
                    }}
                    exit={{
                      clipPath: "circle(0% at 50% 50%)",
                      filter: "blur(8px)",
                      opacity: 0,
                      scale: 0.98,
                    }}
                    transition={{ ...SPRING, duration: 0.5 }}
                  >
                    <SudokuDone />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="setup"
              className="w-[432px] text-sm"
              initial={{
                rotateX: -12,
                y: -8,
                opacity: 0,
                scale: 0.98,
                transformOrigin: "top center",
              }}
              animate={{ rotateX: 0, y: 0, opacity: 1, scale: 1 }}
              exit={{ rotateX: 12, y: -8, opacity: 0, scale: 0.98 }}
              style={{ transformStyle: "preserve-3d" }}
              transition={{ ...SPRING, duration: 0.45 }}
            >
              <div className="mb-12">
                <h1 className="uppercase text-sm">Sudoku</h1>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <SudokuDifficulty />
                <button
                  type="button"
                  onClick={() => newGame()}
                  className="cursor-pointer px-1.5 text-xs uppercase hover:bg-foreground hover:text-background"
                >
                  Start game
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
};
