import type { ICell } from "@/lib/sudoku-board";
import {
  getPeerDigits,
  type HintKind,
  type IHint,
  type IHintStep,
  type IHouse,
} from "@/lib/sudoku-hint";
import { getBox, getCol, getRow } from "@/lib/sudoku-units";

const TITLES: Record<HintKind, string> = {
  wrong: "Wrong digit",
  "full-house": "Full house",
  "naked-single": "Naked single",
  "hidden-single": "Hidden single",
  answer: "No simple step",
};

const STEP_TITLES: Record<IHintStep["kind"], string> = {
  pointing: "Pointing",
  claiming: "Claiming",
  "naked-pair": "Naked pair",
  "hidden-pair": "Hidden pair",
  "x-wing": "X-wing",
  "xy-wing": "XY-wing",
};

/**
 * "1", "1 and 2", "1, 2 and 3".
 * @param items Items to join.
 */
const formatList = (items: (string | number)[]) =>
  items.length < 2
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

/**
 * Digit with its article: "a 5", "an 8".
 * @param digit Digit 1..9.
 */
const withArticle = (digit: number) => `${digit === 8 ? "an" : "a"} ${digit}`;

/**
 * "row 3", "box 4".
 * @param house House to name.
 */
const formatHouse = (house: IHouse) => `${house.kind} ${house.index + 1}`;

/**
 * "rows 2 and 6" for houses of one kind.
 * @param houses Houses to name.
 */
const formatHouses = (houses: IHouse[]) =>
  `${houses[0].kind}s ${formatList(houses.map((h) => h.index + 1))}`;

/**
 * "R3C5", 1-based.
 * @param index Cell index.
 */
const formatCell = (index: number) =>
  `R${getRow(index) + 1}C${getCol(index) + 1}`;

/**
 * Name of the house two cells share.
 * @param a Cell index.
 * @param b Cell index.
 */
const getSharedHouseName = (a: number, b: number) => {
  if (getRow(a) === getRow(b)) return "row";
  if (getCol(a) === getCol(b)) return "column";
  if (getBox(a) === getBox(b)) return "box";
  return "area";
};

/**
 * Short technique name shown above the explanation.
 * @param hint Hint to name.
 */
export const getHintTitle = (hint: IHint) => TITLES[hint.kind];

/**
 * Technique name of one elimination step.
 * @param step Step to name.
 */
export const getStepTitle = (step: IHintStep) => STEP_TITLES[step.kind];

/**
 * One or two sentences on why a step removes candidates.
 * @param step Elimination step.
 */
export const getStepText = (step: IHintStep) => {
  const [a, b, c] = step.digits;
  const [house, target] = [step.houses[0], step.targets[0]].map((h) =>
    h ? formatHouse(h) : "",
  );

  switch (step.kind) {
    case "pointing":
      return `In ${house}, ${a} only fits in ${target}. So ${a} can't go anywhere else in ${target}.`;
    case "claiming":
      return `In ${house}, ${a} only fits inside ${target}. So ${a} can't go anywhere else in ${target}.`;
    case "naked-pair":
      return `Two cells in ${house} can only be ${a} or ${b}. So no other cell in ${house} can be ${a} or ${b}.`;
    case "hidden-pair":
      return `In ${house}, ${a} and ${b} only fit in the same two cells. So those two cells can't be anything else.`;
    case "x-wing": {
      const lines = formatHouses(step.houses);
      const crosses = formatHouses(step.targets);
      return `In ${lines}, ${a} only fits in ${crosses}. Those two ${a}s use up both ${step.targets[0].kind}s, so ${a} can't go anywhere else in ${crosses}.`;
    }
    case "xy-wing": {
      const [pivot, left, right] = step.cells.map(formatCell);
      return `${pivot} is ${a} or ${b}. If it's ${a}, ${left} is ${c}. If it's ${b}, ${right} is ${c}. Either way, no cell that sees both ${left} and ${right} can be ${c}.`;
    }
  }
};

/**
 * Why the hinted move is the right one.
 * @param hint Hint to explain.
 * @param cells Board cells the hint was computed for.
 */
export const getHintText = (hint: IHint, cells: ICell[]) => {
  const { digit, house } = hint;

  switch (hint.kind) {
    case "wrong":
      return hint.conflict != null
        ? `There's already ${withArticle(digit)} in this ${getSharedHouseName(hint.index, hint.conflict)}.`
        : `This ${digit} doesn't match the solution.`;
    case "full-house":
      return `It's the last empty cell in ${house ? formatHouse(house) : "this house"}. The only digit missing is ${digit}.`;
    case "naked-single": {
      const seen = getPeerDigits(cells, hint.index);
      const ruledOut = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(
        (d) => d !== digit && !seen.includes(d),
      );
      return ruledOut.length === 0
        ? `Its row, column and box already have ${formatList(seen)}. Only ${digit} is left.`
        : `Its row, column and box rule out ${formatList(seen)}, and the steps above rule out ${formatList(ruledOut)}. Only ${digit} is left.`;
    }
    case "hidden-single": {
      const name = house ? formatHouse(house) : "this house";
      return hint.steps.length === 0
        ? `${digit} fits nowhere else in ${name}. Every other empty cell there already sees ${withArticle(digit)}.`
        : `${digit} fits nowhere else in ${name}. The other empty cells there either see ${withArticle(digit)} or were ruled out above.`;
    }
    case "answer":
      return `None of the techniques the hint knows work here. This cell is ${digit}.`;
  }
};
