"use client";

import type { FC } from "react";
import Confetti from "react-confetti";
import { createPortal } from "react-dom";
import { useSudoku } from "@/hooks/use-sudoku";
import { useWindowSize } from "@/hooks/use-window-size";

export const SudokuDone: FC = () => {
  const { difficulty, completedInMs, aiStatus, reset } = useSudoku();
  const { width, height } = useWindowSize();

  const withAi = aiStatus !== "idle";

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <>
      {createPortal(
        <div className="fixed inset-0">
          <Confetti
            className="fixed top-0 inset-0"
            width={width}
            height={height}
            colors={["#d4d4d4", "#404040", "#262626"]}
            numberOfPieces={250}
          />
        </div>,
        document.getElementById("confetti-portal") as HTMLDivElement,
      )}
      <div className="w-[432px] text-sm">
        <div className="mb-12">
          <h1 className="uppercase text-sm">
            Solved{" "}
            <span className="opacity-50 inline-flex items-center gap-x-2">
              {withAi ? (
                <>
                  with AI{" "}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 48 48"
                  >
                    {/* Icon from Health Icons by Resolve to Save Lives - https://github.com/resolvetosavelives/healthicons/blob/main/LICENSE */}
                    <title>AI</title>
                    <path
                      fill="currentColor"
                      d="M34 6c-1.368 4.944-3.13 6.633-8 8c4.87 1.367 6.632 3.056 8 8c1.368-4.944 3.13-6.633 8-8c-4.87-1.367-6.632-3.056-8-8m-14 8c-2.395 8.651-5.476 11.608-14 14c8.524 2.392 11.605 5.349 14 14c2.395-8.651 5.476-11.608 14-14c-8.524-2.392-11.605-5.349-14-14"
                    />
                  </svg>
                </>
              ) : null}
            </span>
          </h1>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-4">
            <div className="space-y-0.5">
              <div className="text-[10px] uppercase font-medium opacity-50">
                Difficulty
              </div>
              <span className="uppercase">{difficulty}</span>
            </div>
            <div className="space-y-0.5">
              <div className="text-[10px] uppercase font-medium opacity-50">
                Time
              </div>
              <span className="font-mono">
                {formatTime(completedInMs ?? 0)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => reset()}
            className="cursor-pointer px-1.5 text-xs uppercase hover:bg-foreground hover:text-background"
          >
            Restart game
          </button>
        </div>
      </div>
    </>
  );
};
