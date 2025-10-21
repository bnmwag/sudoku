"use client";

import confetti from "canvas-confetti";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  type Transition,
  useReducedMotion,
} from "motion/react";
import type { FC } from "react";
import { useEffect } from "react";
import { useSudoku } from "@/hooks/use-sudoku";
import { cn } from "@/lib/utils";
import { SudokuDifficulty } from "./sudoku-difficulty";
import { SudokuGrid } from "./sudoku-grid";
import { SudokuNumbers } from "./sudoku-numbers";

interface ISudokuProps extends React.HTMLAttributes<HTMLDivElement> {}

const SPRING: Transition = {
  type: "spring",
  stiffness: 140,
  damping: 18,
  mass: 0.6,
};

export const Sudoku: FC<ISudokuProps> = (props) => {
  const { className, ...rest } = props;
  const { newGame, gameActive, completedInMs, difficulty } = useSudoku();
  const prefersReduced = useReducedMotion();

  // fire celebration when puzzle completes
  useEffect(() => {
    if (completedInMs == null || prefersReduced) return;
    confetti({ spread: 70, origin: { y: 0.6 } });
    confetti({ particleCount: 120, angle: 60, spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 120, angle: 120, spread: 55, origin: { x: 1 } });
  }, [completedInMs, prefersReduced]);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

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
        {/* Scene swap */}
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
              <SudokuGrid />
              <div className="mt-2 flex items-center justify-between">
                <SudokuNumbers />
              </div>
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

        {/* Completion overlay (always mounted listener) */}
        <AnimatePresence>
          {completedInMs != null && (
            <motion.div
              key="complete"
              className="pointer-events-none absolute inset-0 grid place-items-center"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.28 }}
            >
              <motion.div
                initial={{ backdropFilter: "blur(0px)" }}
                animate={{ backdropFilter: "blur(6px)" }}
                exit={{ backdropFilter: "blur(0px)" }}
                className="absolute inset-0 bg-black/20 dark:bg-black/30"
              />
              <motion.div
                className="pointer-events-auto relative z-10 rounded-xl border border-neutral-300/50 bg-background/80 px-4 py-3 text-sm shadow-lg dark:border-neutral-700/60"
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 8, opacity: 0 }}
              >
                <div className="mb-1 text-center">
                  Completed on <span className="uppercase">{difficulty}</span>
                </div>
                <div className="mb-3 text-center text-lg font-medium">
                  {formatTime(completedInMs)}
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => newGame()} // keeps same difficulty from store
                    className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-foreground hover:text-background dark:border-neutral-700"
                  >
                    New puzzle
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
};
