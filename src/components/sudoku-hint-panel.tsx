"use client";

import type { ComponentProps, FC } from "react";

import { getShownHint, useSudokuStore } from "@/hooks/use-sudoku-store";
import { TEXT_BUTTON_CLASS } from "@/lib/class-names";
import {
  getHintText,
  getHintTitle,
  getStepText,
  getStepTitle,
} from "@/lib/sudoku-hint-text";
import { cn } from "@/lib/utils";

import { Kbd } from "./kbd";

interface ISudokuHintPanelProps extends ComponentProps<"section"> {}

export const SudokuHintPanel: FC<ISudokuHintPanelProps> = ({
  className,
  ...props
}) => {
  const hint = useSudokuStore(getShownHint);
  const cells = useSudokuStore((s) => s.game?.cells);
  const applyHint = useSudokuStore((s) => s.applyHint);
  const dismissHint = useSudokuStore((s) => s.dismissHint);

  if (!hint || !cells) return null;

  return (
    <section
      aria-label="Hint"
      aria-live="polite"
      className={cn(
        "flex flex-col gap-2.5 border-y border-neutral-200 py-2.5 dark:border-neutral-800",
        className,
      )}
      {...props}
    >
      <div className="flex items-baseline justify-between gap-2 text-[10px] font-medium uppercase">
        <span className="opacity-50">Hint</span>
        <span>{getHintTitle(hint)}</span>
      </div>

      {hint.steps.length > 0 && (
        <ol className="space-y-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          {hint.steps.map((step, k) => (
            <li
              key={`${step.kind}-${step.cells.join()}`}
              className="flex gap-2"
            >
              <span className="font-mono">{k + 1}</span>
              <span>
                <span className="uppercase">{getStepTitle(step)}.</span>{" "}
                {getStepText(step)}
              </span>
            </li>
          ))}
        </ol>
      )}

      <p className="text-xs">{getHintText(hint, cells)}</p>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={dismissHint}
          className={TEXT_BUTTON_CLASS}
        >
          Close
          <Kbd>Esc</Kbd>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={applyHint}
          className={cn(TEXT_BUTTON_CLASS, "bg-foreground text-background")}
        >
          {hint.kind === "wrong"
            ? `Clear ${hint.digit}`
            : `Place ${hint.digit}`}
          <Kbd>H</Kbd>
        </button>
      </div>
    </section>
  );
};
