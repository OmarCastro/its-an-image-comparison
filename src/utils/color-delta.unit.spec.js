import { test } from '../../test-utils/unit/test.util.js'
import { colorDelta, maxDelta } from './color-delta.js'

test('max color delta CIEDE2000', ({ expect }) => {
  expect(colorDelta(0, 0, 0, 255, 255, 255, 255, 255, 'CIEDE2000')).toEqual({
    maxDelta: 100,
    delta: 100,
  })
})

test('max color delta YIQ', ({ expect }) => {
  expect(colorDelta(0, 0, 0, 255, 255, 255, 255, 255, 'YIQ')).toEqual({
    maxDelta: 181.26537,
    delta: 181.26537,
  })
})

test('max color delta RGB', ({ expect }) => {
  expect(colorDelta(0, 0, 0, 255, 255, 255, 255, 255, 'RGB')).toEqual({
    maxDelta: 441.67296,
    delta: 441.67296,
  })
})

test('max color delta RieRGB', ({ expect }) => {
  expect(colorDelta(0, 0, 0, 255, 255, 255, 255, 255, 'RieRGB')).toEqual({
    maxDelta: 764.83397,
    delta: 764.83397,
  })
})

test('max color delta Brightness', ({ expect }) => {
  expect(colorDelta(0, 0, 0, 255, 255, 255, 255, 255, 'Brightness')).toEqual({
    maxDelta: 255,
    delta: -255,
  })
})

test('same color should return 0 delta value', ({ expect }) => {
  const result = Object.fromEntries(Object.keys(maxDelta).map(
    algoritm => [algoritm, colorDelta(255, 255, 255, 255, 255, 255, 255, 255, algoritm)]
  ))

  const expected = Object.fromEntries(Object.entries(maxDelta).map(
    ([algoritm, maxDelta]) => [algoritm, { delta: 0, maxDelta }]
  ))

  expect(result).toEqual(expected)
})

test('invalid algorithm defaults to CIEDE2000', ({ expect }) => {
  const expectedResult = {
    maxDelta: 100,
    delta: 100,
  }

  expect(colorDelta(0, 0, 0, 255, 255, 255, 255, 255, null)).toEqual(expectedResult)
  expect(colorDelta(0, 0, 0, 255, 255, 255, 255, 255, 'invalid')).toEqual(expectedResult)
  expect(colorDelta(0, 0, 0, 255, 255, 255, 255, 255, 1)).toEqual(expectedResult)
  expect(colorDelta(0, 0, 0, 255, 255, 255, 255, 255, '3')).toEqual(expectedResult)
})

/**
129.2503 = R:255,G:0,B:0 -> R:0,G:255,B:255
100 = R:0,G:0,B:0 -> R:255,G:255,B:255
90.5338 = R:0,G:0,B:0 -> R:0,G:255,B:255
 */
