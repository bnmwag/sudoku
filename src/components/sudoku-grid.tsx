"use client";

import { type FC, useRef } from "react";
import { useSudoku } from "@/hooks/use-sudoku";
import { cn } from "@/lib/utils";
import { uuid } from "@/lib/uuid";

const compID = uuid();

export const SudokuGrid: FC = () => {
  const {
    cells,
    fixed,
    errors,
    active,
    setActive,
    inputDigit,
    clearCell,
    moveIndex,
  } = useSudoku();
  const refs = useRef<HTMLInputElement[]>([]);

  const cellBorder = (r: number, c: number) =>
    cn(
      "border border-neutral-100 dark:border-neutral-900",
      r !== 0 &&
        r % 3 === 0 &&
        "border-t-2 border-t-neutral-300 dark:border-t-neutral-800",
      c !== 0 &&
        c % 3 === 0 &&
        "border-l-2 border-l-neutral-300 dark:border-l-neutral-800",
    );

  const highlightClass = (i: number) => {
    if (active === null) return "";
    const r = Math.floor(i / 9),
      c = i % 9;
    const ar = Math.floor(active / 9),
      ac = active % 9;
    const activeVal = cells[active];
    if (i === active) return "bg-neutral-400/30 dark:bg-neutral-600/30";
    if (r === ar || c === ac) return "bg-neutral-200/30 dark:bg-neutral-800/40";
    if (activeVal && cells[i] === activeVal)
      return "bg-neutral-300/30 dark:bg-neutral-700/40";
    return "";
  };

  const onKeyDown =
    (i: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.metaKey || e.ctrlKey) return;
      const key = e.key;
      if (fixed[i]) {
        if (key === "ArrowUp" || key === "k") {
          const ni = moveIndex(i, "up");
          refs.current[ni]?.focus();
          e.preventDefault();
        } else if (key === "ArrowDown" || key === "j") {
          const ni = moveIndex(i, "down");
          refs.current[ni]?.focus();
          e.preventDefault();
        } else if (key === "ArrowLeft" || key === "h") {
          const ni = moveIndex(i, "left");
          refs.current[ni]?.focus();
          e.preventDefault();
        } else if (key === "ArrowRight" || key === "l") {
          const ni = moveIndex(i, "right");
          refs.current[ni]?.focus();
          e.preventDefault();
        }
        return;
      }
      if (/^[1-9]$/.test(key)) {
        inputDigit(i, key);
        e.preventDefault();
        return;
      }
      if (key === "Backspace" || key === "Delete") {
        clearCell(i);
        e.preventDefault();
        return;
      }
      if (key === "ArrowUp" || key === "k") {
        const ni = moveIndex(i, "up");
        refs.current[ni]?.focus();
        e.preventDefault();
        return;
      }
      if (key === "ArrowDown" || key === "j") {
        const ni = moveIndex(i, "down");
        refs.current[ni]?.focus();
        e.preventDefault();
        return;
      }
      if (key === "ArrowLeft" || key === "h") {
        const ni = moveIndex(i, "left");
        refs.current[ni]?.focus();
        e.preventDefault();
        return;
      }
      if (key === "ArrowRight" || key === "l") {
        const ni = moveIndex(i, "right");
        refs.current[ni]?.focus();
        e.preventDefault();
        return;
      }
    };

  return (
    <div className="inline-block">
      <div className="grid grid-cols-9">
        {Array.from({ length: 81 }, (_, i) => {
          const r = Math.floor(i / 9);
          const c = i % 9;
          const isFixed = fixed[i];
          const isError = errors?.has(i);

          return (
            <div
              key={`${compID}-gridcell-${i * 1}`}
              className={cn(
                "w-10 h-10 md:w-12 md:h-12",
                cellBorder(r, c),
                highlightClass(i),
                isError && "bg-red-500/30",
              )}
            >
              <input
                ref={(el) => {
                  if (el) refs.current[i] = el;
                }}
                inputMode="numeric"
                pattern="[1-9]"
                aria-label={`Row ${r + 1}, Column ${c + 1}`}
                className={cn(
                  "w-full h-full text-center outline-none transition-[color,box-shadow]",
                  "[appearance:textfield]",
                  "text-base md:text-xl",
                  "focus:outline-none",
                  "caret-transparent",
                  "select-none [&::selection]:bg-transparent [&::selection]:text-inherit",
                  "bg-transparent",
                  isFixed ? "font-medium" : "",
                )}
                readOnly={isFixed}
                value={cells[i]}
                onChange={(e) =>
                  inputDigit(
                    i,
                    e.currentTarget.value.replace(/[^1-9]/g, "").slice(0, 1),
                  )
                }
                onKeyDown={onKeyDown(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                maxLength={1}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
