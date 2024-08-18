/**
 * @template {(...args: any) => any} T
 * @param {T} func - function to memoize
 */
const memoize = function (func) {
  const cache = /** @type {{[key: string]: ReturnType<typeof func>}} */({})
  return function (/** @type {string} */ key) {
    if (!(key in cache)) {
      cache[key] = func(key)
    }
    return cache[key]
  }
}

const colorToRGBA = (function () {
  const canvas = new OffscreenCanvas(1, 1)
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (!ctx) { throw Error('unreachable code') }

  /**
   * @param {string} color - color name or code
   */
  const convertColor = function (color) {
    ctx.clearRect(0, 0, 1, 1)
    // In order to detect invalid values,
    // we can't rely on col being in the same format as what fillStyle is computed as,
    // but we can ask it to implicitly compute a normalized value twice and compare.
    ctx.fillStyle = '#000'
    ctx.fillStyle = color
    const computed = ctx.fillStyle
    ctx.fillStyle = '#fff'
    ctx.fillStyle = color
    if (computed !== ctx.fillStyle) {
      return // invalid color
    }
    ctx.fillRect(0, 0, 1, 1)
    return [...ctx.getImageData(0, 0, 1, 1).data]
  }

  return memoize(convertColor)
})()

/**
 * @param {string} color - color name or code
 * @param {string} fallbackColor - fallback color name or code
 * @returns {number[]} rgba color values
 */
export function colorOrFallbackColorToRGBA (color, fallbackColor) {
  // Don't short-circuit getting the fallback RGBA -
  // it's already memoized, and we want to show an error
  // if the fallback color is invalid even if the main color is valid
  const fallbackRGBA = colorToRGBA(fallbackColor)
  if (!fallbackRGBA) {
    throw new Error(`Invalid fallbackColor ${fallbackColor != null ? JSON.stringify(fallbackColor) : fallbackColor}`)
  }
  return colorToRGBA(color) || fallbackRGBA
}
