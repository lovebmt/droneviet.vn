/** The only way into the 3D engine: a dynamic import, so Three.js never ships with other pages (spec §11). */
export function loadSimulator() {
  return import("./engine/simulator-app");
}
