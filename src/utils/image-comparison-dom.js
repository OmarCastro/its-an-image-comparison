/** @import {ParseSelector} from "typed-query-selector/parser.d.ts" */

/** @typedef {import('../web-component/image-comparison.element.js').ImageComparisonElement} ImageComparisonElement */

export const containerEl = shadowQuery('div.container')
export const divCanvasEl = shadowQuery('canvas.diff-image')

export const isDivCanvasEl = elementMatcher('canvas.diff-image')

export const isImageComparisonElementSymbol = Symbol('its-an-image-comparison')

/**
 * Gets hots DynamicSelect element from a shadow DOM element
 *
 * @param {EventTarget | null} target - target element in shadow DOM
 * @returns {ImageComparisonElement} host element
 */
export function getHostImageComparisonElement (target) {
  if (!(target instanceof Element)) { throw Error('target is not an element') }
  const rootNode = target.getRootNode()
  if (!(rootNode instanceof ShadowRoot)) { throw Error('target is not inside a shadow dom') }
  const host = rootNode.host
  if (!isImageComparisonElement(host)) { throw Error('target is not inside a image comparison element shadow dom') }
  return host
}

/**
 * @template {string} T
 * @param {T} selector - css selector
 * @returns {(imageComparisonElement: ImageComparisonElement) => StrictlyParseSelector<T, Element>} type guarded query function
 */
function shadowQuery (selector) {
  return (imageComparisonElement) => {
    const result = imageComparisonElement.shadowRoot?.querySelector(selector)
    if (!result) { throw Error(`Error: no ${JSON.stringify(selector)} found in image comparison element shadow DOM`) }
    return result
  }
}


/**
 * @template {string} T
 * @param {T} selector - selector to match
 */
function elementMatcher (selector) {
/**
 * @param {EventTarget | null} element - target element
 * @returns {element is StrictlyParseSelector<T, Element>} type guarded element matcher
 */
  return function (element) {
    return element instanceof Element && element.matches(selector)
  }
}

/**
 * @param {Node} node target DOM Node
 * @returns {node is ImageComparisonElement} true if node is a DynamicSelect web component, false otherwise
 */
export function isImageComparisonElement (node) {
  return node ? /** @type {ImageComparisonElement} */(node)[isImageComparisonElementSymbol] === true : false
}
