import html from './image-comparison.element.html'
import css from './image-comparison.element.css'

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
  }

  connectedCallback () {
    const shadowRoot = this.shadowRoot
    if (!shadowRoot) {
      return
    }
    const imgsLightDom = this.querySelectorAll(':scope > img')

    if (imgsLightDom.length > 0) {
      const leftImg = imgsLightDom[0]
      const leftImages = shadowRoot.querySelectorAll('img.left-side')
      leftImages.forEach(img => {
        img.src = leftImg.src
      })
    }

    if (imgsLightDom.length > 1) {
      const leftImg = imgsLightDom[1]
      const leftImages = shadowRoot.querySelectorAll('img.right-side')
      leftImages.forEach(img => {
        img.src = leftImg.src
      })
    }
  }
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
