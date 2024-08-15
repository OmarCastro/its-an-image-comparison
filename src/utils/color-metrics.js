import { ciede2000 } from './color-diff'
import { rgb_to_lab as rgb2lab } from './color-convert'

/**
 *
 * @param {number} r1 - rgb 1 red value
 * @param {number} g1 - rgb 1 green value
 * @param {number} b1 - rgb 1 blue value
 * @param {number} r2 - rgb 2 red value
 * @param {number} g2 - rgb 2 green value
 * @param {number} b2 - rgb 2 blue value
 * @returns {number} RGB distance value
 */
export function distRGB (r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  return dr * dr + dg * dg + db * db
}

/**
 *
 * @param {number} r1 - rgb 1 red value
 * @param {number} g1 - rgb 1 green value
 * @param {number} b1 - rgb 1 blue value
 * @param {number} r2 - rgb 2 red value
 * @param {number} g2 - rgb 2 green value
 * @param {number} b2 - rgb 2 blue value
 * @returns {number} CIEDE2000 distance value
 */
export function distCIEDE2000 (r1, g1, b1, r2, g2, b2) {
  const c1 = rgb2lab({ R: r1, G: g1, B: b1 })
  const c2 = rgb2lab({ R: r2, G: g2, B: b2 })
  return ciede2000(c1, c2)
}

/**
 *
 * @param {number} r1 - rgb 1 red value
 * @param {number} g1 - rgb 1 green value
 * @param {number} b1 - rgb 1 blue value
 * @param {number} r2 - rgb 2 red value
 * @param {number} g2 - rgb 2 green value
 * @param {number} b2 - rgb 2 blue value
 * @returns {number} RieRGB distance value
 */
export function distRieRGB (r1, g1, b1, r2, g2, b2) {
  const mr = (r1 + r2) / 2
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  return (2 + mr / 256) * dr * dr + 4 * dg * dg + (2 + (255 - mr) / 256) * db * db
}

/**
 *
 * @param {number} r1 - rgb 1 red value
 * @param {number} g1 - rgb 1 green value
 * @param {number} b1 - rgb 1 blue value
 * @param {number} r2 - rgb 2 red value
 * @param {number} g2 - rgb 2 green value
 * @param {number} b2 - rgb 2 blue value
 * @returns {number} YIQ distance value
 */
export function distYIQ (r1, g1, b1, r2, g2, b2) {
  const y = rgb2y(r1, g1, b1) - rgb2y(r2, g2, b2)
  const i = rgb2i(r1, g1, b1) - rgb2i(r2, g2, b2)
  const q = rgb2q(r1, g1, b1) - rgb2q(r2, g2, b2)

  return y * y * 0.5053 + i * i * 0.299 + q * q * 0.1957
}

/**
 *
 * @param {number} r1 - rgb 1 red value
 * @param {number} g1 - rgb 1 green value
 * @param {number} b1 - rgb 1 blue value
 * @param {number} r2 - rgb 2 red value
 * @param {number} g2 - rgb 2 green value
 * @param {number} b2 - rgb 2 blue value
 * @returns {number} YIQ distance value
 */
export function distYIQBrightness (r1, g1, b1, r2, g2, b2) {
  return rgb2y(r1, g1, b1) - rgb2y(r2, g2, b2)
}

/**
 * @param {number} r - rgb red value
 * @param {number} g - rgb green value
 * @param {number} b - rgb blue value
 */
function rgb2y (r, g, b) {
  return r * 0.29889531 + g * 0.58662247 + b * 0.11448223
}
/**
 * @param {number} r - rgb red value
 * @param {number} g - rgb green value
 * @param {number} b - rgb blue value
 */
function rgb2i (r, g, b) {
  return r * 0.59597799 - g * 0.27417610 - b * 0.32180189
}
/**
 * @param {number} r - rgb red value
 * @param {number} g - rgb green value
 * @param {number} b - rgb blue value
 */
function rgb2q (r, g, b) {
  return r * 0.21147017 - g * 0.52261711 + b * 0.31114694
}
