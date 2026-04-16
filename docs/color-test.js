import { colorDelta, validAlgorithms } from '../src/utils/color-delta.js'
/** @import {rgbcolor} from '../src/utils/color-types.d.js' */
/** @import {Algorithm} from '../src/utils/color-delta.js' */

document.querySelectorAll('.rgb-test').forEach(testEl => {
  const block1 = testEl.querySelector(':scope > div.rgb-block-1')
  const block2 = testEl.querySelector(':scope > div.rgb-block-2')
  if (!block1 || !block2) { return }
  const rgb1 = getRgb(block1)
  const rgb2 = getRgb(block2)
  console.log(rgb1)
  console.log(rgb2)

  validAlgorithms.forEach(algorithm => {
    calculateDelta(rgb1, rgb2, algorithm, testEl.querySelector('.result-YIQ-b1-b2'))
  })

  calculateDeltaTable(rgb1, rgb2, testEl.querySelector('.result-algoritms'))
})



/**
 * @param {rgbcolor} rgb1 - first target color
 * @param {rgbcolor} rgb2 - second target color
 * @param {Algorithm} algorithm - algorithm to use
 *  @param {Element} locationResult - location where to put the result
 */
function calculateDelta (rgb1, rgb2, algorithm, locationResult) {
  if (!locationResult) { return }
  const delta = colorDelta(rgb1.r, rgb1.g, rgb1.b, 255, rgb2.r, rgb2.g, rgb2.b, 255, algorithm)
  const result = {
    ...delta,
    theshold: delta.delta / delta.maxDelta
  }
  const resultText = `${algorithm} : ${JSON.stringify(result)}`
  const p = document.createElement('p')
  p.textContent = resultText
  locationResult.append(p)
}

/**
 * @param {rgbcolor} rgb1 - first target color
 * @param {rgbcolor} rgb2 - second target color
 * @param {Algorithm} algorithm - algorithm to use
 *  @param {Element} locationResult - location where to put the result
 */
function calculateDeltaTable (rgb1, rgb2, locationResult) {
  if (!locationResult) { return }

  const results = validAlgorithms.map(algorithm => {
    const delta = colorDelta(rgb1.r, rgb1.g, rgb1.b, 255, rgb2.r, rgb2.g, rgb2.b, 255, algorithm)
    delta.delta = Math.abs(delta.delta)
    const result = {
      ...delta,
      algorithm,
      theshold: delta.delta / delta.maxDelta,
    }
    return result
  })

  const tableTemplate = document.querySelector("template.result-algorithms-table")
  const rowTemplate = document.querySelector("template.result-algorithms-table-row")
  const table = document.importNode(tableTemplate.content, true)
  const tableTBody = table.querySelector("tbody")
  results.forEach(result => {
      const row = document.importNode(rowTemplate.content, true)
      row.querySelector(".col-algorithm").textContent = result.algorithm
      row.querySelector(".col-delta").textContent = result.delta.toFixed(4)
      row.querySelector(".col-max-delta").textContent = result.maxDelta.toFixed(4)
      row.querySelector(".col-theshold").textContent = result.theshold.toFixed(4)
      tableTBody.append(row)
  })
  locationResult.append(table)
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
