import { ImageComparisonElement as Element } from '../web-component/image-comparison.element.js'
const url = new URL(import.meta.url)
const tagName = url.searchParams.get('named')?.trim()
tagName && customElements.define(tagName, Element)
export const ImageComparisonElement = Element
export default ImageComparisonElement
