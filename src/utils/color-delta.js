import { colorBlend } from './color-blend'
import { distYIQ, distCIEDE2000, distRGB, distRieRGB, distYIQBrightness } from './color-metrics'

/** @param {number} num - number to round */
const rounded = (num) => +num.toFixed(5)

export const maxDelta = {
  YIQ: rounded(distYIQ(0, 0, 0, 255, 255, 255)),
  RGB: rounded(distRGB(0, 0, 0, 255, 255, 255)),
  RieRGB: rounded(distRieRGB(0, 0, 0, 255, 255, 255)),
  CIEDE2000: rounded(distCIEDE2000(0, 0, 0, 255, 255, 255)),
  Brightness: rounded(Math.abs(distYIQBrightness(0, 0, 0, 255, 255, 255))),
}

export const validAlgorithms = Object.freeze(/** @type {const} */(['YIQ', 'CIEDE2000', 'RGB', 'RieRGB', 'Brightness']))
/** @typedef {(typeof validAlgorithms)[number]} Algorithm */

/**
 *
 * @param {Uint8Array | Uint8ClampedArray} img1 - original image
 * @param {Uint8Array | Uint8ClampedArray} img2 - image to compare
 * @param {number} posImg1 - pixel position on `img1`
 * @param {number} posImg2 - pixel position on `img2`
 * @param {Algorithm} algorithm - algorithm used to calculate delta defaults to CIEDE2000
 * @returns {colorDelta} color delta result
 */
export function colorDeltaImgPosition (img1, img2, posImg1, posImg2, algorithm) {
  const r1 = img1[posImg1 + 0]
  const g1 = img1[posImg1 + 1]
  const b1 = img1[posImg1 + 2]
  const a1 = img1[posImg1 + 3]

  const r2 = img2[posImg2 + 0]
  const g2 = img2[posImg2 + 1]
  const b2 = img2[posImg2 + 2]
  const a2 = img2[posImg2 + 3]

  return colorDelta(r1, g1, b1, a1, r2, g2, b2, a2, algorithm)
}

/**
 * calculate color difference according to the paper "Measuring perceived color difference
 * using YIQ NTSC transmission color space in mobile applications" by Y. Kotsarenko and F. Ramos
 * @param {number} r1 - color 1 rgba red value
 * @param {number} g1 - color 1 rgba green value
 * @param {number} b1 - color 1 rgba blue value
 * @param {number} a1 - color 1 rgba alpha value
 * @param {number} r2 - color 2 rgba red value
 * @param {number} g2 - color 2 rgba green value
 * @param {number} b2 - color 2 rgba blue value
 * @param {number} a2 - color 2 rgba alpha value
 * @param {Algorithm} algorithm - algorithm used to calculate delta defaults to CIEDE2000
 * @returns {colorDelta} color delta result
 */
export function colorDelta (r1, g1, b1, a1, r2, g2, b2, a2, algorithm) {
  algorithm = Object.hasOwn(maxDelta, algorithm) ? algorithm : 'CIEDE2000'

  if (a1 === a2 && r1 === r2 && g1 === g2 && b1 === b2) {
    return {
      delta: 0,
      maxDelta: maxDelta[algorithm],
    }
  }

  const algorithmFunction = (() => {
    switch (algorithm) {
      case 'YIQ': return distYIQ
      case 'RGB': return distRGB
      case 'RieRGB': return distRieRGB
      case 'Brightness': return distYIQBrightness
      case 'CIEDE2000':
      default: return distCIEDE2000
    }
  })()

  if (a1 < 255 || a2 < 255) {
    const rgb1Light = colorBlend(r1, g1, b1, a1, 255, 255, 255)
    const rgb2Light = colorBlend(r2, g2, b2, a2, 255, 255, 255)
    const deltaLightBlend = rounded(algorithmFunction(
      rgb1Light.R, rgb1Light.G, rgb1Light.B,
      rgb2Light.R, rgb2Light.G, rgb2Light.B
    ))

    const rgb1Dark = colorBlend(r1, g1, b1, a1, 0, 0, 0)
    const rgb2Dark = colorBlend(r2, g2, b2, a2, 0, 0, 0)
    const deltaDarkBlend = rounded(algorithmFunction(
      rgb1Dark.R, rgb1Dark.G, rgb1Dark.B,
      rgb2Dark.R, rgb2Dark.G, rgb2Dark.B
    ))

    return {
      delta: Math.max(deltaLightBlend, deltaDarkBlend),
      maxDelta: maxDelta[algorithm],
    }
  }

  const delta = rounded(algorithmFunction(r1, g1, b1, r2, g2, b2))
  return {
    delta,
    maxDelta: maxDelta[algorithm],
  }
}

/**
 * @typedef {object} colorDelta
 * @property {number} delta - color delta result
 * @property {number} maxDelta - max possible result value
 */
