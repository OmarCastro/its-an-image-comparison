import { colorDeltaImgPosition, validAlgorithms } from './color-delta'
import { rgb2y } from './color-metrics'
import { colorOrFallbackColorToRGBA } from './html-color-to-rgba'
/** @import {Algorithm} from './color-delta' */

const fallbackAAColor = 'yellow'
const fallbackDiffColor = 'red'

/**
 * @param {object} params - function parameters
 * @param {Uint8Array | Uint8ClampedArray} params.img1 - original image
 * @param {Uint8Array | Uint8ClampedArray} params.img2 - image to compare
 * @param {number} params.width - images width
 * @param {number} params.height - images height
 * @param {Algorithm} [params.algorithm] - output image
 * @returns {{identical: boolean, diffMap: Uint8Array}} number of different pixels
 */
export function getNormalizedDiffs ({ img1, img2, width, height, algorithm = 'CIEDE2000' }) {
  validateImagePreconditions({ img1, img2, width, height })
  if (!validAlgorithms.includes(algorithm)) { throw new Error(`Invalid algorithm ${algorithm}, expected algorithms: ${validAlgorithms.join(', ')}.`) }

  const len = width * height
  const diffMap = new Uint8Array(len)
  const a32 = new Uint32Array(img1.buffer, img1.byteOffset, len)
  const b32 = new Uint32Array(img2.buffer, img2.byteOffset, len)
  let identical = true

  for (let pixelPos = 0; pixelPos < len; pixelPos++) {
    if (a32[pixelPos] === b32[pixelPos]) { continue } // Fast way to check if pixels are identical
    const pos = pixelPos * 4
    const { delta, maxDelta } = colorDeltaImgPosition(img1, img2, pos, pos, algorithm)
    diffMap[pixelPos] = Math.ceil(Math.abs(delta) * 100 / maxDelta)
    identical = false
  }

  return { identical, diffMap }
}

/**
 * Gets antialias map for non-identical pixels
 *
 * The result is an byte array, where 3 out of 8 bits are used ( e.g. 1100001 )
 * first bit just tells if it was worked on, useful when calculating partial antialias map and recalculate again
 * second bit just tells if it was calculated or ignored, no antialias is calculated on identical pixels
 * last bit tells if the pixel is an antialias pixel
 *
 * @param {object} params - function parameters
 * @param {Uint8Array | Uint8ClampedArray} params.img1 - original image
 * @param {Uint8Array | Uint8ClampedArray} params.img2 - image to compare
 * @param {number} params.width - images width
 * @param {number} params.height - images height
 * @returns {Uint8Array} anti alias map
 */
export function getAntiAliasMap (params) {
  validateImagePreconditions(params)
  const { img1, img2, width, height } = params
  const len = width * height
  const antiAliasMap = new Uint8Array(len)
  const a32 = new Uint32Array(img1.buffer, img1.byteOffset, len)
  const b32 = new Uint32Array(img2.buffer, img2.byteOffset, len)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = y * width + x
      if (a32[pos] === b32[pos]) { // Fast way to check if pixels are identical
        antiAliasMap[pos] = 0b1000_0000
      } else if (antialiased(img1, x, y, width, height, img2) || antialiased(img2, x, y, width, height, img1)) {
        antiAliasMap[pos] = 0b1100_0001
      } else {
        antiAliasMap[pos] = 0b1100_0000
      }
    }
  }
  return antiAliasMap
}
/**
 * @param {object} params - function parameters
 * @param {Uint8Array | Uint8ClampedArray} params.img1 - original image
 * @param {Uint8Array | Uint8ClampedArray} params.img2 - image to compare
 * @param {number} params.width - images width
 * @param {number} params.height - images height
 * @param {Uint8Array | Uint8ClampedArray | null} [params.output] - output image
 * @param {Uint8Array | Uint8ClampedArray | null} [params.antialiasOutput] - output image for
 *     antialias, useful if you need a separate image for antialias, uses `params.output` if
 *     undefined
 * @param {number} [params.threshold] - threshold value, integer number between 0 and 100, both
 *     inclusive, if the difference is below or equal the threshold, it is considered similar
 *     pixel, and will not count as a different pixel
 * @param {boolean} [params.antialias] - whether to include anti-aliasing detection
 * @param {string} [params.aaColor] - color of anti-aliased pixels in diff output
 * @param {string} [params.diffColor] - color of different pixels in diff output
 * @param {boolean} [params.diffMask] - whether to include anti-aliasing detection
 * @param {number} [params.alpha] - // opacity of original image in diff output
 * @returns {{diffPixelAmount: number, aaPixelAmount: number}} number of different pixels
 */
