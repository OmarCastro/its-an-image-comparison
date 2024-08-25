import html from './image-comparison.element.html'
import css from './image-comparison.element.css'
import { calculateDiff } from '../utils/color-diff'

let loadTemplate = () => {
  const templateElement = document.createElement('template')
  templateElement.innerHTML = html
  loadTemplate = () => templateElement
  return templateElement
}
let loadStyles = () => {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(css)
  loadStyles = () => sheet
  return sheet
}

const leftImgSelector = 'img.left-side'
const rightImgSelector = 'img.right-side'

const intersectionObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    updateSliderDimensions(entry.target)
  }
})

const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    updateSliderDimensions(entry.target)
  }
})

const componentData = new WeakMap()

export class ImageComparisonElement extends HTMLElement {
  constructor () {
    super()
    const shadowRoot = this.attachShadow({ mode: 'open' })
    shadowRoot.adoptedStyleSheets = [loadStyles()]
    const template = loadTemplate()
    shadowRoot.append(document.importNode(template.content, true))
    const slider = shadowRoot.querySelector('.comparison-slider')
    if (!slider) { return }
    addSliderDragBehaviour(slider)
    intersectionObserver.observe(slider)
    resizeObserver.observe(slider)
    shadowRoot.querySelector(leftImgSelector)?.addEventListener('load', () => this.updateCanvas())
    shadowRoot.querySelector(rightImgSelector)?.addEventListener('load', () => this.updateCanvas())
    componentData.set(this, {})
  }

  connectedCallback () {
    const shadowRoot = this.shadowRoot
    if (!shadowRoot) {
      return
    }
    const imgsLightDom = this.querySelectorAll(':scope > img, :scope > figure > img')

    if (imgsLightDom.length > 0) {
      const leftImg = imgsLightDom[0]
      if (leftImg.parentElement?.matches('figure')) {
        const text = leftImg.parentElement?.querySelector(':scope > figcaption')?.textContent
        shadowRoot.querySelectorAll('.overlay--left-side').forEach((element) => { element.textContent = text ?? '' })
      }
      shadowRoot.querySelectorAll(leftImgSelector).forEach(img => { img.src = leftImg.src })
    }

    if (imgsLightDom.length > 1) {
      const leftImg = imgsLightDom[1]
      if (leftImg.parentElement?.matches('figure')) {
        const text = leftImg.parentElement?.querySelector(':scope > figcaption')?.textContent
        shadowRoot.querySelectorAll('.overlay--right-side').forEach((element) => { element.textContent = text ?? '' })
      }
      shadowRoot.querySelectorAll(rightImgSelector).forEach(img => { img.src = leftImg.src })
    }
  }

  updateCanvas () {
    const { shadowRoot } = this
    if (!shadowRoot) { return }
    shadowRoot.querySelectorAll('canvas.diff-image').forEach(canvas => {
      const leftImage = shadowRoot.querySelector(leftImgSelector)
      const rightImage = shadowRoot.querySelector(rightImgSelector)
      if (!isLoadedImg(leftImage) || !isLoadedImg(rightImage)) {
        return
      }

      const width = leftImage.naturalWidth
      const height = leftImage.naturalHeight
      canvas.width = width
      canvas.height = height

      const offCanvas1 = new OffscreenCanvas(width, height)
      const context1 = offCanvas1.getContext('2d')

      const offCanvas2 = new OffscreenCanvas(width, height)
      const context2 = offCanvas2.getContext('2d')

      const context3 = canvas.getContext('2d')

      if (!context1 || !context2 || !context3) { return }

      context1?.drawImage(leftImage, 0, 0)
      context2?.drawImage(rightImage, 0, 0)

      const img1 = context1.getImageData(0, 0, width, height)
      const img2 = context2.getImageData(0, 0, width, height)
      const diff = context3.createImageData(width, height)

      const data = componentData.get(this)
      data.diffs = calculateDiff(img1.data, img2.data, diff.data, width, height, { includeAA: this.antialias })
      this.setAttribute('data-diff-pixels', data.diffs.diffPixelAmount.toString())

      if (this.antialias) {
        this.setAttribute('data-diff-antialias', data.diffs.aaPixelAmount.toString())
      }
      context3.putImageData(diff, 0, 0)
    })
  }

  get diffPixelsAmount () {
    return componentData.get(this).diffPixelAmount ?? NaN
  }

  get antialiasedPixelsAmount () {
    return componentData.get(this).aaPixelAmount ?? NaN
  }

  get antialias () {
    return this.hasAttribute('data-antialias')
  }

  set antialias (val) {
    this.toggleAttribute('data-antialias', !!val)
  }
}

/**
 * @param { HTMLImageElement | null} img - target object
 * @returns {img is HTMLImageElement} true if img is a loaded HTMLImageElement, false otherwise
 */
function isLoadedImg (img) {
  return img != null && img.complete && img.naturalWidth !== 0
}

/**
 * Ensures both images in slider have the same width
 * @param {Element} slider - slider element container
 */
function updateSliderDimensions (slider) {
  const rightSideImage = slider.querySelector(':scope > img')
  const leftSideImage = slider.querySelector('.resize img')
  if (!leftSideImage || !rightSideImage) { return }
  const imgWidth = rightSideImage.getBoundingClientRect().width + 'px'
  leftSideImage.style.width = imgWidth
}

/**
 * Add slider behaviour
 * @param {Element} slider - slider element container
 */
function addSliderDragBehaviour (slider) {
  const dragElement = slider.querySelector('div.divider')
  const resizeElement = slider.querySelector('div.resize')

  if (!dragElement || !resizeElement) { return }

  let dragWidth = 0
  let containerOffset = 0
  let containerWidth = 0
  let minLeft = 0
  let maxLeft = 0

  /**
   * @param {PointerEvent} event - pointer move event
   */
  const pointermovehandler = function (event) {
    // if the user is using mouse, use preventDefault to prevent the user from
    // selecting the images as he moves the silder around.
    if (event.pointerType === 'mouse') {
      event.preventDefault()
    }

    const moveX = event.clientX
    let leftValue = moveX - dragWidth

    // stop the divider from going over the limits of the container
    if (leftValue < minLeft) {
      leftValue = minLeft
    } else if (leftValue > maxLeft) {
      leftValue = maxLeft
    }

    const widthValue = (leftValue + dragWidth / 2 - containerOffset) * 100 / containerWidth + '%'

    dragElement.style.left = widthValue
    resizeElement.style.width = widthValue
  }

  dragElement.addEventListener('pointerdown', () => {
    dragElement.classList.add('dragging')

    dragWidth = dragElement.getBoundingClientRect().width
    containerOffset = slider.getBoundingClientRect().left
    containerWidth = slider.getBoundingClientRect().width
    minLeft = containerOffset + 10
    maxLeft = containerOffset + containerWidth - dragWidth - 10

    window.addEventListener('pointermove', pointermovehandler)

    window.addEventListener('pointerup', () => {
      // stop clicping the image and move the slider
      dragElement.classList.remove('dragging')
      window.removeEventListener('pointermove', pointermovehandler)
    }, { once: true })
  })
}
