import type { ComponentProps, FC } from "react";

import { cn } from "@/lib/utils";

interface ISudokuControlsHelpProps extends ComponentProps<"dl"> {}

const CONTROLS: [keys: string, action: string][] = [
  ["1–9", "Place digit"],
  ["Shift + 1–9", "Corner mark"],
  ["Ctrl / Alt + 1–9", "Center mark"],
  ["Z / X / C, Space", "Pick or cycle mode"],
  ["Arrows / WASD", "Move, hold Shift to add cells"],
  ["Ctrl + A", "Select all cells"],
  ["Drag, Ctrl + click", "Select several cells"],
  ["Double-click", "Select every cell with that digit"],
  ["Backspace / 0", "Erase"],
  ["Ctrl + Z / Ctrl + Shift + Z", "Undo / redo"],
  ["N", "Fill notes with every candidate"],
  ["H", "Hint, again or Enter to apply it"],
  ["I", "Solve with AI, again to stop"],
  ["P", "Pause"],
  ["Esc", "Close hint, deselect, then back to the menu"],
  ["M", "Menu"],
];

export const SudokuControlsHelp: FC<ISudokuControlsHelpProps> = ({
  className,
  ...props
}) => {
  return (
    <dl
      className={cn("grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5", className)}
      {...props}
    >
      {CONTROLS.map(([keys, action]) => (
        <div key={keys} className="contents">
          <dt className="font-mono text-[11px] opacity-50">{keys}</dt>
          <dd className="text-xs">{action}</dd>
        </div>
      ))}
    </dl>
  );
};
