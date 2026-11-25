"use client";

import { AnimatePresence, motion, type Transition } from "motion/react";
import type { ComponentProps, FC } from "react";
import type { ICell } from "@/lib/sudoku-board";
import { cn } from "@/lib/utils";

export type CellHighlight = "selected" | "same" | "peer" | null;

interface ISudokuCellProps extends ComponentProps<"div"> {
  cell: ICell;
  index: number;
  highlight: CellHighlight;
  isError: boolean;
  /** Digit to emphasize inside marks. */
  focusDigit: number | null;
  rippleId?: number;
  rippleDelay?: number;
  shakeId?: number;
}

const POP: Transition = { type: "spring", stiffness: 700, damping: 30 };

/** Grid areas in a 3x3 layout, filled in order: corners, then edges, then middle. */
const CORNER_AREAS = [
  "1 / 1",
  "1 / 3",
  "3 / 1",
  "3 / 3",
  "1 / 2",
  "3 / 2",
  "2 / 1",
  "2 / 3",
  "2 / 2",
];

const HIGHLIGHT_CLASSES: Record<Exclude<CellHighlight, null>, string> = {
  selected: "bg-neutral-300 dark:bg-neutral-700",
  same: "bg-neutral-200 dark:bg-neutral-800",
  peer: "bg-neutral-100 dark:bg-neutral-900",
};

/**
 * Font size for center marks, shrinking as more digits share the cell.
 * @param count Number of center marks.
 */
const getCenterSize = (count: number) => {
  if (count <= 3) return "text-[2.9cqw]";
  if (count <= 5) return "text-[2.5cqw]";
  return "text-[2.1cqw]";
};

export const SudokuCell: FC<ISudokuCellProps> = ({
  cell,
  index,
  highlight,
  isError,
  focusDigit,
  rippleId,
  rippleDelay,
  shakeId,
  className,
  ...props
}) => {
  const hasRipple = rippleDelay != null;
  const markClass = (digit: number) =>
    digit === focusDigit
      ? "font-semibold text-foreground"
      : "text-neutral-500 dark:text-neutral-400";

  return (
    <div
      data-cell={index}
      className={cn(
        "relative overflow-hidden bg-background transition-colors duration-100",
        highlight && HIGHLIGHT_CLASSES[highlight],
        isError && cell.given && "bg-red-500/15 dark:bg-red-500/20",
        className,
      )}
      {...props}
    >
      {hasRipple && (
        <span
          key={rippleId}
          aria-hidden
          className="pointer-events-none absolute inset-0 animate-ripple bg-foreground motion-reduce:hidden"
          style={{ animationDelay: `${rippleDelay}ms` }}
        />
      )}

      <div
        key={shakeId ?? "still"}
        className={cn(
          "absolute inset-0",
          shakeId != null && "animate-shake motion-reduce:animate-none",
        )}
      >
        <AnimatePresence initial={false}>
          {cell.value ? (
            <motion.div
              key={`value-${cell.value}`}
              className="absolute inset-0 grid place-items-center"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.12 } }}
              transition={POP}
            >
              <span
                key={hasRipple ? rippleId : "rest"}
                className={cn(
                  "inline-block text-[5.8cqw] leading-none tabular-nums",
                  cell.given
                    ? "font-medium text-foreground"
                    : "text-neutral-500 dark:text-neutral-400",
                  isError && !cell.given && "text-red-500 dark:text-red-400",
                  isError && cell.given && "text-red-600 dark:text-red-400",
                  hasRipple && "animate-bump motion-reduce:animate-none",
                )}
                style={hasRipple ? { animationDelay: `${rippleDelay}ms` } : {}}
              >
                {cell.value}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="marks"
              className="absolute inset-0"
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              {cell.corner.length > 0 && (
                <div className="absolute inset-[6%] grid grid-cols-3 grid-rows-3 place-items-center">
                  {cell.corner.map((digit, k) => (
                    <motion.span
                      key={digit}
                      layout
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={POP}
                      className={cn(
                        "text-[2.3cqw] leading-none tabular-nums",
                        markClass(digit),
                      )}
                      style={{ gridArea: CORNER_AREAS[k] }}
                    >
                      {digit}
                    </motion.span>
                  ))}
                </div>
              )}
              {cell.center.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={cn(
                      "flex max-w-[78%] flex-wrap justify-center leading-[1.05] tracking-tight tabular-nums",
                      getCenterSize(cell.center.length),
                    )}
                  >
                    {cell.center.map((digit) => (
                      <motion.span
                        key={digit}
                        layout
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={POP}
                        className={markClass(digit)}
                      >
                        {digit}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
