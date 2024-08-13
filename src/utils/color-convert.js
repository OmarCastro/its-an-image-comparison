/* eslint-disable camelcase */

const pow = Math.pow

/**
 * Returns c converted to labcolor.
 * @param {rgbcolor} c should have fields R,G,B
 * @returns {labcolor} c converted to labcolor
 */
export function rgb_to_lab (c) {
  return xyz_to_lab(rgb_to_xyz(c))
}

/**
 * Returns c converted to xyzcolor.
 * @param {rgbcolor} c should have fields R,G,B
 * @returns {xyzcolor} c converted to xyzcolor
 */
function rgb_to_xyz (c) {
  // Based on http://www.easyrgb.com/index.php?X=MATH&H=02
  let R = (c.R / 255)
  let G = (c.G / 255)
  let B = (c.B / 255)

  if (R > 0.04045) R = pow(((R + 0.055) / 1.055), 2.4)
  else R = R / 12.92
  if (G > 0.04045) G = pow(((G + 0.055) / 1.055), 2.4)
  else G = G / 12.92
  if (B > 0.04045) B = pow(((B + 0.055) / 1.055), 2.4)
  else B = B / 12.92

  R *= 100
  G *= 100
  B *= 100

  // Observer. = 2°, Illuminant = D65
  const X = R * 0.4124 + G * 0.3576 + B * 0.1805
  const Y = R * 0.2126 + G * 0.7152 + B * 0.0722
  const Z = R * 0.0193 + G * 0.1192 + B * 0.9505
  return { X, Y, Z }
}

/**
 * Returns c converted to labcolor.
 * @param {xyzcolor} c should have fields X,Y,Z
 * @returns {labcolor} c converted to labcolor
 */
function xyz_to_lab (c) {
  // Based on http://www.easyrgb.com/index.php?X=MATH&H=07
  const ref_Y = 100.000
  const ref_Z = 108.883
  const ref_X = 95.047 // Observer= 2°, Illuminant= D65
  let Y = c.Y / ref_Y
  let Z = c.Z / ref_Z
  let X = c.X / ref_X
  if (X > 0.008856) X = pow(X, 1 / 3)
  else X = (7.787 * X) + (16 / 116)
  if (Y > 0.008856) Y = pow(Y, 1 / 3)
  else Y = (7.787 * Y) + (16 / 116)
  if (Z > 0.008856) Z = pow(Z, 1 / 3)
  else Z = (7.787 * Z) + (16 / 116)
  const L = (116 * Y) - 16
  const a = 500 * (X - Y)
  const b = 200 * (Y - Z)
  return { L, a, b }
}
