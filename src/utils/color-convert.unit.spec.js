import { test } from '../../test-utils/unit/test.util.js'
import { rgb_to_lab } from './color-convert.js' 

test('rgb to lab', ({ expect }) => {
  expect(rgb_to_lab({R: 0, G: 0, B: 0})).toEqual({L: 0, a: 0, b: 0})
  expect(rgb_to_lab({R: 255, G: 0, B: 0})).toEqual({L: 53.23288178584245, a: 80.10930952982204, b: 67.22006831026425})
  expect(rgb_to_lab({R: 0, G: 255, B: 255})).toEqual({L: 91.11652110946342, a: -48.079618466228716, b: -14.138127754846131})
})

/**
129.2503 = R:255,G:0,B:0 -> R:0,G:255,B:255
100 = R:0,G:0,B:0 -> R:255,G:255,B:255
90.5338 = R:0,G:0,B:0 -> R:0,G:255,B:255
 */

