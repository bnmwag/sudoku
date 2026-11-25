/**
 * Triggers a short vibration on devices that support it (mostly Android).
 * Does nothing elsewhere.
 * @param pattern Duration in ms, or an on/off pattern.
 */
export const vibrate = (pattern: number | number[]) => {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  navigator.vibrate(pattern);
};
