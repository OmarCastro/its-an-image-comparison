/** @import { rgbcolor } from './color-types.d' */

/**
 *
 * @param {number} r1 - color 1 rgba red value
 * @param {number} g1 - color 1 rgba green value
 * @param {number} b1 - color 1 rgba blue value
 * @param {number} a1 - color 1 rgba alpha value
 * @param {number} r2 - color 2 rgba red value
 * @param {number} g2 - color 2 rgba green value
 * @param {number} b2 - color 2 rgba blue value
 * @returns {rgbcolor} blended color
 */
export function colorBlend (r1, g1, b1, a1, r2, g2, b2) {
  if (a1 < 255) {
    a1 /= 255
    const a2 = 1 - a1
    return {
      R: r2 * a2 + r1 * a1,
      G: g2 * a2 + g1 * a1,
      B: b2 * a2 + b1 * a1,
    }
  }
  return { R: r1, G: g1, B: b1 }
}
