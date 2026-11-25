"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { vibrate } from "@/lib/haptics";
import type { ICell, InputMode } from "@/lib/sudoku-board";
import {
  applyDigit,
  createCells,
  eraseCells,
  fillCandidates,
  getCellDistance,
  getCompletedUnits,
  INPUT_MODES,
  isSolved,
} from "@/lib/sudoku-board";
import type { Difficulty } from "@/lib/sudoku-helpers";
import { generatePuzzle } from "@/lib/sudoku-helpers";
import { getHint, type IHint } from "@/lib/sudoku-hint";
import { getCol, getRow, UNITS } from "@/lib/sudoku-units";

export type Screen = "menu" | "game" | "done";
export type Direction = "up" | "down" | "left" | "right";
export type AiStatus = "idle" | "thinking" | "solving";

export interface ISettings {
  /** Mark digits that differ from the solution, not only rule breaks. */
  showMistakes: boolean;
  /** Highlight every cell holding the selected digit. */
  highlightSame: boolean;
  /** Placing a digit removes it from marks in the same row, column and box. */
  autoClearNotes: boolean;
}

export interface IGame {
  difficulty: Difficulty;
  cells: ICell[];
  solution: number[];
  /** Play time folded in at the last pause. */
  elapsedMs: number;
  /** When the clock last started, or null while paused. */
  resumedAt: number | null;
  status: "playing" | "won";
  hintsUsed: number;
  usedAi: boolean;
}

/** Staggered flash over a set of cells. `delays` maps cell index to ms. */
export interface IRipple {
  id: number;
  delays: Record<number, number>;
}

/** Hint on screen, tied to the board it was computed for. */
export interface IShownHint {
  hint: IHint;
  cells: ICell[];
}

/** Shake on cells that refused an input. */
export interface IShake {
  id: number;
  cells: number[];
}

interface ISudokuState {
  hydrated: boolean;
  screen: Screen;
  difficulty: Difficulty;
  settings: ISettings;
  game: IGame | null;
  selection: number[];
  mode: InputMode;
  /** Mode forced by a held modifier key; wins over `mode` while set. */
  heldMode: InputMode | null;
  past: ICell[][];
  future: ICell[][];
  ripple: IRipple | null;
  shake: IShake | null;
  aiStatus: AiStatus;
  shownHint: IShownHint | null;
}

interface ISudokuActions {
  finishHydration: () => void;
  setDifficulty: (difficulty: Difficulty) => void;
  updateSettings: (settings: Partial<ISettings>) => void;
  newGame: (difficulty?: Difficulty) => void;
  continueGame: () => void;
  openMenu: () => void;
  pause: () => void;
  resume: () => void;
  togglePause: () => void;
  select: (index: number, additive: boolean) => void;
  extendSelection: (index: number) => void;
  selectDigit: (digit: number) => void;
  selectAll: () => void;
  clearSelection: () => void;
  moveSelection: (direction: Direction, extend: boolean) => void;
  setMode: (mode: InputMode) => void;
  cycleMode: () => void;
  setHeldMode: (mode: InputMode | null) => void;
  inputDigit: (digit: number, mode?: InputMode) => void;
  erase: () => void;
  undo: () => void;
  redo: () => void;
  fillNotes: () => void;
  restart: () => void;
  /** Shows the next hint, or applies it when one is already shown. */
  hint: () => void;
  applyHint: () => void;
  dismissHint: () => void;
  solveWithAi: () => void;
  cancelAi: () => void;
}

type SudokuStore = ISudokuState & ISudokuActions;

const HISTORY_LIMIT = 300;
const RIPPLE_STEP_MS = 38;
const WIN_RIPPLE_STEP_MS = 48;
const DONE_SCREEN_DELAY_MS = 1400;
/** Longest CSS effect (ripple, bump, shake) plus a little slack. */
const EFFECT_DURATION_MS = 700;
const AI_THINK_MS = 1200;
const AI_STEP_MS = 55;

let effectId = 0;
let aiRunId = 0;

/**
 * Play time of a game at a given moment.
 * @param game Current game.
 * @param now Timestamp in ms.
 */
export const getElapsedMs = (game: IGame, now: number) =>
  game.elapsedMs + (game.resumedAt != null ? now - game.resumedAt : 0);

