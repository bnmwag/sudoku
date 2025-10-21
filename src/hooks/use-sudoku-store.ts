"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { nextAIMove } from "@/lib/sudoku-ai";
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
  /** True if the AI is currently solving the puzzle. */
  isAISolving: boolean;
  /** Status of the AI solver. */
  aiStatus: "idle" | "thinking" | "solving" | "done";
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

  /**
   * Initiate AI solving of the puzzle.
   * @param opts Optional animation and delay settings.
   */
  solveWithAI: (opts?: {
    animate?: boolean;
    delayMs?: number;
    stepDelayMs?: number;
  }) => void;

  /**
   * Cancel AI solving if it's in progress.
   */
  cancelAISolve: () => void;
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
      isAISolving: false,
      aiStatus: "idle",

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

      cancelAISolve: () => set({ isAISolving: false, aiStatus: "idle" }),

      solveWithAI: (opts?: { delayMs?: number; stepDelayMs?: number }) => {
        const { solution, isAISolving } = get();
        if (!solution || isAISolving) return;

        const thinkDelay = opts?.delayMs ?? 600; // fake “thinking” pause
        const stepDelay = opts?.stepDelayMs ?? 55; // 1-by-1 pacing

        set({ isAISolving: true, aiStatus: "thinking" });

        const thinkTimer = setTimeout(() => {
          if (!get().isAISolving) return;
          set({ aiStatus: "solving" });

          const tick = () => {
            if (!get().isAISolving) return;

            const s = get();
            if (!s.solution) return;

            // If already identical to solution, wrap up.
            const solved = s.cells.every((v, i) => v === s.solution?.[i]);
            if (solved) {
              const finished =
                s.completedInMs == null && s.startAt != null
                  ? Date.now() - s.startAt
                  : s.completedInMs;

              set({
                completedInMs: finished ?? null,
                isAISolving: false,
                aiStatus: "done",
                errors: toSet(computeConflicts(get().cells)),
              });
              return;
            }

            // Choose the next cell like a human would.
            const move = nextAIMove(s.cells, s.fixed, s.solution);

            // Safety: if no move (shouldn’t happen with a valid solution), snap to solved.
            if (!move) {
              const final = [...s.solution];
              const errs = toSet(computeConflicts(final));
              set({
                cells: final,
                errors: errs,
                isAISolving: false,
                aiStatus: "done",
              });
              return;
            }

            // Fill exactly one cell.
            const next = [...s.cells];
            next[move.index] = move.value;

            const errs = toSet(computeConflicts(next));
            set({ cells: next, errors: errs });

            setTimeout(tick, stepDelay);
          };

          setTimeout(tick, stepDelay);
        }, thinkDelay);

        // Clean up the pending “think” timer if user cancels mid-way.
        const unsub = useSudokuStore.subscribe((st) => {
          if (!st.isAISolving) clearTimeout(thinkTimer);
        });
        setTimeout(() => unsub(), thinkDelay + 4000);
      },
    }),
    {
      name: "sudoku-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ difficulty: state.difficulty }),
    },
  ),
);
