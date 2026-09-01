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

  magnifier.width = context.diffCanvasWidth
  magnifier.height = context.diffCanvasHeight

  /**
   * @param {MouseEvent} event - pointer move event
   */
  const pointerMoveHandler = function (event) {
    if (context.isTooltipFollowingPointer) {
      tooltip.style.transform = `translate(calc(${event.clientX}px - 50%), calc(${event.clientY}px - 50%))`
    }
    if (isNaN(context.diffCanvasMousePos.x) || context.isTooltipFollowingPointer) {
      context.diffCanvasMousePos = getMousePos(diffCanvas, event)
    }

    const tooltipRect = tooltip.getBoundingClientRect()
    var cs = getComputedStyle(tooltip)
    const scale = context.scale
    context.x = context.diffCanvasMousePos.x - (context.diffCanvasWidth * 0.5) / (scale * 3)
    context.y = context.diffCanvasMousePos.y - (tooltipRect.height * 0.5 - parseFloat(cs.paddingTop) - parseFloat(cs.borderTopWidth)) / scale
    rerender()
  }

  magnifier.addEventListener('wheel', (event) => {
    event.preventDefault()
    const scaleup = event.deltaY < 0 ? 1 : -1
    context.scaleIndex = Math.min(context.scaleValues.length - 1, Math.max(0, context.scaleIndex + scaleup))
    pointerMoveHandler(event)
  })

  const toggleGridView = toggleGridViewEl(component)
  toggleGridView.addEventListener("change", () => {
    console.log("AAA")
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
 * @param {HTMLCanvasElement} canvas - canvas
 * @param {MouseEvent} event - pointer event
 */
function  getMousePos (canvas, event) {
  var rect = canvas.getBoundingClientRect(), // abs. size of element
    scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for x
    scaleY = canvas.height / rect.height  // relationship bitmap vs. element for y

  return {
    x: (event.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
    y: (event.clientY - rect.top) * scaleY,     // been adjusted to be relative to element
  }
}

/**
 * @param {HTMLCanvasElement} magnifier - 2d canvas to draw the grid
 * @param {ReturnType<typeof initContext>} context - function context
 */
function redraw (magnifier, context) {
  const magnifierContext = magnifier.getContext('2d')
  if (!magnifierContext) { return }
  magnifierContext.imageSmoothingEnabled = false
  const { diffCanvasWidth, diffCanvasHeight } = context
  magnifierContext.clearRect(0, 0, diffCanvasWidth, diffCanvasHeight)
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
  const { diffCanvasWidth, diffCanvasHeight } = context

  const width = diffCanvasWidth / 3
  const height = diffCanvasHeight
  magnifierContext.strokeRect(0, 0, width, height)
  magnifierContext.strokeRect(width, 0, width, height)
  magnifierContext.strokeRect(width * 2, 0, width, height)

}

/**
 * @param {CanvasRenderingContext2D} magnifierContext - 2d canvas to draw the grid
 * @param {ReturnType<typeof initContext>} context - function context
 */
function drawImages (magnifierContext, context) {
  const { data, x, y, diffCanvasWidth, diffCanvasHeight, componentElement, scale } = context
  const diffCanvas = divCanvasEl(componentElement)

  if (!data) { return }
  const height = diffCanvasHeight
  const width = diffCanvasWidth / 3

  const { img1Canvas, img2Canvas } = data

  drawCheckerBg(magnifierContext, context)
  magnifierContext.drawImage(img1Canvas, x, y, width/scale, height/scale, 0, 0, width, height)
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
  diffCanvasWidth: 450,
  diffCanvasHeight: 150,
  diffCanvasMousePos: { x: NaN, y: NaN },
  isTooltipFollowingPointer: true,
  get data () { return component.componentData },
  componentElement: component,
  showGrid: toggleGridViewEl(component).checked,
  scaleValues: [7, 15, 30],
  scaleIndex: 0,
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

  const width = context.diffCanvasWidth / 3
  const height = context.diffCanvasHeight
  const { x, y, scale } = context


  magnifierContext.save()
  magnifierContext.beginPath()

  const squareWidthInPixels = scale <= 1 ? 15 : 5
  const squareWidth = squareWidthInPixels * scale

  const marginXScale = 0.5 - Math.round((x - Math.floor(x)) * scale)
  const marginYScale = 0.5 - Math.round((y - Math.floor(y)) * scale)

  
  const initI = marginXScale > 0 ? marginXScale % squareWidth - squareWidth : marginXScale
  const initJ = marginYScale > 0 ? marginYScale % squareWidth - squareWidth : marginYScale
  console.log({initI, initJ, x, y, marginXScale, marginYScale, yy: y % 1, yyy: (Math.round(y % 1) * scale)})
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
  if (!context.showGrid) { return }

  const width = context.diffCanvasWidth / 3
  const height = context.diffCanvasHeight
  const { x, y, scale } = context


  magnifierContext.save()
  magnifierContext.beginPath()
  const marginXScale = 0.5 - Math.round((x % 1) * scale)
  for (let i = marginXScale % scale + scale; i < width; i += scale) {
    magnifierContext.moveTo(i, 0)
    magnifierContext.lineTo(i, height)
    magnifierContext.moveTo(i + width, 0)
    magnifierContext.lineTo(i + width, height)
    magnifierContext.moveTo(i + width * 2, 0)
    magnifierContext.lineTo(i + width * 2, height)
  }

  const marginYScale = 0.5 - Math.round((y % 1) * scale)
  const magWidth = context.diffCanvasWidth
  for (let i = marginYScale; i < height; i += scale) {
    magnifierContext.moveTo(0, i)
    magnifierContext.lineTo(magWidth, i)
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
  if (!context.showGrid) { return }

  const width = context.diffCanvasWidth / 3
  const { x, y, scale, diffCanvasMousePos } = context

  const diffX = (diffCanvasMousePos.x - x) * scale
  const diffY = (diffCanvasMousePos.y - y) * scale

  const marginXScaleFromGrid = 0.5 - Math.round((x % 1) * scale)
  const marginYScaleFromGrid = 0.5 - Math.round((y % 1) * scale)

  const marginXScale = marginXScaleFromGrid % scale + scale
  const marginYScale = marginYScaleFromGrid % scale + scale

  const diffXInGrid = Math.floor((diffX - marginXScale) / scale) * scale + marginXScale
  const diffYInGrid = Math.floor((diffY - marginYScale) / scale) * scale + marginYScale

  magnifierContext.save()
  magnifierContext.beginPath()
  magnifierContext.strokeStyle = '#fff'

  // for (let i = marginXScale % scale + scale; i < width; i += scale) {
  for (let i = 0; i < 3; i += 1) {
    magnifierContext.strokeRect(diffXInGrid + width*i, diffYInGrid, scale, scale)
  }

  magnifierContext.restore()
}