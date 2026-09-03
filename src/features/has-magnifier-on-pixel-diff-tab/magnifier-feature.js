import { getNormalizedDiffs } from '../../utils/color-diff.js'
import { divCanvasEl, magnifierTooltipEl, magnifierColorBoxesEl, magnifierColorDiffInfoEl, magnifierCanvasEl, toggleGridViewEl } from '../../utils/image-comparison-dom.js'
/** @import {ImageComparisonElement} from '../../web-component/image-comparison.element.js' */


/**
 * Add magnifier behavior to diff image to easily see the difference
 * @param {ImageComparisonElement} component - image-comparison component
 */
export function addMagnifierBehavior (component) {
  const magnifier = magnifierCanvasEl(component)
  const tooltip = magnifierTooltipEl(component)
  const diffCanvas = divCanvasEl(component)

  const context = initContext(component)
  const rerender = redraw.bind(null, magnifier, context)

  /**
   * @param {MouseEvent} event - pointer move event
   * @param {object} [options] - pointer move event
   * @param {boolean} [options.forceRerender] - pointer move event
   */
  const pointerMoveHandler = function (event, {forceRerender = false} = {}) {
    if (context.isTooltipFollowingPointer) {
      updateMagnifierDimensions(magnifier, context)
      tooltip.style.transform = `translate(calc(${event.clientX}px - 50%), ${event.clientY-context.magnifierCanvasDimensions.height*0.5}px)`
    }
    if (isNaN(context.diffCanvasMousePos.x) || context.isTooltipFollowingPointer) {
      context.diffCanvasMousePos = getMousePos(diffCanvas, event)
    }
    const {diffCanvasMousePos, dpr} = context
    const {width, height} = context.magnifierCanvasResolution
    const scale = context.scale* dpr

    context.x = diffCanvasMousePos.x - (width * 0.5) / (scale * 3) 
    context.y = diffCanvasMousePos.y - (height * 0.5) / scale
    const isOutOfBounds = context.x > diffCanvas.width || context.y > diffCanvas.height
    if(context.isRenderingOutOfBounds){
      if(isOutOfBounds && !forceRerender){ return }
      context.isRenderingOutOfBounds = false
    } else if(isOutOfBounds){
      context.isRenderingOutOfBounds = true
    }
    rerender()
  }

  magnifier.addEventListener('wheel', (event) => {
    event.preventDefault()
    const scaleup = event.deltaY < 0 ? 1 : -1
    const oldScaleIndex = context.scaleIndex
    context.scaleIndex = Math.min(context.scaleValues.length - 1, Math.max(0, context.scaleIndex + scaleup))
    if(oldScaleIndex == context.scaleIndex){ return }
    pointerMoveHandler(event, {forceRerender: true})
  })

  const toggleGridView = toggleGridViewEl(component)
  toggleGridView.addEventListener("change", () => {
    context.showGrid = toggleGridView.checked
    rerender()
  })


  diffCanvas.addEventListener('click', (event) => {
    tooltip.showPopover()
    context.isTooltipFollowingPointer = true
    pointerMoveHandler(event)
    window.addEventListener('pointermove', pointerMoveHandler)

    magnifier.addEventListener('click', () => {
      context.isTooltipFollowingPointer = false
      window.removeEventListener('pointermove', pointerMoveHandler)

    }, { once: true })
  })
}

/**
 * Maps mouse position to canvas coordinates
 * @param {HTMLCanvasElement} canvas - canvas
 * @param {MouseEvent} event - pointer event
 */
function  getMousePos (canvas, event) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width    // relationship bitmap vs. element for x
  const scaleY = canvas.height / rect.height  // relationship bitmap vs. element for y
  const x = (event.clientX - rect.left) * scaleX
  const y = (event.clientY - rect.top) * scaleY
  return new DOMPointReadOnly(x, y)
}

/**
 * @param {HTMLCanvasElement} magnifier - 2d canvas to draw the grid
 * @param {ReturnType<typeof initContext>} context - function context
 */
function updateMagnifierDimensions (magnifier, context) {
  const dpr = window.devicePixelRatio || 1;

  if(isNaN(context.magnifierCanvasDimensions.width) || context.dpr !== dpr){
    const rect = magnifier.getBoundingClientRect()
    const resolution = {
      width: rect.width * dpr,
      height: rect.height * dpr,
    }
    context.dpr = dpr
    context.magnifierCanvasDimensions = rect
    context.magnifierCanvasResolution = resolution
    magnifier.width = resolution.width
    magnifier.height = resolution.height
  }

}

/**
 * @param {HTMLCanvasElement} magnifier - 2d canvas to draw the grid
 * @param {ReturnType<typeof initContext>} context - function context
 */
