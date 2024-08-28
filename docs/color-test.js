import { colorDelta } from '../src/utils/color-delta.js'

document.querySelectorAll('.rgb-test').forEach(testEl => {
  const block1 = testEl.querySelector(':scope > div.rgb-block-1')
  const block2 = testEl.querySelector(':scope > div.rgb-block-2')
  if (!block1 || !block2) { return }
  const rgb1 = getRgb(block1)
  const rgb2 = getRgb(block2)
  console.log(rgb1)
  console.log(rgb2)

  calculateDelta(testEl.querySelector('.result-YIQ-b1-b2'), rgb1, rgb2, 'YIQ')
  calculateDelta(testEl.querySelector('.result-YIQ-b2-b1'), rgb2, rgb1, 'YIQ')
  calculateDelta(testEl.querySelector('.result-CIEDE-b1-b2'), rgb2, rgb1, 'CIEDE2000')
  calculateDelta(testEl.querySelector('.result-CIEDE-b2-b1'), rgb2, rgb1, 'CIEDE2000')
})

/**
 *
 * @param {Element} locationResult
 * @param {*} rgb1
 * @param {*} rgb2
 * @param algorithm
 */
function calculateDelta (locationResult, rgb1, rgb2, algorithm) {
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
