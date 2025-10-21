"use client";

import type { FC } from "react";
import { useSudoku } from "@/hooks/use-sudoku";
import { TextLoop } from "./motion/text-loop";
import { TextShimmer } from "./motion/text-shimmer";

type Props = {
  delayMs?: number;
  stepDelayMs?: number;
};

export const SudokuSolveWithAi: FC<Props> = ({
  delayMs = 1200,
  stepDelayMs = 55,
}) => {
  const { solveWithAI, cancelAISolve, isAISolving, completedInMs } =
    useSudoku();

  const start = () => solveWithAI({ delayMs, stepDelayMs });

  return (
    <div className="w-full h-5">
      {isAISolving ? (
        <div className="flex items-center justify-between w-full">
          <div className="block">
            <TextLoop
              className="text-sm"
              transition={{
                type: "spring",
                stiffness: 150,
                damping: 19,
                mass: 1.2,
              }}
              trigger
              variants={{
                initial: {
                  y: 20,
                  rotateX: 90,
                  opacity: 0,
                  filter: "blur(4px)",
                },
                animate: {
                  y: 0,
                  rotateX: 0,
                  opacity: 1,
                  filter: "blur(0px)",
                },
                exit: {
                  y: -20,
                  rotateX: -90,
                  opacity: 0,
                  filter: "blur(4px)",
                },
              }}
            >
              <TextShimmer className="block tracking-wider">
                Reasoning…
              </TextShimmer>
              <TextShimmer className="block tracking-wider">
                Solving…
              </TextShimmer>
            </TextLoop>
          </div>

          <button
            type="button"
            onClick={cancelAISolve}
            className="cursor-pointer px-1.5 text-xs uppercase hover:bg-foreground hover:text-background"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={isAISolving || completedInMs != null}
          className="cursor-pointer px-1.5 text-xs uppercase hover:bg-foreground hover:text-background flex items-center gap-x-2"
          aria-live="polite"
        >
          Solve with AI
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 48 48"
          >
            {/* Icon from Health Icons by Resolve to Save Lives - https://github.com/resolvetosavelives/healthicons/blob/main/LICENSE */}
            <title>Solve with AI</title>
            <path
              fill="currentColor"
              d="M34 6c-1.368 4.944-3.13 6.633-8 8c4.87 1.367 6.632 3.056 8 8c1.368-4.944 3.13-6.633 8-8c-4.87-1.367-6.632-3.056-8-8m-14 8c-2.395 8.651-5.476 11.608-14 14c8.524 2.392 11.605 5.349 14 14c2.395-8.651 5.476-11.608 14-14c-8.524-2.392-11.605-5.349-14-14"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
