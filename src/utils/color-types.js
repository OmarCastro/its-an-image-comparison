/**
 * @typedef {object} rgbcolor
 *
 * The RGB color model is an additive color model in which the red, green and blue primary colors of
 * light are added together in various ways to reproduce a broad array of colors. The name of the model
 * comes from the initials of the three additive primary colors: red, green, and blue.
 * @property {number} R - Red primary color on RGB color model
 * @property {number} G - Green primary color on RGB color model
 * @property {number} B - Blue primary color on RGB color model
 */

/**
 * @typedef {object} xyzcolor
 *
 * Represents the CIE 1931 color space which define the relationship between the visible spectrum and
 * the visual sensation of specific colors by human color vision. The CIE color spaces are mathematical
 * models that create a "standard observer", which attempts to predict the perception of unique hues
 * of color.
 *
 * In the CIE 1931 model, Y is the luminance, Z is quasi-equal to blue (of CIE RGB), and X is a mix of
 * the three CIE RGB curves chosen to be nonnegative. Setting Y as luminance has the useful result that
 * for any given Y value, the XZ plane will contain all possible chromaticities at that luminance.
 * @property {number} X - mix of three CIE RGB curves
 * @property {number} Y - luminance
 * @property {number} Z - Blue value
 */

/**
 * @typedef {object} labcolor
 *
 * The CIELAB color space, also referred to as L*a*b*, is a color space defined by the International
 * Commission on Illumination (abbreviated CIE) in 1976. It expresses color as three values: L* for
 * perceptual lightness and a* and b* for the four unique colors of human vision: red, green, blue and
 * yellow.
 *
 * CIELAB was intended as a perceptually uniform space, where a given numerical change
 * corresponds to a similar perceived change in color.
 *
 * While the LAB space is not truly perceptually uniform, it nevertheless is useful in industry for
 * detecting small differences in color.
 * @property {number} L - LAB Color perceptual lightness, or L* value, value between 0 and 100
 * @property {number} a - LAB Color a* axis value
 * @property {number} b - LAB Color a value
 */

// this line is for /** @import */ to work on typescript
export default undefined
