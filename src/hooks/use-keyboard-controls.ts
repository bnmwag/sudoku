"use client";

import { useEffect } from "react";

import {
  type Direction,
  getShownHint,
  useSudokuStore,
} from "@/hooks/use-sudoku-store";
import { useWindowKeydown } from "@/hooks/use-window-keydown";
import type { InputMode } from "@/lib/sudoku-board";

// Letters use `e.key` so shortcuts follow the printed key on QWERTZ and AZERTY layouts.
const DIRECTIONS: Record<string, Direction> = {
  arrowup: "up",
  arrowdown: "down",
  arrowleft: "left",
  arrowright: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

const MODE_KEYS: Record<string, InputMode> = {
  z: "normal",
  x: "corner",
  c: "center",
};

/**
 * Digit 1..9 for a physical key. Uses `code` because Shift changes `key`.
 * @param code `KeyboardEvent.code`.
 */
const getDigit = (code: string) => {
  const match = /^(?:Digit|Numpad)([1-9])$/.exec(code);
  return match ? Number(match[1]) : null;
};

/**
 * Input mode forced by held modifier keys: Shift for corner, Ctrl or Alt for center.
 * @param e Keyboard event.
 */
const getHeldMode = (e: KeyboardEvent): InputMode | null => {
  if (e.ctrlKey || e.altKey) return "center";
  if (e.shiftKey) return "corner";
  return null;
};

/**
 * True when the key would erase: Backspace, Delete or 0.
 * @param e Keyboard event.
 */
const isEraseKey = (e: KeyboardEvent) =>
  e.key === "Backspace" ||
  e.key === "Delete" ||
  e.code === "Digit0" ||
  e.code === "Numpad0";

/**
 * Handles every in-game shortcut.
 * @param e Keyboard event.
 */
const onGameKeyDown = (e: KeyboardEvent) => {
  const store = useSudokuStore.getState();
  const key = e.key.toLowerCase();
  const command = e.metaKey || e.ctrlKey;
  const onButton =
    e.target instanceof HTMLElement && !!e.target.closest("button");

  store.setHeldMode(getHeldMode(e));
  if (store.game?.status !== "playing") return;

  if (!command && !e.altKey) {
    if (key === "m") {
      store.openMenu();
      return;
    }
    if (key === "p") {
      store.togglePause();
      return;
    }
    if (key === "i") {
      if (store.aiStatus === "idle") store.solveWithAi();
      else store.cancelAi();
      return;
    }
  }

  if (key === "escape") {
    if (store.aiStatus !== "idle") store.cancelAi();
    else if (getShownHint(store)) store.dismissHint();
    else if (store.selection.length > 0) store.clearSelection();
    else store.openMenu();
    return;
  }

  if (store.game.resumedAt == null) {
    if (key === " " || key === "enter") {
      e.preventDefault();
      store.resume();
    }
    return;
  }

  if (key === "enter" && !onButton && getShownHint(store)) {
    e.preventDefault();
    store.applyHint();
    return;
  }

  if (command && key === "z") {
    e.preventDefault();
    if (e.shiftKey) store.redo();
    else store.undo();
    return;
  }
  if (command && key === "y") {
    e.preventDefault();
    store.redo();
    return;
  }
  if (command && key === "a") {
    e.preventDefault();
    store.selectAll();
    return;
  }

  const digit = getDigit(e.code);
  if (digit && !e.metaKey) {
    e.preventDefault();
    store.inputDigit(digit, getHeldMode(e) ?? undefined);
    return;
  }

  if (isEraseKey(e)) {
    e.preventDefault();
    store.erase();
    return;
  }

  if (command || e.altKey) return;

  const direction = DIRECTIONS[key];
  if (direction) {
    e.preventDefault();
    store.moveSelection(direction, e.shiftKey);
    return;
  }

  const mode = MODE_KEYS[key];
  if (mode) {
    store.setMode(mode);
    return;
  }

  if (key === " " && !onButton) {
    e.preventDefault();
    store.cycleMode();
    return;
  }
  if (key === "n") store.fillNotes();
  if (key === "h") store.hint();
};

/** Binds the board's keyboard shortcuts while mounted. */
export const useKeyboardControls = () => {
  useWindowKeydown(onGameKeyDown);

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      useSudokuStore.getState().setHeldMode(getHeldMode(e));
    };
    const onBlur = () => {
      useSudokuStore.getState().setHeldMode(null);
    };

    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);
};