export function calculateDiff ({
  img1, img2, output, antialiasOutput, width, height,
  threshold = 10,
  antialias = false,
  aaColor = fallbackAAColor,
  diffColor = fallbackDiffColor,
  diffMask = false,
  alpha = 0.1,
}) {
  antialiasOutput ??= output

  validateImagePreconditions({ img1, img2, width, height, output })
  if (img1.length !== img2.length || (output && output.length !== img1.length) || (antialiasOutput && antialiasOutput.length !== img1.length)) { throw new Error('Image sizes do not match.') }

  const { identical, diffMap } = getNormalizedDiffs({ img1, img2, width, height, algorithm: 'CIEDE2000' })

  if (identical) { // fast path if identical
    if (output && !diffMask) {
      for (let i = 0, len = width * height; i < len; i++) drawGrayPixel(img1, 4 * i, alpha, output)
    }
    return {
      diffPixelAmount: 0,
      aaPixelAmount: 0,
    }
  }

  const antiAliasMap = antialias ? getAntiAliasMap({ img1, img2, width, height }) : null

  const [aaR, aaG, aaB] = colorOrFallbackColorToRGBA(aaColor, fallbackAAColor)
  const [diffR, diffG, diffB] = colorOrFallbackColorToRGBA(diffColor, fallbackDiffColor)
  let diffPixelAmount = 0
  let aaPixelAmount = 0

  // compare each pixel of one image against the other one
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = (y * width + x) * 4

      const normalizedDelta = diffMap[y * width + x]

      // the color difference is above the threshold
      if (normalizedDelta > threshold) {
        // check it's a real rendering difference or just anti-aliasing
        if (antiAliasMap && (antiAliasMap[y * width + x] & 1) === 1) {
          // one of the pixels is anti-aliasing; draw as yellow and do not count as difference
          if (antialiasOutput) drawPixel(antialiasOutput, pos, aaR, aaG, aaB)
          aaPixelAmount++
        } else {
          // found substantial difference not caused by anti-aliasing; draw it as such
          if (output) {
            drawPixel(output, pos, diffR, diffG, diffB)
          }
          diffPixelAmount++
        }
      } else if (output && !diffMask) {
        // pixels are similar; draw background as grayscale image blended with white
        drawGrayPixel(img1, pos, alpha, output)
      }
    }
  }

  // return the number of different pixels
  return {
    diffPixelAmount,
    aaPixelAmount,
  }
}

/**
 * Checks if `arr` is an 8-bit unsigned integer typed array
 * @param {ArrayBufferView} arr - target object
 */
function isPixelData (arr) {
  return arr instanceof Uint8Array || arr instanceof Uint8ClampedArray
}

/**
 *  check if a pixel is likely a part of anti-aliasing;
 *  based on "Anti-aliased Pixel and Intensity Slope Detector" paper by V. Vysniauskas, 2009
 * @param {Uint8Array | Uint8ClampedArray} img - original image
 * @param {number} x1 - pixel horizontal position
 * @param {number} y1 - pixel vertical position
 * @param {number} width - images width
 * @param {number} height - images height
 * @param {Uint8Array | Uint8ClampedArray} img2 - image to compare
 */
