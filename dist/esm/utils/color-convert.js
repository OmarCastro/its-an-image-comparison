/* eslint-disable camelcase */
/** @import { rgbcolor, labcolor, xyzcolor} from './color-types.d' */

const pow = Math.pow

/**
 * Converts sRGB color `c` to CIE L*a*b*.
 * @param {rgbcolor} c standard-RGB color to convert, should have fields R,G,B
 * @returns {labcolor} the color in the CIE L*a*b* color space
 */
export function rgb_to_lab (c) {
  return xyz_to_lab(rgb_to_xyz(c))
}

/**
 * Converts sRGB color to CIE 1931 XYZ color  (2° observer). Based on {@link http://www.easyrgb.com/en/math.php}
 * @param {rgbcolor} c standard-RGB color to convert, should have fields R,G,B
 * @returns {xyzcolor} the color in the CIE 1931 XYZ color space
 */
function rgb_to_xyz (c) {
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
 * Converts CIE 1931 XYZ values (2° observer) `c` to CIE L*a*b*.
 *
 * @see {@link http://www.easyrgb.com/en/math.php}
 * @param {xyzcolor} c - the CIE 1931 XYZ color to convert which refers to the D65/2° standard illuminant, should have fields X,Y,Z
 * @returns {labcolor} the color in the CIE L*a*b* color space
 */
export function xyz_to_lab (c) {
  const ref_Y = 100.000
  const ref_Z = 108.883
  const ref_X = 95.047 // Observer= 2°, Illuminant= D65, @see Reference values in the table below
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

/**
 *
 * XYZ (Tristimulus) Reference values of a perfect reflecting diffuser ( source: http://www.easyrgb.com/en/math.php )
 *
 * Observer           2° (CIE 1931)                10° (CIE 1964)           Note
 * Illuminant    X2        Y2        Z2        X10       Y10       Z10
 * A          109.850    100.000    35.585   111.144   100.000    35.200    Incandescent/tungsten
 * B           99.0927   100.000    85.313    99.178   100.000    84.3493   Old direct sunlight at noon
 * C           98.074    100.000   118.232    97.285   100.000   116.145    Old daylight
 * D50         96.422    100.000    82.521    96.720   100.000    81.427    ICC profile PCS
 * D55         95.682    100.000    92.149    95.799   100.000    90.926    Mid-morning daylight
 * D65         95.047    100.000   108.883    94.811   100.000   107.304    Daylight, sRGB, Adobe-RGB
 * D75         94.972    100.000   122.638    94.416   100.000   120.641    North sky daylight
 * E          100.000    100.000   100.000   100.000   100.000   100.000    Equal energy
 * F1          92.834    100.000   103.665    94.791   100.000   103.191    Daylight Fluorescent
 * F2          99.187    100.000    67.395   103.280   100.000    69.026    Cool fluorescent
 * F3         103.754    100.000    49.861   108.968   100.000    51.965    White Fluorescent
 * F4         109.147    100.000    38.813   114.961   100.000    40.963    Warm White Fluorescent
 * F5          90.872    100.000    98.723    93.369   100.000    98.636    Daylight Fluorescent
 * F6          97.309    100.000    60.191   102.148   100.000    62.074    Lite White Fluorescent
 * F7          95.044    100.000   108.755    95.792   100.000   107.687    Daylight fluorescent, D65 simulator
 * F8          96.413    100.000    82.333    97.115   100.000    81.135    Sylvania F40, D50 simulator
 * F9         100.365    100.000    67.868   102.116   100.000    67.826    Cool White Fluorescent
 * F10         96.174    100.000    81.712    99.001   100.000    83.134    Ultralume 50, Philips TL85
 * F11        100.966    100.000    64.370   103.866   100.000    65.627    Ultralume 40, Philips TL84
 * F12        108.046    100.000    39.228   111.428   100.000    40.353    Ultralume 30, Philips TL83
 */
