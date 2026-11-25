import type { ComponentProps, FC } from "react";

import { cn } from "@/lib/utils";

interface IKbdProps extends ComponentProps<"kbd"> {}

/** Keyboard shortcut hint, shown only on devices with a fine pointer. */
export const Kbd: FC<IKbdProps> = ({ className, ...props }) => {
  return (
    <kbd
      className={cn(
        "hidden font-mono text-[9px] leading-none opacity-50 pointer-fine:inline",
        className,
      )}
      {...props}
    />
  );
};
