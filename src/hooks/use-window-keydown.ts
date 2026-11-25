"use client";

import { useEffect } from "react";

/**
 * Calls a keydown handler on the window while mounted, skipping text fields.
 * Pass a stable function (module level or memoized) to avoid rebinding.
 * @param handler Keydown handler.
 */
export const useWindowKeydown = (handler: (e: KeyboardEvent) => void) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target?.closest("input, textarea, select")) return;
      handler(e);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handler]);
};
