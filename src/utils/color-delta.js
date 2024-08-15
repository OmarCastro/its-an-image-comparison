import { colorBlend } from './color-blend'
import { distYIQ, distCIEDE2000, distRGB, distRieRGB, distYIQBrightness } from './color-metrics'
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
 * @param {"YIQ"|"CIEDE2000"|"RGB"|"RieRGB"|"Brightness"} algorithm - algorithm used to calculate delta
 */
export function colorDelta (r1, g1, b1, a1, r2, g2, b2, a2, algorithm = 'CIEDE2000') {
  if (a1 === a2 && r1 === r2 && g1 === g2 && b1 === b2) return 0

  if (a1 < 255) {
    ({ R: r1, G: g1, B: b1 } = colorBlend(r1, g1, b1, a1, 255, 255, 255))
  }

  if (a2 < 255) {
    ({ R: r2, G: g2, B: b2 } = colorBlend(r1, g1, b1, a1, 255, 255, 255))
  }

  switch (algorithm) {
    case 'YIQ': return {
      maxDelta: 35215,
      delta: distYIQ(r1, g1, b1, r2, g2, b2),
    }
    case 'CIEDE2000':return {
      maxDelta: 33,
      delta: distCIEDE2000(r1, g1, b1, r2, g2, b2),
    }
    case 'RGB':return {
      maxDelta: 195075,
      delta: distRGB(r1, g1, b1, r2, g2, b2),

    }
    case 'RieRGB':return {
      maxDelta: 584971,
      delta: distRieRGB(r1, g1, b1, r2, g2, b2),

    }
    case 'Brightness':return {
      maxDelta: 255,
      delta: distYIQBrightness(r1, g1, b1, r2, g2, b2),
    }
  }
}
