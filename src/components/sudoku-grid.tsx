"use client";

import { AnimatePresence, motion } from "motion/react";
import { type ComponentProps, type FC, type PointerEvent, useRef } from "react";

import { useSudokuStore } from "@/hooks/use-sudoku-store";
import { getConflicts, getWrongCells } from "@/lib/sudoku-board";
import { BOXES, PEERS } from "@/lib/sudoku-units";
import { cn } from "@/lib/utils";

import { PlayIcon } from "./icons";
import { Kbd } from "./kbd";
import { type CellHighlight, SudokuCell } from "./sudoku-cell";

interface ISudokuGridProps extends ComponentProps<"div"> {}

const DOUBLE_TAP_MS = 320;

/**
 * Cell index under a screen point, or null outside the board.
 * @param x Client x.
 * @param y Client y.
 */
const getCellAt = (x: number, y: number) => {
  const el = document
    .elementFromPoint(x, y)
    ?.closest<HTMLElement>("[data-cell]");
  return el ? Number(el.dataset.cell) : null;
};

export const SudokuGrid: FC<ISudokuGridProps> = ({ className, ...props }) => {
  const game = useSudokuStore((s) => s.game);
  const selection = useSudokuStore((s) => s.selection);
  const settings = useSudokuStore((s) => s.settings);
  const ripple = useSudokuStore((s) => s.ripple);
  const shake = useSudokuStore((s) => s.shake);
  const select = useSudokuStore((s) => s.select);
  const extendSelection = useSudokuStore((s) => s.extendSelection);
  const selectDigit = useSudokuStore((s) => s.selectDigit);
  const resume = useSudokuStore((s) => s.resume);

  const draggingRef = useRef(false);
  const lastTapRef = useRef<{ index: number; at: number } | null>(null);

  if (!game) return null;

  const isPaused = game.status === "playing" && game.resumedAt == null;
  const conflicts = getConflicts(game.cells);
  const wrong = settings.showMistakes
    ? getWrongCells(game.cells, game.solution)
    : new Set<number>();
  const selected = new Set(selection);
  const cursor = selection.at(-1);
  const focusDigit =
    cursor != null && settings.highlightSame
      ? game.cells[cursor].value || null
      : null;
  const peers = new Set(
    selection.length === 1 && cursor != null ? PEERS[cursor] : [],
  );
  const shaking = new Set(shake?.cells);

  const getHighlight = (i: number): CellHighlight => {
    if (selected.has(i)) return "selected";
    if (focusDigit && game.cells[i].value === focusDigit) return "same";
    if (peers.has(i)) return "peer";
    return null;
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (isPaused || e.button !== 0) return;
    const index = getCellAt(e.clientX, e.clientY);
    if (index == null) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    const now = performance.now();
    const last = lastTapRef.current;
    const value = game.cells[index].value;
    if (last?.index === index && now - last.at < DOUBLE_TAP_MS && value) {
      lastTapRef.current = null;
      draggingRef.current = false;
      selectDigit(value);
      return;
    }

    lastTapRef.current = { index, at: now };
    draggingRef.current = true;
    select(index, e.ctrlKey || e.metaKey || e.shiftKey);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const index = getCellAt(e.clientX, e.clientY);
    if (index != null) extendSelection(index);
  };

  const stopDragging = () => {
    draggingRef.current = false;
  };

  return (
    <div
      className={cn(
        "@container relative aspect-square w-full touch-none select-none [-webkit-touch-callout:none]",
        className,
      )}
      {...props}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        className="grid size-full cursor-pointer grid-cols-3 grid-rows-3 gap-[2px] bg-neutral-800 p-[2px] dark:bg-neutral-500"
      >
        {BOXES.map((box) => (
          <div
            key={box[0]}
            className="grid grid-cols-3 grid-rows-3 gap-px bg-neutral-200 dark:bg-neutral-800"
          >
            {box.map((i) => (
              <SudokuCell
                key={i}
                index={i}
                cell={game.cells[i]}
                highlight={isPaused ? null : getHighlight(i)}
                isError={conflicts.has(i) || wrong.has(i)}
                focusDigit={focusDigit}
                rippleId={ripple?.id}
                rippleDelay={ripple?.delays[i]}
                shakeId={shaking.has(i) ? shake?.id : undefined}
              />
            ))}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isPaused && (
          <motion.div
            className="absolute inset-0 grid place-items-center bg-background/80 backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.button
              type="button"
              onClick={resume}
              whileTap={{ scale: 0.92 }}
              className="flex cursor-pointer items-center gap-2 bg-foreground px-3 py-2 text-xs text-background uppercase"
            >
              <PlayIcon className="size-4 fill-current" />
              Resume
              <Kbd className="opacity-60">P</Kbd>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