function redraw (magnifier, context) {
  const magnifierContext = magnifier.getContext('2d')
  if (!magnifierContext) { return }
  updateMagnifierDimensions(magnifier, context)
  magnifierContext.imageSmoothingEnabled = false
  const { width, height } = context.magnifierCanvasResolution
  magnifierContext.clearRect(0, 0, width, height)
  drawImages(magnifierContext, context)
  drawGrid(magnifierContext, context)
  drawSelectedCellInGrid(magnifierContext, context)
  drawImageBorders(magnifierContext, context)
  updatePixelColorDiffInfo(context)
}

/**
 * @param {CanvasRenderingContext2D} magnifierContext - 2d canvas to draw the grid
 * @param {ReturnType<typeof initContext>} context - function context
 */
const drawImageBorders = (magnifierContext, context) => {
  const { width: resolutionWidth, height } = context.magnifierCanvasResolution

  const width = resolutionWidth / 3
  magnifierContext.strokeRect(0, 0, width, height)
  magnifierContext.strokeRect(width, 0, width, height)
  magnifierContext.strokeRect(width * 2, 0, width, height)

}

/**
 * @param {CanvasRenderingContext2D} magnifierContext - 2d canvas to draw the grid
 * @param {ReturnType<typeof initContext>} context - function context
 */
function drawImages (magnifierContext, context) {
  const { data, x, y, magnifierCanvasResolution, componentElement, dpr } = context
  const diffCanvas = divCanvasEl(componentElement)
  const  scale = context.scale * dpr

  if (!data) { return }
  const { width: resolutionWidth, height } = magnifierCanvasResolution
  const width = resolutionWidth / 3

  const { img1Canvas, img2Canvas } = data

  drawCheckerBg(magnifierContext, context)
  magnifierContext.drawImage(img1Canvas, x, y, width/scale, height/scale, 0, 0, width, height)
  drawCheckerBg(magnifierContext, context, width)
  magnifierContext.drawImage(diffCanvas, x, y, width/scale, height/scale, width, 0, width, height)
  drawCheckerBg(magnifierContext, context, width*2)
  magnifierContext.drawImage(img2Canvas, x, y, width/scale, height/scale, width * 2, 0, width, height)
}

/**
 *
 * @param {ReturnType<typeof initContext>} context - function context
 */
function updatePixelColorDiffInfo (context) {
  const { data, componentElement } = context
  if (!data) { return }

  const [colorBox1, colorBox2] = magnifierColorBoxesEl(componentElement)
  const colorDiffInfo = magnifierColorDiffInfoEl(componentElement)
  if (!colorBox1 || !colorBox2) { return }

  const { img1Canvas, img2Canvas } = data

  const img1CanvasContext = img1Canvas.getContext('2d')
  const img2CanvasContext = img2Canvas.getContext('2d')
  if (!img1CanvasContext || !img2CanvasContext) {
    return
  }

  const img1PixelDataOnMousePosition = img1CanvasContext.getImageData(context.diffCanvasMousePos.x, context.diffCanvasMousePos.y, 1, 1, { colorSpace: 'srgb' })
  const [r1, g1, b1, a1] = img1PixelDataOnMousePosition.data
  const a1perc = `${((a1 * 100) / 255).toLocaleString('en-US', { maximumFractionDigits: 1 })}%`
  const colorBox1Color = `rgb(${r1} ${g1}  ${b1}${a1perc !== '100%' ? ' / ' + a1perc : ''})`
  colorBox1.style.backgroundColor = colorBox1Color
  colorBox1.title = colorBox1Color


  const img2PixelDataOnMousePosition = img2CanvasContext.getImageData(context.diffCanvasMousePos.x, context.diffCanvasMousePos.y, 1, 1, { colorSpace: 'srgb' })

  const [r2, g2, b2, a2] = img2PixelDataOnMousePosition.data
  const a2perc = `${((a2 * 100) / 255).toLocaleString('en-US', { maximumFractionDigits: 1 })}%`
  const colorBox2Color = `rgb(${r2} ${g2}  ${b2}${a2perc !== '100%' ? ' / ' + a2perc : ''})`
  colorBox2.style.backgroundColor = colorBox2Color
  colorBox2.title = colorBox2Color

  const diffResult = getNormalizedDiffs({
    img1: img1PixelDataOnMousePosition.data,
    img2: img2PixelDataOnMousePosition.data,
    width: 1, height: 1,
  })

  const colorDistance = diffResult.diffMap[0]
  colorDiffInfo.textContent = `color distance: ${colorDistance}%`
}

/**
 * @param {ImageComparisonElement} component - target component
 */
const initContext = (component) => ({
  x: 0,
  y: 0,
  dpr: window.devicePixelRatio || 1,
  magnifierCanvasDimensions: { width: NaN, height: NaN },
  magnifierCanvasResolution: { width: NaN, height: NaN },
  diffCanvasMousePos: { x: NaN, y: NaN },
  isTooltipFollowingPointer: true,
  isRenderingOutOfBounds: false,
  get data () { return component.componentData },
  componentElement: component,
  showGrid: toggleGridViewEl(component).checked,
  scaleValues: [1, 4, 8, 16, 32],
  scaleIndex: 2,
  get scale () {
    return this.scaleValues[this.scaleIndex]
  },
})

