/**
 * Pressed-state feedback for menu items: a quick shrink and a darker background while held.
 * The shrink is skipped for people who ask for reduced motion; the colour change stays.
 */
const BASE = "transition-[transform,background-color,color] duration-150 ease-out motion-safe:active:scale-[0.96] select-none";

export const PRESS = {
  /** Top-level menu items and icon buttons. */
  item: `${BASE} active:bg-sky-100`,
  /** The highlighted item (Bay mô phỏng) on its yellow background. */
  highlight: `${BASE} active:bg-[#e6ab00]`,
  /** Sub-items: a smaller shrink, they are wider. */
  child: "transition-[transform,background-color,color] duration-150 ease-out motion-safe:active:scale-[0.98] select-none active:bg-sky-100",
};