/**
 * The hint on screen, or null once the board has changed under it.
 * @param state Store state.
 */
export const getShownHint = (state: ISudokuState) =>
  state.shownHint && state.shownHint.cells === state.game?.cells
    ? state.shownHint.hint
    : null;

/**
 * True when the board accepts player input.
 * @param state Store state.
 */
const isEditable = (state: ISudokuState) =>
  state.game?.status === "playing" &&
  state.game.resumedAt != null &&
  state.aiStatus === "idle";

/**
 * Builds a ripple that spreads outward from one cell.
 * @param cells Cells to flash.
 * @param origin Cell the ripple starts from.
 * @param stepMs Delay per step of grid distance.
 */
const createRipple = (
  cells: number[],
  origin: number,
  stepMs: number,
): IRipple => {
  const delays: Record<number, number> = {};
  for (const i of cells) delays[i] = getCellDistance(origin, i) * stepMs;
  return { id: ++effectId, delays };
};

/**
 * Wraps a cell index one step in a direction.
 * @param index Cell index.
 * @param direction Arrow direction.
 */
const getNeighbor = (index: number, direction: Direction) => {
  const r = getRow(index);
  const c = getCol(index);
  if (direction === "up") return ((r + 8) % 9) * 9 + c;
  if (direction === "down") return ((r + 1) % 9) * 9 + c;
  if (direction === "left") return r * 9 + ((c + 8) % 9);
  return r * 9 + ((c + 1) % 9);
};

