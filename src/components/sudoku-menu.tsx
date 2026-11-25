"use client";

import { motion } from "motion/react";
import type { ComponentProps, FC, ReactNode } from "react";

import { useSudokuStore } from "@/hooks/use-sudoku-store";
import { useWindowKeydown } from "@/hooks/use-window-keydown";
import { TEXT_BUTTON_CLASS } from "@/lib/class-names";
import { PRESS_SPRING } from "@/lib/motion-presets";
import type { Difficulty } from "@/lib/sudoku-helpers";
import { cn, formatTime } from "@/lib/utils";

import { Kbd } from "./kbd";
import { SudokuControlsHelp } from "./sudoku-controls-help";
import { SudokuSettings } from "./sudoku-settings";

interface ISudokuMenuProps extends ComponentProps<"div"> {}

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

/**
 * Menu shortcuts: Enter continues (or starts), N starts fresh,
 * 1-3 or the arrow keys pick the difficulty.
 * @param e Keyboard event.
 */
const onMenuKeyDown = (e: KeyboardEvent) => {
  if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
  const store = useSudokuStore.getState();
  const key = e.key.toLowerCase();
  const onButton =
    e.target instanceof HTMLElement && !!e.target.closest("button");

  if (key === "enter" && !onButton) {
    if (store.game?.status === "playing") store.continueGame();
    else store.newGame();
    return;
  }
  if (key === "n") {
    store.newGame();
    return;
  }

  const index = DIFFICULTIES.indexOf(store.difficulty);
  const digit = /^Digit([1-3])$/.exec(e.code);
  if (digit) store.setDifficulty(DIFFICULTIES[Number(digit[1]) - 1]);
  if (key === "arrowleft" || key === "a") {
    store.setDifficulty(DIFFICULTIES[Math.max(0, index - 1)]);
  }
  if (key === "arrowright" || key === "d") {
    store.setDifficulty(DIFFICULTIES[Math.min(2, index + 1)]);
  }
};

const SectionLabel: FC<{ children: ReactNode }> = ({ children }) => (
  <h2 className="mb-3 text-[10px] font-medium uppercase opacity-50">
    {children}
  </h2>
);

export const SudokuMenu: FC<ISudokuMenuProps> = ({ className, ...props }) => {
  const game = useSudokuStore((s) => s.game);
  const difficulty = useSudokuStore((s) => s.difficulty);
  const setDifficulty = useSudokuStore((s) => s.setDifficulty);
  const newGame = useSudokuStore((s) => s.newGame);
  const continueGame = useSudokuStore((s) => s.continueGame);

  useWindowKeydown(onMenuKeyDown);

  const inProgress = game?.status === "playing";

  return (
    <div
      className={cn("w-[min(100vw_-_2rem,27rem)] py-16 text-sm", className)}
      {...props}
    >
      <h1 className="mb-12 text-sm uppercase">Sudoku</h1>

      {inProgress && game && (
        <motion.button
          type="button"
          onClick={continueGame}
          whileTap={{ scale: 0.97 }}
          transition={PRESS_SPRING}
          className="mb-10 flex w-full cursor-pointer items-baseline justify-between bg-foreground px-1.5 py-2 text-xs text-background uppercase"
        >
          <span className="flex items-baseline gap-1.5">
            Continue
            <Kbd>Enter</Kbd>
          </span>
          <span className="font-mono opacity-60">
            {game.difficulty} · {formatTime(game.elapsedMs)}
          </span>
        </motion.button>
      )}

      <section className="mb-10">
        <SectionLabel>New game</SectionLabel>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <fieldset
            aria-label="Difficulty"
            className="m-0 inline-flex min-w-0 border-0 p-0"
          >
            {DIFFICULTIES.map((d, i) => (
              <button
                key={d}
                type="button"
                aria-pressed={d === difficulty}
                onClick={() => setDifficulty(d)}
                className={cn(
                  "relative inline-flex cursor-pointer items-baseline gap-1.5 px-1.5 text-xs uppercase",
                  d === difficulty ? "text-background" : "hover:opacity-60",
                )}
              >
                {d === difficulty && (
                  <motion.span
                    layoutId="difficulty-indicator"
                    transition={PRESS_SPRING}
                    className="absolute inset-0 bg-foreground"
                  />
                )}
                <span className="relative">{d}</span>
                <Kbd className="relative">{i + 1}</Kbd>
              </button>
            ))}
          </fieldset>
          <motion.button
            type="button"
            onClick={() => newGame()}
            whileTap={{ scale: 0.94 }}
            transition={PRESS_SPRING}
            className={TEXT_BUTTON_CLASS}
          >
            Start game
            <Kbd>{inProgress ? "N" : "Enter"}</Kbd>
          </motion.button>
        </div>
      </section>

      <section className="mb-10">
        <SectionLabel>Settings</SectionLabel>
        <SudokuSettings />
      </section>

      <section className="hidden pointer-fine:block">
        <SectionLabel>Controls</SectionLabel>
        <SudokuControlsHelp />
      </section>

      <p className="mt-12 text-[10px] uppercase opacity-50">
        Visit on{" "}
        <a
          href="https://github.com/bnmwag/sudoku"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          github
        </a>
      </p>
    </div>
  );
};
