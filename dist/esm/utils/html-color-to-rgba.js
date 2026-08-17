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
/**
 * Converts hex to RGBA, this function exists for cli use, since nodejs does not support OffscreenCanvas,
 * and on cli it will always use the default ones (customizable only on web-component)
 *
 * @param {string} hex - hex color code
 */
const hexToRGBA = (hex) => {
    if(!/^#([A-Fa-f0-9]{3,4}){1,2}$/.test(hex)) { return } // invalid hex
    const chunkSize = Math.floor((hex.length - 1) / 3)
    const hexArr = hex.slice(1).match(new RegExp(`.{${chunkSize}}`, "g"))
    if(!hexArr) { return } // invalid color
    const [r, g, b, a = 255] = hexArr.map((hexStr) => parseInt(hexStr.repeat(2 / hexStr.length), 16))
    return Object.freeze([r, g, b, a])
}


const colorToRGBA = (function () {
  /** @type {OffscreenCanvasRenderingContext2D} */
  let ctx 
  const buildCanvasContext = () => {
    const canvas = new OffscreenCanvas(1, 1)
    canvas.width = canvas.height = 1
    const ctxContext = canvas.getContext('2d')
    if (!ctxContext) { throw Error('unreachable code') }
    return ctxContext
  }


  /**
   * @param {string} color - color name or code
   */
  const convertColor = function (color) {
    if(color.startsWith("#")){
      return hexToRGBA(color)
    }
    ctx ??= buildCanvasContext()
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
    return Object.freeze([...ctx.getImageData(0, 0, 1, 1).data])
  }

  return memoize(convertColor)
})()

/**
 * @param {string} color - color name or code
 * @param {string} fallbackColor - fallback color name or code
 * @returns {readonly number[]} rgba color values
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