export const useSudokuStore = create<SudokuStore>()(
  persist(
    (set, get) => {
      /**
       * Starts a ripple and clears it once every cell has finished animating.
       * @param cells Cells to flash.
       * @param origin Cell the ripple starts from.
       * @param stepMs Delay per step of grid distance.
       */
      const playRipple = (cells: number[], origin: number, stepMs: number) => {
        const ripple = createRipple(cells, origin, stepMs);
        const longest = Math.max(0, ...Object.values(ripple.delays));
        set({ ripple });
        // Unmount the effect once it has played so later renders don't replay it.
        setTimeout(() => {
          if (get().ripple?.id === ripple.id) set({ ripple: null });
        }, longest + EFFECT_DURATION_MS);
      };

      /**
       * Writes new cells with history, then plays completion feedback or wins.
       * @param next New board cells.
       * @param origin Cell the change came from, used for ripples.
       * @param haptics Vibrate on change.
       */
      const commit = (next: ICell[], origin: number, haptics = true) => {
        const { game, past } = get();
        if (!game) return;

        const before = getCompletedUnits(game.cells);
        const completed = [...getCompletedUnits(next)]
          .filter((u) => !before.has(u))
          .flatMap((u) => UNITS[u]);

        set({
          game: { ...game, cells: next },
          past: [...past, game.cells].slice(-HISTORY_LIMIT),
          future: [],
        });

        if (isSolved(next, game.solution)) {
          win(origin);
          return;
        }
        if (completed.length > 0) {
          playRipple(completed, origin, RIPPLE_STEP_MS);
          if (haptics) vibrate([10, 50, 14]);
          return;
        }
        if (haptics) vibrate(6);
      };

      /**
       * Stops the clock, plays the board-wide ripple, then shows the done screen.
       * @param origin Cell of the final move.
       */
      const win = (origin: number) => {
        const { game } = get();
        if (!game) return;

        aiRunId++;
        set({
          game: {
            ...game,
            status: "won",
            elapsedMs: getElapsedMs(game, Date.now()),
            resumedAt: null,
          },
          selection: [],
          heldMode: null,
          aiStatus: "idle",
        });
        playRipple(
          Array.from({ length: 81 }, (_, i) => i),
          origin,
          WIN_RIPPLE_STEP_MS,
        );
        vibrate([16, 60, 16, 60, 40]);

        setTimeout(() => {
          if (get().game?.status === "won" && get().screen === "game") {
            set({ screen: "done" });
          }
        }, DONE_SCREEN_DELAY_MS);
      };

      /**
       * Shakes cells that could not take the last input.
       * @param cells Cells to shake.
       */
      const refuse = (cells: number[]) => {
        const shake = { id: ++effectId, cells };
        set({ shake });
        vibrate([8, 40, 8]);
        setTimeout(() => {
          if (get().shake?.id === shake.id) set({ shake: null });
        }, EFFECT_DURATION_MS);
      };

      return {
        hydrated: false,
        screen: "menu",
        difficulty: "easy",
        settings: {
          showMistakes: false,
          highlightSame: true,
          autoClearNotes: true,
        },
        game: null,
        selection: [],
        mode: "normal",
        heldMode: null,
        past: [],
        future: [],
        ripple: null,
        shake: null,
        aiStatus: "idle",
        shownHint: null,

        finishHydration: () => {
          const { game } = get();
          // The clock was folded at the last pause; anything after that is lost on purpose.
          set({
            hydrated: true,
            game: game ? { ...game, resumedAt: null } : null,
          });
        },

        setDifficulty: (difficulty) => set({ difficulty }),

        updateSettings: (settings) =>
          set({ settings: { ...get().settings, ...settings } }),

        newGame: (difficulty) => {
          const d = difficulty ?? get().difficulty;
          const { puzzle, solution } = generatePuzzle(d);
          aiRunId++;
          set({
            difficulty: d,
            screen: "game",
            game: {
              difficulty: d,
              cells: createCells(puzzle),
              solution: solution.map(Number),
              elapsedMs: 0,
              resumedAt: Date.now(),
              status: "playing",
              hintsUsed: 0,
              usedAi: false,
            },
            selection: [],
            heldMode: null,
            past: [],
            future: [],
            ripple: null,
            shake: null,
            aiStatus: "idle",
          });
        },

        continueGame: () => {
          if (get().game?.status !== "playing") return;
          set({ screen: "game" });
          get().resume();
        },

        openMenu: () => {
          get().cancelAi();
          get().pause();
          set({ screen: "menu", heldMode: null });
        },

        pause: () => {
          const { game } = get();
          if (game?.status !== "playing" || game.resumedAt == null) return;
          set({
            game: {
              ...game,
              elapsedMs: getElapsedMs(game, Date.now()),
              resumedAt: null,
            },
            heldMode: null,
          });
        },

        resume: () => {
          const { game } = get();
          if (game?.status !== "playing" || game.resumedAt != null) return;
          set({ game: { ...game, resumedAt: Date.now() } });
        },

        togglePause: () => {
          const { game } = get();
          if (game?.resumedAt == null) get().resume();
          else get().pause();
        },

        select: (index, additive) => {
          const { selection } = get();
          if (!additive) {
            set({ selection: [index] });
            return;
          }
          set({
            selection: selection.includes(index)
              ? selection.filter((i) => i !== index)
              : [...selection, index],
          });
        },

        extendSelection: (index) => {
          const { selection } = get();
          if (selection.includes(index)) return;
          set({ selection: [...selection, index] });
        },

        selectDigit: (digit) => {
          const { game } = get();
          if (!game || digit === 0) return;
          const matches = game.cells
            .map((c, i) => (c.value === digit ? i : -1))
            .filter((i) => i !== -1);
          if (matches.length > 0) set({ selection: matches });
        },

        selectAll: () =>
          set({ selection: Array.from({ length: 81 }, (_, i) => i) }),

        clearSelection: () => set({ selection: [] }),

        moveSelection: (direction, extend) => {
          const { selection } = get();
          const cursor = selection.at(-1);
          if (cursor == null) {
            set({ selection: [40] });
            return;
          }
          const next = getNeighbor(cursor, direction);
          set({
            selection: extend
              ? [...selection.filter((i) => i !== next), next]
              : [next],
          });
        },

        setMode: (mode) => set({ mode }),

        cycleMode: () => {
          const { mode } = get();
          const index = INPUT_MODES.indexOf(mode);
          set({ mode: INPUT_MODES[(index + 1) % INPUT_MODES.length] });
        },

        setHeldMode: (heldMode) => {
          if (get().heldMode !== heldMode) set({ heldMode });
        },

        inputDigit: (digit, mode) => {
          const state = get();
          if (!isEditable(state) || !state.game) return;
          if (state.selection.length === 0) return;

          const next = applyDigit(
            state.game.cells,
            state.selection,
            digit,
            mode ?? state.heldMode ?? state.mode,
            state.settings.autoClearNotes,
          );
          if (!next) {
            refuse(state.selection);
            return;
          }
          commit(next, state.selection.at(-1) ?? 0);
        },

        erase: () => {
          const state = get();
          if (!isEditable(state) || !state.game) return;
          if (state.selection.length === 0) return;

          const next = eraseCells(state.game.cells, state.selection);
          if (!next) {
            refuse(state.selection);
            return;
          }
          commit(next, state.selection.at(-1) ?? 0);
        },

        undo: () => {
          const state = get();
          const previous = state.past.at(-1);
          if (!isEditable(state) || !state.game || !previous) return;
          set({
            game: { ...state.game, cells: previous },
            past: state.past.slice(0, -1),
            future: [state.game.cells, ...state.future],
          });
          vibrate(6);
        },

        redo: () => {
          const state = get();
          const following = state.future[0];
          if (!isEditable(state) || !state.game || !following) return;
          set({
            game: { ...state.game, cells: following },
            past: [...state.past, state.game.cells],
            future: state.future.slice(1),
          });
          vibrate(6);
        },

        fillNotes: () => {
          const state = get();
          if (!isEditable(state) || !state.game) return;
          commit(
            fillCandidates(state.game.cells),
            state.selection.at(-1) ?? 40,
          );
          playRipple(
            state.game.cells.flatMap((c, i) => (c.value ? [] : [i])),
            state.selection.at(-1) ?? 40,
            RIPPLE_STEP_MS / 2,
          );
        },

        restart: () => {
          const state = get();
          if (!isEditable(state) || !state.game) return;
          const cleared = state.game.cells.map((c) =>
            c.given ? c : { ...c, value: 0, corner: [], center: [] },
          );
          commit(cleared, 40);
          set({ selection: [] });
        },

        hint: () => {
          const state = get();
          if (!isEditable(state) || !state.game) return;
          if (getShownHint(state)) {
            get().applyHint();
            return;
          }

          const { game } = state;
          const hint = getHint(game.cells, game.solution);
          if (!hint) return;
          set({
            game: { ...game, hintsUsed: game.hintsUsed + 1 },
            shownHint: { hint, cells: game.cells },
            selection: [hint.index],
          });
          vibrate(6);
        },

        applyHint: () => {
          const state = get();
          const hint = getShownHint(state);
          if (!isEditable(state) || !state.game || !hint) return;

          const next =
            hint.kind === "wrong"
              ? eraseCells(state.game.cells, [hint.index])
              : applyDigit(
                  state.game.cells,
                  [hint.index],
                  hint.digit,
                  "normal",
                  state.settings.autoClearNotes,
                );
          set({ shownHint: null, selection: [hint.index] });
          if (next) commit(next, hint.index);
        },

        dismissHint: () => set({ shownHint: null }),

        solveWithAi: () => {
          const state = get();
          if (!isEditable(state) || !state.game) return;

          const runId = ++aiRunId;
          set({
            aiStatus: "thinking",
            selection: [],
            game: { ...state.game, usedAi: true },
          });

          const step = () => {
            const { game, aiStatus, settings } = get();
            if (runId !== aiRunId || aiStatus === "idle") return;
            if (!game || game.status !== "playing") return;
            if (game.resumedAt == null) {
              setTimeout(step, AI_STEP_MS * 4);
              return;
            }

            // Wrong digits get replaced straight away instead of cleared first.
            const move = getHint(game.cells, game.solution);
            const next =
              move &&
              applyDigit(
                game.cells,
                [move.index],
                game.solution[move.index],
                "normal",
                settings.autoClearNotes,
              );
            if (!move || !next) {
              set({ aiStatus: "idle" });
              return;
            }

            set({ aiStatus: "solving" });
            commit(next, move.index, false);
            setTimeout(step, AI_STEP_MS);
          };

          setTimeout(step, AI_THINK_MS);
        },

        cancelAi: () => {
          aiRunId++;
          if (get().aiStatus !== "idle") set({ aiStatus: "idle" });
        },
      };
    },
    {
      name: "sudoku",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        difficulty: state.difficulty,
        settings: state.settings,
        mode: state.mode,
        game: state.game,
      }),
    },
  ),
);
