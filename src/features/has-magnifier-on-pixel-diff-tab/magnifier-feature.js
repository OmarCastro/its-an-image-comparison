import { getNormalizedDiffs } from '../../utils/color-diff.js'
import { divCanvasEl } from '../../utils/image-comparison-dom.js'
/** @import {ImageComparisonElement} from '../../web-component/image-comparison.element.js' */



/**
 * Add magnifier behavior to diff image to easily see the difference
 * @param {ImageComparisonElement} component - image-comparison component
 */
export function addMagnifierBehavior (component) {
  const diffCanvas = divCanvasEl(component)
  const tooltip = diffCanvas.parentElement?.querySelector('div.glass-magnifier-tooltip')
  const magnifier = tooltip?.querySelector('canvas.glass-magnifier')
  const diffCanvasContext = diffCanvas.getContext('2d')
  const [colorBox1, colorBox2] = tooltip?.querySelectorAll('div.color-box') ?? []
  const colorDiffInfo = tooltip?.querySelector('div.color-diff-info')
  
  if(!tooltip || !magnifier || !diffCanvasContext || !colorBox1 || !colorBox2 || !colorDiffInfo) { return }

  const context = initContext(component)

  magnifier.width = context.diffCanvasWidth
  magnifier.height = context.diffCanvasHeight
  const {width: magWidth, height: magHeight} = magnifier



    /** @param {CanvasRenderingContext2D} magnifierContext - 2d canvas to draw the grid if enabled */
  const drawImageBorders = (magnifierContext) => {
    const width = magWidth / 3
    const height = magHeight
    magnifierContext.strokeRect(0, 0, width, height)
    magnifierContext.strokeRect(width, 0, width, height)
    magnifierContext.strokeRect(width*2, 0, width, height)

  }


  /**
   * @param {MouseEvent} event - pointer move event
   */
  const pointerMoveHandler = function (event) {
    if(context.isTooltipFollowingPointer){
      tooltip.style.transform = `translate(calc(${event.clientX}px - 50%), calc(${event.clientY}px - 50%))`
    }
    const magnifierContext = magnifier.getContext('2d')
    if (!magnifierContext) { return }
    if(isNaN(context.diffCanvasMousePos.x) || context.isTooltipFollowingPointer){
      context.diffCanvasMousePos = getMousePos(diffCanvas, event)
    }

    

    const width = magWidth / 3
    const height = magHeight
    const tooltipRect = tooltip.getBoundingClientRect()
    var cs = getComputedStyle(tooltip);
    const scale = context.scale
    context.x = context.diffCanvasMousePos.x - (width * 0.5)/scale
    context.y = context.diffCanvasMousePos.y - (tooltipRect.height * 0.5 - parseFloat(cs.paddingTop) - parseFloat(cs.borderTopWidth)) / scale

    const {data, x, y} = context
    if(!data) { return }

    const { img1Canvas, img2Canvas } = data
    magnifierContext.imageSmoothingEnabled = false
    magnifierContext.clearRect(0 , 0, magWidth, magHeight)


    magnifierContext.drawImage(img1Canvas, x, y, width, height, 0, 0, width*scale, height*scale)
    magnifierContext.clearRect(width , 0, magWidth, magHeight)
    magnifierContext.drawImage(diffCanvas, x, y, width, height, width, 0, width*scale, height*scale)
    magnifierContext.clearRect(width*2 , 0, magWidth, magHeight)
    magnifierContext.drawImage(img2Canvas, x, y, width, height, width*2, 0, width*scale, height*scale)

    drawGrid(magnifierContext, context)
    drawImageBorders(magnifierContext)


    const img1CanvasContext = img1Canvas.getContext('2d')
    const img2CanvasContext = img2Canvas.getContext('2d')
    if(!img1CanvasContext || !img2CanvasContext) {
      return
    }
    
 
    const img1PixelDataOnMousePosition = img1CanvasContext.getImageData(context.diffCanvasMousePos.x, context.diffCanvasMousePos.y, 1, 1, { colorSpace: 'srgb' })
    const [r1, g1, b1, a1] = img1PixelDataOnMousePosition.data
    const a1perc = `${((a1 * 100)/255).toLocaleString('en-US', {maximumFractionDigits:1})}%`
    const colorBox1Color = `rgb(${r1} ${g1}  ${b1}${a1perc !== "100%" ? ' / '+a1perc : ''})`
    colorBox1.style.backgroundColor = colorBox1Color
    colorBox1.title = colorBox1Color
  
  
    const img2PixelDataOnMousePosition = img2CanvasContext.getImageData(context.diffCanvasMousePos.x, context.diffCanvasMousePos.y, 1, 1, { colorSpace: 'srgb' })
    
    const [r2, g2, b2, a2] = img2PixelDataOnMousePosition.data
    const a2perc = `${((a2 * 100)/255).toLocaleString('en-US', {maximumFractionDigits:1})}%`
    const colorBox2Color = `rgb(${r2} ${g2}  ${b2}${a2perc !== "100%" ? ' / '+a2perc : ''})`
    colorBox2.style.backgroundColor = colorBox2Color
    colorBox2.title = colorBox2Color

    const diffResult = getNormalizedDiffs({
      img1: img1PixelDataOnMousePosition.data,
      img2: img2PixelDataOnMousePosition.data,
      width: 1, height: 1
    })

    const colorDistance = diffResult.diffMap[0]
    colorDiffInfo.textContent = `color distance: ${colorDistance}%`
  }

  magnifier.addEventListener('wheel', (event) => {
    event.preventDefault()
    const scaleup = event.deltaY < 0 ? 1 : -1
    context.scaleIndex = Math.min(context.scaleValues.length - 1, Math.max(0, context.scaleIndex + scaleup))
    pointerMoveHandler(event)
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
function  getMousePos(canvas, event) {
  var rect = canvas.getBoundingClientRect(), // abs. size of element
    scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for x
    scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for y

  return {
    x: (event.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
    y: (event.clientY - rect.top) * scaleY     // been adjusted to be relative to element
  }
}

/** @param {ImageComparisonElement} component */
const initContext = (component) => ({
    x: 0,
    y: 0,
    diffCanvasWidth: 450,
    diffCanvasHeight: 150,
    diffCanvasMousePos: {x: NaN, y: NaN},
    isTooltipFollowingPointer: true,
    get data(){return component.componentData},
    showGrid: true,
    scaleValues: [7, 15, 30],
    scaleIndex: 0,
    get scale(){
      return this.scaleValues[this.scaleIndex]
    }


})

  /** 
   * @param {CanvasRenderingContext2D} magnifierContext - 2d canvas to draw the grid if enabled
   * @param {ReturnType<typeof initContext>} context - 2d canvas to draw the grid if enabled
   */
  const drawGrid = (magnifierContext, context) => {
    if(!context.showGrid){ return }

    const width = context.diffCanvasWidth / 3
    const height = context.diffCanvasHeight
    const {x, y, scale} = context


    magnifierContext.save()
    magnifierContext.beginPath()
    const marginXScale = -Math.floor((x%1)*scale)
    for(let i=marginXScale%scale + scale; i<width; i+=scale){
      magnifierContext.moveTo(i, 0)
      magnifierContext.lineTo(i, height)
      magnifierContext.moveTo(i+width, 0)
      magnifierContext.lineTo(i+width, height)
      magnifierContext.moveTo(i+width*2, 0)
      magnifierContext.lineTo(i+width*2, height)
    }

    const marginYScale = -1-Math.floor((y%1)*scale)
    const magWidth = context.diffCanvasWidth
    for(let i=marginYScale; i<height; i += scale){
      magnifierContext.moveTo(0, i)
      magnifierContext.lineTo(magWidth, i)
    }

    magnifierContext.strokeStyle = "#888"
    magnifierContext.stroke()
    magnifierContext.restore()
  }
