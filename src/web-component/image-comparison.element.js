import css from './qr-code.element.css'

let loadStyles = () => {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(css)
  loadStyles = () => sheet
  return sheet
}

export class ImageComparisonElement extends HTMLElement {
  constructor () {
    super()
  }
}
