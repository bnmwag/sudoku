"use client";

import { useEffect } from "react";

import { useSudokuStore } from "@/hooks/use-sudoku-store";

/** Pauses the clock when the tab is hidden or the page is closed. */
export const usePauseWhenHidden = () => {
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        useSudokuStore.getState().pause();
      }
    };
    const onPageHide = () => useSudokuStore.getState().pause();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);
};
