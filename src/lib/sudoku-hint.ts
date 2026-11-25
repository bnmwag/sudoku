import type { ICell } from "@/lib/sudoku-board";
import {
  BOXES,
  COLS,
  getBox,
  getCol,
  getRow,
  PEERS,
  ROWS,
} from "@/lib/sudoku-units";

export type HouseKind = "row" | "column" | "box";

/** A row, column or box, `index` 0..8. */
export interface IHouse {
  kind: HouseKind;
  index: number;
}

export type StepKind =
  | "pointing"
  | "claiming"
  | "naked-pair"
  | "hidden-pair"
  | "x-wing"
  | "xy-wing";

/** Candidate elimination that has to happen before the placement shows up. */
export interface IHintStep {
  kind: StepKind;
  /**
   * Digits of the pattern. For an XY-wing: the pivot's two digits, then the
   * digit that gets removed.
   */
  digits: number[];
  /** Houses the pattern lives in. */
  houses: IHouse[];
  /** Houses the digits get removed from, when they differ from `houses`. */
  targets: IHouse[];
  /** Cells that form the pattern. For an XY-wing the pivot comes first. */
  cells: number[];
}

export type HintKind =
  | "wrong"
  | "full-house"
  | "naked-single"
  | "hidden-single"
  | "answer";

export interface IHint {
  kind: HintKind;
  /** Cell the hint is about. */
  index: number;
  /** Digit to place, or the wrong digit for `wrong`. */
  digit: number;
  /** House that forces the digit (full house, hidden single). */
  house: IHouse | null;
  /** Peer that repeats the wrong digit, if any. */
  conflict: number | null;
  /** Eliminations needed before the placement, in order. */
  steps: IHintStep[];
}

type Candidates = Set<number>[];
type Single = Pick<IHint, "kind" | "index" | "digit" | "house">;

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const HOUSE_CELLS: Record<HouseKind, number[][]> = {
  row: ROWS,
  column: COLS,
  box: BOXES,
};

/**
 * Every house of one kind.
 * @param kind Row, column or box.
 */
const getHouses = (kind: HouseKind): IHouse[] =>
  DIGITS.map((d) => ({ kind, index: d - 1 }));

/** Boxes first, the way most people scan a board. */
const HOUSES: IHouse[] = [
  ...getHouses("box"),
  ...getHouses("row"),
  ...getHouses("column"),
];

/**
 * Cell indices of a house.
 * @param house Row, column or box.
 */
export const getHouseCells = (house: IHouse) =>
  HOUSE_CELLS[house.kind][house.index];

/**
 * Candidate digits per cell, based on placed digits only.
 * @param values Placed digits, 0 for empty.
 */
const getCandidates = (values: number[]): Candidates =>
  values.map((v, i) => {
    if (v) return new Set<number>();
    const used = new Set(PEERS[i].map((p) => values[p]));
    return new Set(DIGITS.filter((d) => !used.has(d)));
  });

/**
 * Empty cells of a house that can still hold a digit.
 * @param cand Candidates per cell.
 * @param house House to look in.
 * @param digit Digit 1..9.
 */
const getSpots = (cand: Candidates, house: IHouse, digit: number) =>
  getHouseCells(house).filter((i) => cand[i].has(digit));

/**
 * True when every candidate of a cell is in `digits`.
 * @param cand Candidates per cell.
 * @param cell Cell index.
 * @param digits Allowed digits.
 */
const hasOnly = (cand: Candidates, cell: number, digits: number[]) =>
  [...cand[cell]].every((d) => digits.includes(d));

/**
 * Candidates a step removes, or null when its pattern no longer holds.
 * @param cand Candidates per cell.
 * @param step Elimination step.
 * @returns Pairs of [cell, digit].
 */
