"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  computeConflicts,
  type Difficulty,
  generatePuzzle,
} from "@/lib/sudoku-helpers";

/**
 * Reactive state for the Sudoku game board and metadata.
 */
export type SudokuState = {
  /** Current cell values as strings "1".."9" or "" for blank (81 length). */
  cells: string[];
  /** True for fixed clue cells that cannot be edited. */
  fixed: boolean[];
  /** Indices of cells that currently violate Sudoku rules. */
  errors: Set<number>;
  /** The currently active (focused) cell index, or null if none. */
  active: number | null;
  /** Difficulty preset of the current or next game. */
  difficulty: Difficulty;
  /** Timestamp (ms) when the current game started, or null if none. */
  startAt: number | null;
  /** Time in milliseconds when the puzzle was completed, or null if unfinished. */
  completedInMs: number | null;
  /** Full solved grid for the current puzzle, if generated. */
  solution?: string[] | null;
  /** True if a game is currently active (board visible). */
  gameActive: boolean;
};

/**
 * Actions for manipulating the Sudoku state.
 */
export type SudokuActions = {
  /**
   * Generate a new Sudoku puzzle, resetting timers and errors.
   * @param d Optional difficulty override; defaults to current `difficulty`.
   */
  newGame: (d?: Difficulty) => void;

  /**
   * Set the active (focused) cell index.
   * @param i Index 0..80, or null to clear focus.
   */
  setActive: (i: number | null) => void;

  /**
   * Insert a digit (1–9) into a cell, recomputing conflicts and completion state.
   * @param i Cell index 0..80.
   * @param v Value string "1".."9".
   */
  inputDigit: (i: number, v: string) => void;

  /**
   * Clear a cell value, recomputing conflicts.
   * @param i Cell index 0..80.
   */
  clearCell: (i: number) => void;

  /**
   * Update the stored default difficulty level for future games.
   * @param d Difficulty preset.
   */
  setDifficulty: (d: Difficulty) => void;
};

/**
 * Combined Sudoku store type containing both state and actions.
 */
type Store = SudokuState & SudokuActions;

/**
 * Ensures that the provided input is a `Set<number>`, coercing arrays if necessary.
 * @param x Unknown value, possibly from persisted JSON.
 */
const toSet = (x: unknown): Set<number> =>
  x instanceof Set ? x : new Set(Array.isArray(x) ? (x as number[]) : []);

/**
 * Zustand store that holds Sudoku game state and logic.
 * Persists only the difficulty setting to localStorage.
 */
export const useSudokuStore = create<Store>()(
  persist(
    (set, get) => ({
      cells: Array(81).fill("") as string[],
      fixed: Array(81).fill(false),
      errors: new Set<number>(),
      active: null,
      difficulty: "easy",
      startAt: null,
      completedInMs: null,
      solution: null,
      gameActive: false,

      newGame: (d) => {
        const diff = d ?? get().difficulty;
        const { puzzle, fixed, solution } = generatePuzzle(diff);
        set({
          difficulty: diff,
          cells: puzzle,
          fixed,
          solution,
          errors: new Set(),
          active: null,
          startAt: Date.now(),
          completedInMs: null,
          gameActive: true,
        });
      },

      setActive: (i) => set({ active: i }),

      inputDigit: (i, v) => {
        const { cells, fixed, startAt, completedInMs } = get();
        if (fixed[i]) return; // ignore edits to clues

        const next = [...cells];
        next[i] = v;

        const bad = toSet(computeConflicts(next));
        let done: number | null = null;

        // check for completion
        if (
          next.every((x) => x !== "") &&
          bad.size === 0 &&
          completedInMs == null &&
          startAt != null
        ) {
          done = Date.now() - startAt;
        }

        set({ cells: next, errors: bad, completedInMs: done ?? null });
      },

      clearCell: (i) => {
        const { cells } = get();
        const next = [...cells];
        next[i] = "";
        const bad = toSet(computeConflicts(next));
        set({ cells: next, errors: bad });
      },

      setDifficulty: (d) => set({ difficulty: d }),
    }),
    {
      name: "sudoku-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ difficulty: state.difficulty }),
    },
  ),
);
