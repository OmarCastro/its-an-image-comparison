import html from './image-comparison.element.html.generated.js'
import css from './image-comparison.element.css.generated.js'
import { calculateDiff, fallbackAAColor, fallbackDiffColor } from '../utils/color-diff'
import { colorOrFallbackColorToRGBA } from '../utils/html-color-to-rgba'

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

const canvasIntersectionObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const rootNode = entry.target.getRootNode()
    if (!(rootNode instanceof ShadowRoot)) { return }
    const { host } = rootNode
    if (!(host instanceof ImageComparisonElement)) { return }
    updateDiffColors(host)
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
    addSliderDragBehavior(slider)
    intersectionObserver.observe(slider)
    resizeObserver.observe(slider)
    shadowRoot.querySelector(leftImgSelector)?.addEventListener('load', () => this.updateCanvas())
    shadowRoot.querySelector(rightImgSelector)?.addEventListener('load', () => this.updateCanvas())
    componentData.set(this, {})
    this.addEventListener('transitionstart', transitionstartEventHandler)
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
        shadowRoot.querySelectorAll('.caption--left-side').forEach((element) => { element.textContent = text ?? '' })
      }
      shadowRoot.querySelectorAll(leftImgSelector).forEach(img => { img.src = leftImg.src })
    }

    if (imgsLightDom.length > 1) {
      const leftImg = imgsLightDom[1]
      if (leftImg.parentElement?.matches('figure')) {
        const text = leftImg.parentElement?.querySelector(':scope > figcaption')?.textContent
        shadowRoot.querySelectorAll('.caption--right-side').forEach((element) => { element.textContent = text ?? '' })
      }
      shadowRoot.querySelectorAll(rightImgSelector).forEach(img => { img.src = leftImg.src })
    }
  }

  updateCanvas () {
    const { shadowRoot } = this
    if (!shadowRoot) { return }
    const leftImage = shadowRoot.querySelector(leftImgSelector)
    const rightImage = shadowRoot.querySelector(rightImgSelector)

    if (!isLoadedImg(leftImage) || !isLoadedImg(rightImage)) {
      return
    }

    shadowRoot.querySelectorAll('div.comparison-slider').forEach(slider => {
      slider.style.width = `${leftImage.naturalWidth}px`
    })

    shadowRoot.querySelectorAll('canvas.diff-image').forEach(canvas => {
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
      const diff = context3.createImageData(width, height, { colorSpace: 'srgb' })
      const diffMap = new Uint8ClampedArray(width * height)

      const data = componentData.get(this)

      data.diffMap = diffMap
      data.appliedAAColor = null
      data.appliedDiffColor = null

      data.diffs = calculateDiff({
        img1: img1.data,
        img2: img2.data,
        output: diff.data,
        diffMapOutput: diffMap,
        width,
        height,
        antialias: this.antialias
      })
      this.setAttribute('data-diff-pixels', data.diffs.diffPixelAmount.toString())

      if (this.antialias) {
        this.setAttribute('data-diff-antialias', data.diffs.aaPixelAmount.toString())
      }

      context3.putImageData(diff, 0, 0)
      updateDiffColors(this)
      canvasIntersectionObserver.observe(canvas)
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
 *
 * @param {Event} event - transition Event
 */
function transitionstartEventHandler (event) {
  const { target } = event
  if (target instanceof ImageComparisonElement) {
    updateDiffColors(target)
  }
}

/**
 *
 * @param {ImageComparisonElement} component - component
 */
function updateDiffColors (component) {
  const data = componentData.get(component)

  const { diffMap, appliedAAColor, appliedDiffColor } = data
  if (!diffMap) { return }

  const aaColorToApply = getComputedStyle(component).getPropertyValue('--antialias-diff-color') || fallbackAAColor
  const diffColorToApply = getComputedStyle(component).getPropertyValue('--diff-color') || fallbackDiffColor
  if (aaColorToApply === appliedAAColor && diffColorToApply === appliedDiffColor) { return }

  const { shadowRoot } = component
  if (!shadowRoot) { return }
  shadowRoot.querySelectorAll('canvas.diff-image').forEach(canvas => {
    const context = canvas.getContext('2d')
    if (!context) { return }
    const diff = context.getImageData(0, 0, canvas.width, canvas.height, { colorSpace: 'srgb' })

    if (aaColorToApply !== appliedAAColor) {
      const aaRGBAColor = colorOrFallbackColorToRGBA(aaColorToApply, fallbackAAColor)
      for (let pos = 0, e = diffMap.length; pos < e; pos++) {
        if (diffMap[pos] === 0b0011) {
          const colorPos = pos * 4
          const { data } = diff
          data[colorPos] = aaRGBAColor[0]
          data[colorPos + 1] = aaRGBAColor[1]
          data[colorPos + 2] = aaRGBAColor[2]
          data[colorPos + 3] = aaRGBAColor[3]
        }
      }
      data.appliedAAColor = aaColorToApply
    }
    if (diffColorToApply !== appliedDiffColor) {
      const diffRGBAColor = colorOrFallbackColorToRGBA(diffColorToApply, fallbackDiffColor)
      for (let pos = 0, e = diffMap.length; pos < e; pos++) {
        if (diffMap[pos] === 0b0001) {
          const colorPos = pos * 4
          const { data } = diff
          data[colorPos] = diffRGBAColor[0]
          data[colorPos + 1] = diffRGBAColor[1]
          data[colorPos + 2] = diffRGBAColor[2]
          data[colorPos + 3] = diffRGBAColor[3]
        }
      }
      data.appliedDiffColor = diffColorToApply
    }
    context.putImageData(diff, 0, 0)
  })
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
 * Add slider behavior
 * @param {Element} slider - slider element container
 */
function addSliderDragBehavior (slider) {
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
  const pointerMoveHandler = function (event) {
    // if the user is using mouse, use preventDefault to prevent the user from
    // selecting the images as he moves the slider around.
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

    window.addEventListener('pointermove', pointerMoveHandler)

    window.addEventListener('pointerup', () => {
      // stop clicking the image and move the slider
      dragElement.classList.remove('dragging')
      window.removeEventListener('pointermove', pointerMoveHandler)
    }, { once: true })
  })
}
