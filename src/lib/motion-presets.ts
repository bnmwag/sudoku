import type { Transition } from "motion/react";

/** Quick, slightly bouncy spring for press feedback. */
export const PRESS_SPRING: Transition = {
  type: "spring",
  stiffness: 600,
  damping: 22,
  mass: 0.6,
};

/** Spring for elements that slide or resize between states. */
export const LAYOUT_SPRING: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 36,
};

/** Scale applied while a button is held down. */
export const PRESSED_SCALE = 0.9;