const getRemovals = (
  cand: Candidates,
  step: IHintStep,
): [number, number][] | null => {
  const { kind, digits, houses, targets, cells } = step;
  const collect = (from: number[], remove: number[]) =>
    from.flatMap((i) =>
      remove.filter((d) => cand[i].has(d)).map((d): [number, number] => [i, d]),
    );

  if (kind === "pointing" || kind === "claiming" || kind === "x-wing") {
    const [digit] = digits;
    const allowed = new Set(targets.flatMap(getHouseCells));
    const holds = houses.every((h) =>
      getSpots(cand, h, digit).every((i) => allowed.has(i)),
    );
    if (!holds) return null;
    const inPattern = new Set(houses.flatMap(getHouseCells));
    return collect(
      [...allowed].filter((i) => !inPattern.has(i)),
      [digit],
    );
  }

  if (kind === "naked-pair") {
    if (!cells.every((i) => hasOnly(cand, i, digits))) return null;
    const others = getHouseCells(houses[0]).filter((i) => !cells.includes(i));
    return collect(others, digits);
  }

  if (kind === "hidden-pair") {
    const holds = digits.every((d) =>
      getSpots(cand, houses[0], d).every((i) => cells.includes(i)),
    );
    if (!holds) return null;
    return collect(
      cells,
      DIGITS.filter((d) => !digits.includes(d)),
    );
  }

  const [pivot, a, b] = cells;
  const [x, y, z] = digits;
  const holds =
    hasOnly(cand, pivot, [x, y]) &&
    hasOnly(cand, a, [x, z]) &&
    hasOnly(cand, b, [y, z]);
  if (!holds) return null;
  const seesBoth = PEERS[a].filter((i) => i !== pivot && PEERS[b].includes(i));
  return collect(seesBoth, [z]);
};

/**
 * Every elimination pattern on the board, simplest techniques first.
 * Patterns may remove nothing; `getRemovals` decides.
 * @param cand Candidates per cell.
 */
function* getPatterns(cand: Candidates): Generator<IHintStep> {
  for (const box of getHouses("box")) {
    for (const digit of DIGITS) {
      const spots = getSpots(cand, box, digit);
      if (spots.length < 2) continue;
      for (const [kind, getIndex] of [
        ["row", getRow],
        ["column", getCol],
      ] as const) {
        if (spots.every((i) => getIndex(i) === getIndex(spots[0]))) {
          yield {
            kind: "pointing",
            digits: [digit],
            houses: [box],
            targets: [{ kind, index: getIndex(spots[0]) }],
            cells: spots,
          };
        }
      }
    }
  }

  for (const line of [...getHouses("row"), ...getHouses("column")]) {
    for (const digit of DIGITS) {
      const spots = getSpots(cand, line, digit);
      if (spots.length < 2) continue;
      const box = getBox(spots[0]);
      if (spots.every((i) => getBox(i) === box)) {
        yield {
          kind: "claiming",
          digits: [digit],
          houses: [line],
          targets: [{ kind: "box", index: box }],
          cells: spots,
        };
      }
    }
  }

  for (const house of HOUSES) {
    const pairs = getHouseCells(house).filter((i) => cand[i].size === 2);
    for (const [k, a] of pairs.entries()) {
      for (const b of pairs.slice(k + 1)) {
        const digits = [...cand[a]];
        if (digits.every((d) => cand[b].has(d))) {
          yield {
            kind: "naked-pair",
            digits,
            houses: [house],
            targets: [],
            cells: [a, b],
          };
        }
      }
    }
  }

  for (const house of HOUSES) {
    const twoSpots = DIGITS.map(
      (d) => [d, getSpots(cand, house, d)] as const,
    ).filter(([, spots]) => spots.length === 2);
    for (const [k, [d1, s1]] of twoSpots.entries()) {
      for (const [d2, s2] of twoSpots.slice(k + 1)) {
        if (s1[0] === s2[0] && s1[1] === s2[1]) {
          yield {
            kind: "hidden-pair",
            digits: [d1, d2],
            houses: [house],
            targets: [],
            cells: s1,
          };
        }
      }
    }
  }

  for (const [kind, cross, getCross] of [
    ["row", "column", getCol],
    ["column", "row", getRow],
  ] as const) {
    for (const digit of DIGITS) {
      const lines = getHouses(kind)
        .map((line) => ({ line, spots: getSpots(cand, line, digit) }))
        .filter(({ spots }) => spots.length === 2);
      for (const [k, a] of lines.entries()) {
        for (const b of lines.slice(k + 1)) {
          const crossA = a.spots.map(getCross);
          const crossB = b.spots.map(getCross);
          if (crossA[0] === crossB[0] && crossA[1] === crossB[1]) {
            yield {
              kind: "x-wing",
              digits: [digit],
              houses: [a.line, b.line],
              targets: crossA.map((index) => ({ kind: cross, index })),
              cells: [...a.spots, ...b.spots],
            };
          }
        }
      }
    }
  }

  const bivalue = cand.flatMap((c, i) => (c.size === 2 ? [i] : []));
  for (const pivot of bivalue) {
    const [x, y] = cand[pivot];
    const wings = bivalue.filter((i) => PEERS[pivot].includes(i));
    for (const a of wings) {
      if (!cand[a].has(x) || cand[a].has(y)) continue;
      const [z] = [...cand[a]].filter((d) => d !== x);
      for (const b of wings) {
        if (b !== a && cand[b].has(y) && cand[b].has(z)) {
          yield {
            kind: "xy-wing",
            digits: [x, y, z],
            houses: [],
            targets: [],
            cells: [pivot, a, b],
          };
        }
      }
    }
  }
}