/**
 * Draws the grid view if enabled
 * @param {CanvasRenderingContext2D} magnifierContext - 2d canvas to draw the grid
 * @param {ReturnType<typeof initContext>} context - function context
 * @param {number} [initX] - init X value
 */
function drawCheckerBg (magnifierContext, context, initX = 0) {

  const { width: resolutionWidth, height } = context.magnifierCanvasResolution
  const width = resolutionWidth / 3
  const { dpr } = context
  const scale = context.scale * dpr
  const x = context.x * dpr
  const y = context.y * dpr


  magnifierContext.save()
  magnifierContext.beginPath()

  const squareWidthInPixels = context.scale <= 1 ? 15 : 5
  const squareWidth = squareWidthInPixels * scale

  const marginXScale = 0.5 - (scale > 1 ? ((x - Math.floor(x)) * scale): 0)
  const marginYScale = 0.5 - (scale > 1 ? ((y - Math.floor(y)) * scale): 0)

  const initI = marginXScale > 0 ? marginXScale % scale - scale : marginXScale
  const initJ = marginYScale > 0 ? marginYScale % scale - scale : marginYScale
  for (let i = initI; i < width; i += squareWidth) {
    
    let x = i + initX
    let rectWidth = squareWidth
    if(x < initX){
      x = initX
      rectWidth -= initX - x
    }
    if((x + squareWidth) > (width + initX)){
      rectWidth -= (x + squareWidth) - (width + initX)
    }

    for (let j = initJ; j < height; j += squareWidth) { 
      const val = (Math.floor(i/squareWidth) + Math.floor(j/squareWidth)) & 1
      
      magnifierContext.fillStyle = val ? '#555': '#aaa'
      magnifierContext.fillRect(x, j, rectWidth, squareWidth)
    }
  }

  magnifierContext.restore()
}


/**
 * Draws the grid view if enabled
 * @param {CanvasRenderingContext2D} magnifierContext - 2d canvas to draw the grid
 * @param {ReturnType<typeof initContext>} context - function context
 */
function drawGrid (magnifierContext, context) {
  if (!context.showGrid || context.scale <= 1) { return }

  const {x, y, dpr} = context
  const { width, height } = context.magnifierCanvasResolution
  const sectionWidth = width / 3
  const scale = context.scale * dpr

  magnifierContext.save()
  magnifierContext.beginPath()
  const marginXScale = 0.5 - ((x - Math.floor(x)) * scale)
  const marginYScale = 0.5 - ((y - Math.floor(y)) * scale)

  for (let i = marginXScale % scale + scale; i < sectionWidth; i += scale) {
    magnifierContext.moveTo(i, 0)
    magnifierContext.lineTo(i, height)
    magnifierContext.moveTo(i + sectionWidth, 0)
    magnifierContext.lineTo(i + sectionWidth, height)
    magnifierContext.moveTo(i + sectionWidth * 2, 0)
    magnifierContext.lineTo(i + sectionWidth * 2, height)
  }

  for (let i = marginYScale; i < height; i += scale) {
    magnifierContext.moveTo(0, i)
    magnifierContext.lineTo(width, i)
  }

  magnifierContext.strokeStyle = '#888'
  magnifierContext.stroke()
  magnifierContext.restore()
}


/**
 * Draws the grid view if enabled
 * @param {CanvasRenderingContext2D} magnifierContext - 2d canvas to draw the grid
 * @param {ReturnType<typeof initContext>} context - function context
 */
function drawSelectedCellInGrid (magnifierContext, context) {
  if (!context.showGrid || context.scale <= 1) { return }

  const width = context.magnifierCanvasResolution.width / 3
  const { diffCanvasMousePos, dpr, x, y } = context
  const scale = context.scale * dpr

  const diffX = (diffCanvasMousePos.x - x) * scale
  const diffY = (diffCanvasMousePos.y - y) * scale

  const marginXScaleFromGrid = 0.5 - ((x - Math.floor(x)) * scale)
  const marginYScaleFromGrid = 0.5 - ((y - Math.floor(y)) * scale)

  const marginXScale = marginXScaleFromGrid % scale + scale
  const marginYScale = marginYScaleFromGrid % scale + scale

  const diffXInGrid = Math.floor((diffX - marginXScale) / scale) * scale + marginXScale
  const diffYInGrid = Math.floor((diffY - marginYScale) / scale) * scale + marginYScale

  magnifierContext.save()
  magnifierContext.beginPath()
  magnifierContext.strokeStyle = '#fff'

  for (let i = 0; i < 3; i += 1) {
    magnifierContext.strokeRect(diffXInGrid + width*i, diffYInGrid, scale, scale)
  }

  magnifierContext.restore()
}