function antialiased (img, x1, y1, width, height, img2) {
  const x0 = Math.max(x1 - 1, 0)
  const y0 = Math.max(y1 - 1, 0)
  const x2 = Math.min(x1 + 1, width - 1)
  const y2 = Math.min(y1 + 1, height - 1)
  const pos = (y1 * width + x1) * 4
  let zeroes = x1 === x0 || x1 === x2 || y1 === y0 || y1 === y2 ? 1 : 0
  let min = 0
  let max = 0
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0

  // go through 8 adjacent pixels
  for (let x = x0; x <= x2; x++) {
    for (let y = y0; y <= y2; y++) {
      if (x === x1 && y === y1) continue

      // brightness delta between the center pixel and adjacent one
      const { delta } = colorDeltaImgPosition(img, img, pos, (y * width + x) * 4, 'Brightness')

      // count the number of equal, darker and brighter adjacent pixels
      if (delta === 0) {
        zeroes++
        // if found more than 2 equal siblings, it's definitely not anti-aliasing
        if (zeroes > 2) return false

        // remember the darkest pixel
      } else if (delta < min) {
        min = delta
        minX = x
        minY = y

        // remember the brightest pixel
      } else if (delta > max) {
        max = delta
        maxX = x
        maxY = y
      }
    }
  }

  // if there are no both darker and brighter pixels among siblings, it's not anti-aliasing
  if (min === 0 || max === 0) return false

  // if either the darkest or the brightest pixel has 3+ equal siblings in both images
  // (definitely not anti-aliased), this pixel is anti-aliased
  return (hasManySiblings(img, minX, minY, width, height) && hasManySiblings(img2, minX, minY, width, height)) ||
           (hasManySiblings(img, maxX, maxY, width, height) && hasManySiblings(img2, maxX, maxY, width, height))
}

// check if a pixel has 3+ adjacent pixels of the same color.
/**
 *
 * @param {Uint8Array | Uint8ClampedArray} img - original image
 * @param {number} x1 - pixel horizontal position
 * @param {number} y1 - pixel vertical position
 * @param {number} width - images width
 * @param {number} height - images height
 */
function hasManySiblings (img, x1, y1, width, height) {
  const x0 = Math.max(x1 - 1, 0)
  const y0 = Math.max(y1 - 1, 0)
  const x2 = Math.min(x1 + 1, width - 1)
  const y2 = Math.min(y1 + 1, height - 1)
  const pos = (y1 * width + x1) * 4
  let zeroes = x1 === x0 || x1 === x2 || y1 === y0 || y1 === y2 ? 1 : 0

  // go through 8 adjacent pixels
  for (let x = x0; x <= x2; x++) {
    for (let y = y0; y <= y2; y++) {
      if (x === x1 && y === y1) continue

      const pos2 = (y * width + x) * 4
      if (img[pos] === img[pos2] &&
                img[pos + 1] === img[pos2 + 1] &&
                img[pos + 2] === img[pos2 + 2] &&
                img[pos + 3] === img[pos2 + 3]) zeroes++

      if (zeroes > 2) return true
    }
  }

  return false
}

/**
 *
 * @param {Uint8Array | Uint8ClampedArray } output - output image
 * @param {number} pos - image position
 * @param {number} r - rgb red value
 * @param {number} g - rgb green value
 * @param {number} b - rgb blue value
 */
function drawPixel (output, pos, r, g, b) {
  output[pos + 0] = r
  output[pos + 1] = g
  output[pos + 2] = b
  output[pos + 3] = 255
}

/**
 *
 * @param {Uint8Array | Uint8ClampedArray} img - original image
 * @param {number} pos - image position
 * @param {number} alpha - alpha value
 * @param {Uint8Array | Uint8ClampedArray } output - output image
 */
function drawGrayPixel (img, pos, alpha, output) {
  const r = img[pos + 0]
  const g = img[pos + 1]
  const b = img[pos + 2]
  const a = alpha * img[pos + 3] / 255
  const brightness = rgb2y(r, g, b)
  const val = 255 + (brightness - 255) * a
  drawPixel(output, pos, val, val, val)
}

/**
 * @param {object} params - function parameters
 * @param {Uint8Array | Uint8ClampedArray} params.img1 - original image
 * @param {Uint8Array | Uint8ClampedArray} params.img2 - image to compare
 * @param {Uint8Array | Uint8ClampedArray | null} [params.output] - output image
 * @param {number} params.width - images width
 * @param {number} params.height - images height
 */
function validateImagePreconditions ({ img1, img2, width, height, output }) {
  if (!isPixelData(img1) || !isPixelData(img2) || (output && !isPixelData(output))) { throw new Error('Image data: Uint8Array or Uint8ClampedArray expected.') }

  if (img1.length !== img2.length) { throw new Error('Image sizes do not match.') }

  if (img1.length !== width * height * 4) { throw new Error('Image data size does not match width/height.') }
}
