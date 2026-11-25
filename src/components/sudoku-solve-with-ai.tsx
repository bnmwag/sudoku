"use client";

import { motion } from "motion/react";
import type { ComponentProps, FC } from "react";

import { useSudokuStore } from "@/hooks/use-sudoku-store";
import { TEXT_BUTTON_CLASS } from "@/lib/class-names";
import { PRESS_SPRING } from "@/lib/motion-presets";
import { cn } from "@/lib/utils";

import { SparkleIcon } from "./icons";
import { Kbd } from "./kbd";
import { TextLoop } from "./motion/text-loop";
import { TextShimmer } from "./motion/text-shimmer";

interface ISudokuSolveWithAiProps extends ComponentProps<"div"> {}

export const SudokuSolveWithAi: FC<ISudokuSolveWithAiProps> = ({
  className,
  ...props
}) => {
  const aiStatus = useSudokuStore((s) => s.aiStatus);
  const solveWithAi = useSudokuStore((s) => s.solveWithAi);
  const cancelAi = useSudokuStore((s) => s.cancelAi);

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {aiStatus === "idle" ? (
        <motion.button
          type="button"
          onClick={solveWithAi}
          whileTap={{ scale: 0.94 }}
          transition={PRESS_SPRING}
          className={cn(TEXT_BUTTON_CLASS, "items-center py-1")}
        >
          <SparkleIcon className="size-3.5 self-center" />
          Solve with AI
          <Kbd>I</Kbd>
        </motion.button>
      ) : (
        <>
          <TextLoop
            className="text-xs"
            trigger
            transition={{ type: "spring", stiffness: 150, damping: 19 }}
            variants={{
              initial: { y: 12, opacity: 0, filter: "blur(4px)" },
              animate: { y: 0, opacity: 1, filter: "blur(0px)" },
              exit: { y: -12, opacity: 0, filter: "blur(4px)" },
            }}
          >
            <TextShimmer className="block font-mono">Reasoning…</TextShimmer>
            <TextShimmer className="block font-mono">Solving…</TextShimmer>
          </TextLoop>
          <button
            type="button"
            onClick={cancelAi}
            className={cn(TEXT_BUTTON_CLASS, "py-1")}
          >
            Stop
            <Kbd>Esc</Kbd>
          </button>
        </>
      )}
    </div>
  );
};
