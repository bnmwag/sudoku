"use client";

import { motion } from "motion/react";
import type { ComponentProps, FC } from "react";

import { type ISettings, useSudokuStore } from "@/hooks/use-sudoku-store";
import { LAYOUT_SPRING } from "@/lib/motion-presets";
import { cn } from "@/lib/utils";

interface ISudokuSettingsProps extends ComponentProps<"div"> {}

const SETTINGS: { key: keyof ISettings; label: string; description: string }[] =
  [
    {
      key: "showMistakes",
      label: "Show wrong digits",
      description:
        "Mark digits that don't match the solution, not just repeats.",
    },
    {
      key: "highlightSame",
      label: "Highlight same digits",
      description: "Shade every cell holding the selected digit.",
    },
    {
      key: "autoClearNotes",
      label: "Clear notes automatically",
      description:
        "Placing a digit removes it from notes in its row, column and box.",
    },
  ];

export const SudokuSettings: FC<ISudokuSettingsProps> = ({
  className,
  ...props
}) => {
  const settings = useSudokuStore((s) => s.settings);
  const updateSettings = useSudokuStore((s) => s.updateSettings);

  return (
    <div className={cn("space-y-1", className)} {...props}>
      {SETTINGS.map((item) => {
        const isOn = settings[item.key];
        return (
          <button
            key={item.key}
            type="button"
            role="switch"
            aria-checked={isOn}
            onClick={() => updateSettings({ [item.key]: !isOn })}
            className="group -mx-1.5 flex w-[calc(100%+0.75rem)] cursor-pointer items-center justify-between gap-4 px-1.5 py-1.5 text-left transition-colors duration-100 hover:bg-foreground hover:text-background"
          >
            <span>
              <span className="block text-xs uppercase">{item.label}</span>
              <span className="block text-xs opacity-50">
                {item.description}
              </span>
            </span>
            <span
              className={cn(
                "flex h-4 w-7 shrink-0 border border-current p-0.5",
                isOn ? "justify-end" : "justify-start",
              )}
            >
              <motion.span
                layout
                transition={LAYOUT_SPRING}
                className={cn(
                  "h-full w-2.5 bg-current transition-opacity",
                  isOn ? "opacity-100" : "opacity-40",
                )}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
};
