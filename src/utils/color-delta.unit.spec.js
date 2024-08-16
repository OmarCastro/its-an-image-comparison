import { test } from '../../test-utils/unit/test.util.js'
import { colorDelta } from './color-delta.js'

test('max color delta CIEDE2000', ({ expect }) => {
  expect(colorDelta(0, 0, 0, 255, 255, 255, 255, 255, "CIEDE2000")).toEqual({
    maxDelta: 100,
    delta: 100,
    deltaPercentToMax: 100,
  })
})

test('max color delta YIQ', ({ expect }) => {
  expect(colorDelta(0, 0, 0, 255, 255, 255, 255, 255, "YIQ")).toEqual({
    maxDelta: 32857.13316,
    delta: 32857.13316,
    deltaPercentToMax: 100,
  })
})

test('max color delta RGB', ({ expect }) => {
  expect(colorDelta(0, 0, 0, 255, 255, 255, 255, 255, "RGB")).toEqual({
    maxDelta: 195075,
    delta: 195075,
    deltaPercentToMax: 100,
  })
})

test('max color delta RieRGB', ({ expect }) => {
  expect(colorDelta(0, 0, 0, 255, 255, 255, 255, 255, "RieRGB")).toEqual({
    maxDelta: 584970.99609,
    delta: 584970.99609,
    deltaPercentToMax: 100,
  })
})

test('max color delta Brightness', ({ expect }) => {
  expect(colorDelta(0, 0, 0, 255, 255, 255, 255, 255, "Brightness")).toEqual({
    maxDelta: 255,
    delta: 255,
    deltaPercentToMax: 100,
  })
})


/**
129.2503 = R:255,G:0,B:0 -> R:0,G:255,B:255
100 = R:0,G:0,B:0 -> R:255,G:255,B:255
90.5338 = R:0,G:0,B:0 -> R:0,G:255,B:255
 */