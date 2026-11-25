"use client";

import type { ComponentProps, FC } from "react";
import Confetti from "react-confetti";
import { createPortal } from "react-dom";

import { useSudokuStore } from "@/hooks/use-sudoku-store";
import { useWindowKeydown } from "@/hooks/use-window-keydown";
import { useWindowSize } from "@/hooks/use-window-size";
import { TEXT_BUTTON_CLASS } from "@/lib/class-names";
import { cn, formatTime } from "@/lib/utils";

import { SparkleIcon } from "./icons";
import { Kbd } from "./kbd";

interface ISudokuDoneProps extends ComponentProps<"div"> {}

/**
 * Done screen shortcuts: Enter or N for the next puzzle, M or Escape for the menu.
 * @param e Keyboard event.
 */
const onDoneKeyDown = (e: KeyboardEvent) => {
  if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
  const store = useSudokuStore.getState();
  const key = e.key.toLowerCase();
  const onButton =
    e.target instanceof HTMLElement && !!e.target.closest("button");

  if ((key === "enter" && !onButton) || key === "n") {
    store.newGame(store.game?.difficulty);
  }
  if (key === "m" || key === "escape") store.openMenu();
};

export const SudokuDone: FC<ISudokuDoneProps> = ({ className, ...props }) => {
  const game = useSudokuStore((s) => s.game);
  const newGame = useSudokuStore((s) => s.newGame);
  const openMenu = useSudokuStore((s) => s.openMenu);
  const { width, height } = useWindowSize();
  const portal =
    typeof document !== "undefined"
      ? document.getElementById("confetti-portal")
      : null;

  useWindowKeydown(onDoneKeyDown);

  if (!game) return null;

  const stats = [
    { label: "Difficulty", value: game.difficulty },
    { label: "Time", value: formatTime(game.elapsedMs) },
    ...(game.hintsUsed > 0
      ? [{ label: "Hints", value: String(game.hintsUsed) }]
      : []),
  ];

  return (
    <>
      {portal &&
        createPortal(
          <Confetti
            className="pointer-events-none fixed inset-0"
            width={width}
            height={height}
            colors={["#d4d4d4", "#404040", "#262626"]}
            numberOfPieces={250}
            recycle={false}
          />,
          portal,
        )}
      <div
        className={cn("w-[min(100vw_-_2rem,27rem)] text-sm", className)}
        {...props}
      >
        <h1 className="mb-12 flex items-center gap-2 text-sm uppercase">
          Solved
          {game.usedAi && (
            <span className="inline-flex items-center gap-1.5 opacity-50">
              with AI <SparkleIcon />
            </span>
          )}
        </h1>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <dl className="space-y-4">
            {stats.map((stat) => (
              <div key={stat.label} className="space-y-0.5">
                <dt className="text-[10px] font-medium uppercase opacity-50">
                  {stat.label}
                </dt>
                <dd className="font-mono uppercase">{stat.value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => newGame(game.difficulty)}
              className={TEXT_BUTTON_CLASS}
            >
              Next puzzle
              <Kbd>Enter</Kbd>
            </button>
            <button
              type="button"
              onClick={openMenu}
              className={TEXT_BUTTON_CLASS}
            >
              Menu
              <Kbd>M</Kbd>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
