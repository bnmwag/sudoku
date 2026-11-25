"use client";

import { motion } from "motion/react";
import type { ComponentProps, FC, ReactNode } from "react";

import { useSudokuStore } from "@/hooks/use-sudoku-store";
import { PRESS_SPRING, PRESSED_SCALE } from "@/lib/motion-presets";
import { cn } from "@/lib/utils";

import { EraseIcon, HintIcon, NotesIcon, RedoIcon, UndoIcon } from "./icons";
import { Kbd } from "./kbd";

interface ISudokuToolbarProps extends ComponentProps<"div"> {}

interface IToolButtonProps
  extends Omit<ComponentProps<typeof motion.button>, "children"> {
  children: ReactNode;
  label: string;
  shortcut: string;
}

const ToolButton: FC<IToolButtonProps> = ({
  label,
  shortcut,
  className,
  children,
  ...props
}) => (
  <motion.button
    type="button"
    title={`${label} (${shortcut})`}
    onMouseDown={(e) => e.preventDefault()}
    whileTap={{ scale: PRESSED_SCALE }}
    transition={PRESS_SPRING}
    className={cn(
      "flex cursor-pointer flex-col items-center gap-1 py-1.5 transition-colors duration-100 hover:bg-foreground hover:text-background disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-foreground",
      className,
    )}
    {...props}
  >
    {children}
    <span className="flex items-baseline gap-1 text-[10px] uppercase">
      {label}
      <Kbd>{shortcut}</Kbd>
    </span>
  </motion.button>
);

export const SudokuToolbar: FC<ISudokuToolbarProps> = ({
  className,
  ...props
}) => {
  const canUndo = useSudokuStore((s) => s.past.length > 0);
  const canRedo = useSudokuStore((s) => s.future.length > 0);
  const undo = useSudokuStore((s) => s.undo);
  const redo = useSudokuStore((s) => s.redo);
  const erase = useSudokuStore((s) => s.erase);
  const fillNotes = useSudokuStore((s) => s.fillNotes);
  const hint = useSudokuStore((s) => s.hint);

  return (
    <div className={cn("grid grid-cols-5", className)} {...props}>
      <ToolButton label="Undo" shortcut="^Z" onClick={undo} disabled={!canUndo}>
        <UndoIcon />
      </ToolButton>
      <ToolButton
        label="Redo"
        shortcut="^⇧Z"
        onClick={redo}
        disabled={!canRedo}
      >
        <RedoIcon />
      </ToolButton>
      <ToolButton label="Erase" shortcut="⌫" onClick={erase}>
        <EraseIcon />
      </ToolButton>
      <ToolButton label="Fill notes" shortcut="N" onClick={fillNotes}>
        <NotesIcon />
      </ToolButton>
      <ToolButton label="Hint" shortcut="H" onClick={hint}>
        <HintIcon />
      </ToolButton>
    </div>
  );
};
