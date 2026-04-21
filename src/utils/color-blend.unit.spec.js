import { test } from '../../test-utils/unit/test.util.js'
import { colorBlend } from './color-blend.js'

test('colorBlend - returns color 1 rgb if completely opaque', ({ expect }) => {
  const R = Math.floor(Math.random() * 255)
  const G = Math.floor(Math.random() * 255)
  const B = Math.floor(Math.random() * 255)

  const step = 10
  //R
  for(let R = Math.floor(Math.random() * step); R < 256; R+=step){
    expect(colorBlend(R, G, B, 255, 0, 0, 0)).toEqual({ R, G, B })
  }
  //G
  for(let G = Math.floor(Math.random() * step); G < 256; G+=step){
    expect(colorBlend(R, G, B, 255, 0, 0, 0)).toEqual({ R, G, B })
  }
  //B
  for(let B = Math.floor(Math.random() * step); B < 256; B+=step){
    expect(colorBlend(R, G, B, 255, 0, 0, 0)).toEqual({ R, G, B })
  }
})

test('colorBlend - blend if semi transparent', ({ expect }) => {
  const R = 234
  const G = 23
  const B = 43
  const result = colorBlend(R, G, B, 127, 0, 0, 0)
  expect({
    R: Math.round(result.R),
    G: Math.round(result.G),
    B: Math.round(result.B),
  }).toEqual({ R: 117, G: 11, B: 21 })
})

test('colorBlend - returns color 2 rgb if completely opaque', ({ expect }) => {
  const R = Math.floor(Math.random() * 255)
  const G = Math.floor(Math.random() * 255)
  const B = Math.floor(Math.random() * 255)

  const step = 10
  //R
  for(let R = Math.floor(Math.random() * step); R < 256; R+=step){
    expect(colorBlend(0, 0, 0, 0, R, G, B)).toEqual({ R, G, B })
  }
  //G
  for(let G = Math.floor(Math.random() * step); G < 256; G+=step){
    expect(colorBlend(0, 0, 0, 0, R, G, B)).toEqual({ R, G, B })
  }
  //B
  for(let B = Math.floor(Math.random() * step); B < 256; B+=step){
    expect(colorBlend(0, 0, 0, 0, R, G, B)).toEqual({ R, G, B })
  }
})