/**
 * Applies the first elimination that removes at least one candidate.
 * @param cand Candidates per cell (mutated).
 */
const applyNextStep = (cand: Candidates): IHintStep | null => {
  for (const step of getPatterns(cand)) {
    const removals = getRemovals(cand, step);
    if (!removals?.length) continue;
    for (const [i, d] of removals) cand[i].delete(d);
    return step;
  }
  return null;
};

/**
 * First placement that follows directly from the candidates.
 * @param values Placed digits, 0 for empty.
 * @param cand Candidates per cell.
 */
const findSingle = (values: number[], cand: Candidates): Single | null => {
  for (const house of HOUSES) {
    const empty = getHouseCells(house).filter((i) => !values[i]);
    if (empty.length === 1 && cand[empty[0]].size === 1) {
      const [digit] = cand[empty[0]];
      return { kind: "full-house", index: empty[0], digit, house };
    }
  }

  for (let i = 0; i < 81; i++) {
    if (!values[i] && cand[i].size === 1) {
      const [digit] = cand[i];
      return { kind: "naked-single", index: i, digit, house: null };
    }
  }

  for (const house of HOUSES) {
    for (const digit of DIGITS) {
      const spots = getSpots(cand, house, digit);
      if (spots.length === 1) {
        return { kind: "hidden-single", index: spots[0], digit, house };
      }
    }
  }

  return null;
};

/**
 * True when the steps, replayed from scratch, still force the single.
 * @param values Placed digits, 0 for empty.
 * @param steps Steps to replay in order.
 * @param single Placement to check.
 */
const isForcedBy = (values: number[], steps: IHintStep[], single: Single) => {
  const cand = getCandidates(values);
  for (const step of steps) {
    const removals = getRemovals(cand, step);
    if (!removals) return false;
    for (const [i, d] of removals) cand[i].delete(d);
  }
  if (single.kind === "naked-single") {
    return (
      cand[single.index].size === 1 && cand[single.index].has(single.digit)
    );
  }
  if (single.kind === "hidden-single" && single.house) {
    const spots = getSpots(cand, single.house, single.digit);
    return spots.length === 1 && spots[0] === single.index;
  }
  return true;
};

