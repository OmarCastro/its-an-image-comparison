import { colorDelta } from '../src/utils/color-delta.js'
/** @import {rgbcolor} from '../src/utils/color-types.d.js' */

document.querySelectorAll('.rgb-test').forEach(testEl => {
  const block1 = testEl.querySelector(':scope > div.rgb-block-1')
  const block2 = testEl.querySelector(':scope > div.rgb-block-2')
  if (!block1 || !block2) { return }
  const rgb1 = getRgb(block1)
  const rgb2 = getRgb(block2)
  console.log(rgb1)
  console.log(rgb2)

  calculateDelta(rgb1, rgb2, 'YIQ', testEl.querySelector('.result-YIQ-b1-b2'))
  calculateDelta(rgb2, rgb1, 'YIQ', testEl.querySelector('.result-YIQ-b2-b1'))
  calculateDelta(rgb2, rgb1, 'CIEDE2000', testEl.querySelector('.result-CIEDE-b1-b2'))
  calculateDelta(rgb2, rgb1, 'CIEDE2000', testEl.querySelector('.result-CIEDE-b2-b1'))
})

/**
 * @param {rgbcolor} rgb1 - first target color
 * @param {rgbcolor} rgb2 - second target color
 * @param {Parameters<typeof colorDelta>[8]} algorithm - algorithm to use
 *  @param {Element} locationResult - location where to put the result
 */
function calculateDelta (rgb1, rgb2, algorithm, locationResult) {
  if (!locationResult) { return }
  const delta = colorDelta(rgb1.r, rgb1.g, rgb1.b, 255, rgb2.r, rgb2.g, rgb2.b, 255, algorithm)
  const result = {
    ...delta,
    theshold: delta.delta / delta.maxDelta
  }
  locationResult.textContent = JSON.stringify(result)
}

/**
 * @param {Element} element - target element
 */
function getRgb (element) {
  const regex = /--bg: rgb\((?<r>[0-9]+) +(?<g>[0-9]+) +(?<b>[0-9]+)\)/
  const rgb = element.getAttribute('style')?.match(regex)?.groups
  return {
    r: Number.parseInt(rgb.r),
    g: Number.parseInt(rgb.g),
    b: Number.parseInt(rgb.b)
  }
}
