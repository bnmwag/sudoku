"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  computeConflicts,
  type Difficulty,
  generatePuzzle,
} from "@/lib/sudoku-helpers";

export type SudokuState = {
  cells: string[];
  fixed: boolean[];
  errors: Set<number>;
  active: number | null;
  difficulty: Difficulty;
  startAt: number | null;
  completedInMs: number | null;
  solution?: string[] | null;
  gameActive: boolean;
};

export type SudokuActions = {
  newGame: (d?: Difficulty) => void;
  setActive: (i: number | null) => void;
  inputDigit: (i: number, v: string) => void;
  clearCell: (i: number) => void;
  setDifficulty: (d: Difficulty) => void;
};

type Store = SudokuState & SudokuActions;

const toSet = (x: unknown): Set<number> =>
  x instanceof Set ? x : new Set(Array.isArray(x) ? (x as number[]) : []);

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
        if (fixed[i]) return;

        const next = [...cells];
        next[i] = v;

        const badRaw = computeConflicts(next);
        const bad = toSet(badRaw);

        let done: number | null = null;
        if (
          next.every((x) => x !== "") &&
          bad.size === 0 && // safe now
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