/**
 * Drops steps the placement does not depend on, so the explanation stays short.
 * @param values Placed digits, 0 for empty.
 * @param steps Steps that led to the single.
 * @param single Placement they led to.
 */
const pruneSteps = (values: number[], steps: IHintStep[], single: Single) => {
  let kept = steps;
  for (let k = kept.length - 1; k >= 0; k--) {
    const without = kept.filter((_, j) => j !== k);
    if (isForcedBy(values, without, single)) kept = without;
  }
  return kept;
};

/**
 * Next move a person could find by reasoning, with what it takes to see it.
 * Wrong digits come first since every deduction after them would be off.
 * Falls back to revealing the most constrained cell when no technique applies.
 * @param cells Board cells.
 * @param solution Solved values 1..9.
 * @returns The hint, or null when the board is solved.
 */
export const getHint = (cells: ICell[], solution: number[]): IHint | null => {
  const values = cells.map((c) => c.value);

  const wrong = values.findIndex(
    (v, i) => v !== 0 && !cells[i].given && v !== solution[i],
  );
  if (wrong !== -1) {
    const digit = values[wrong];
    return {
      kind: "wrong",
      index: wrong,
      digit,
      house: null,
      conflict: PEERS[wrong].find((p) => values[p] === digit) ?? null,
      steps: [],
    };
  }

  const cand = getCandidates(values);
  const steps: IHintStep[] = [];
  for (;;) {
    const single = findSingle(values, cand);
    if (single && single.digit === solution[single.index]) {
      return {
        ...single,
        conflict: null,
        steps: pruneSteps(values, steps, single),
      };
    }
    const step = single ? null : applyNextStep(cand);
    if (!step) break;
    steps.push(step);
  }

  const empty = values.flatMap((v, i) => (v ? [] : [i]));
  if (empty.length === 0) return null;
  const sizes = getCandidates(values).map((c) => c.size);
  const index = empty.reduce((best, i) => (sizes[i] < sizes[best] ? i : best));
  return {
    kind: "answer",
    index,
    digit: solution[index],
    house: null,
    conflict: null,
    steps: [],
  };
};

/**
 * Digits already placed in a cell's row, column and box, ascending.
 * @param cells Board cells.
 * @param index Cell index.
 */
export const getPeerDigits = (cells: ICell[], index: number) =>
  DIGITS.filter((d) => PEERS[index].some((p) => cells[p].value === d));

/**
 * Cells to light up while a hint is shown.
 * @param hint Hint to explain.
 * @param cells Board cells.
 * @returns `area`: cells the reasoning looks at. `reason`: digits and patterns that force the move.
 */
export const getHintCells = (hint: IHint, cells: ICell[]) => {
  const area = new Set<number>();
  const reason = new Set<number>();
  /** First peer of `cell` that holds `digit`. */
  const findBlocker = (cell: number, digit: number) =>
    PEERS[cell].find((p) => cells[p].value === digit);

  if (hint.kind === "wrong" && hint.conflict != null) {
    reason.add(hint.conflict);
  }
  if (hint.kind === "full-house" && hint.house) {
    for (const i of getHouseCells(hint.house)) area.add(i);
  }
  if (hint.kind === "naked-single") {
    for (const i of PEERS[hint.index]) area.add(i);
    for (const d of getPeerDigits(cells, hint.index)) {
      const blocker = findBlocker(hint.index, d);
      if (blocker != null) reason.add(blocker);
    }
  }
  if (hint.kind === "hidden-single" && hint.house) {
    for (const i of getHouseCells(hint.house)) {
      area.add(i);
      if (i === hint.index || cells[i].value) continue;
      const blocker = findBlocker(i, hint.digit);
      if (blocker != null) reason.add(blocker);
    }
  }
  for (const step of hint.steps) {
    for (const i of step.cells) reason.add(i);
  }

  area.delete(hint.index);
  reason.delete(hint.index);
  return { area, reason };
};
