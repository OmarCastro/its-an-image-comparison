/* eslint-disable camelcase, jsdoc/tag-lines */
const { sqrt, pow, cos, atan2, sin, abs, exp, PI } = Math

/**
 * Returns diff between c1 and c2 using the CIEDE2000 algorithm
 *
 * Implemented as in "The CIEDE2000 Color-Difference Formula:
 * Implementation Notes, Supplementary Test Data, and Mathematical Observations"
 * by Gaurav Sharma, Wencheng Wu and Edul N. Dalal.
 * @param {labcolor} c1    Should have fields L,a,b
 * @param {labcolor} c2    Should have fields L,a,b
 * @returns {number}   Difference between c1 and c2
 */
export function ciede2000 (c1, c2) {
  // Get L,a,b values for color 1
  const L1 = c1.L
  const a1 = c1.a
  const b1 = c1.b

  // Get L,a,b values for color 2
  const L2 = c2.L
  const a2 = c2.a
  const b2 = c2.b

  // Weight factors
  const kL = 1
  const kC = 1
  const kH = 1

  /**
   * Step 1: Calculate C₁', C₂', h₁', h₂'
   */
  const C1 = sqrt(pow(a1, 2) + pow(b1, 2)) // C₁ (2)
  const C2 = sqrt(pow(a2, 2) + pow(b2, 2)) // C₂ (2)

  const a_C1_C2 = (C1 + C2) / 2.0             // (3)

  const G = 0.5 * (1 - sqrt(pow(a_C1_C2, 7.0) /
                          (pow(a_C1_C2, 7.0) + pow(25.0, 7.0)))) // (4)

  const a1p = (1.0 + G) * a1 // (5)
  const a2p = (1.0 + G) * a2 // (5)

  const C1p = sqrt(pow(a1p, 2) + pow(b1, 2)) // C₁' (6)
  const C2p = sqrt(pow(a2p, 2) + pow(b2, 2)) // C₂' (6)

  const h1p = hp_f(b1, a1p) // h₁' (7)
  const h2p = hp_f(b2, a2p) // h₂' (7)

  /**
   * Step 2: Calculate 𝚫L', 𝚫C', 𝚫H'
   */
  const dLp = L2 - L1 // 𝚫L' (8)
  const dCp = C2p - C1p // 𝚫C' (9)

  const dhp = dhp_f(C1, C2, h1p, h2p) // (10)
  const dHp = 2 * sqrt(C1p * C2p) * sin(radians(dhp) / 2.0) // 𝚫H' (11)

  /**
   * Step 3: Calculate CIEDE2000 Color-Difference
   */
  const a_L = (L1 + L2) / 2.0 // (12)
  const a_Cp = (C1p + C2p) / 2.0 // (13)

  const a_hp = a_hp_f(C1, C2, h1p, h2p) // (14)
  const T = 1 - 0.17 * cos(radians(a_hp - 30)) + 0.24 * cos(radians(2 * a_hp)) +
    0.32 * cos(radians(3 * a_hp + 6)) - 0.20 * cos(radians(4 * a_hp - 63)) // (15)
  const d_ro = 30 * exp(-(pow((a_hp - 275) / 25, 2))) // (16)
  const RC = sqrt((pow(a_Cp, 7.0)) / (pow(a_Cp, 7.0) + pow(25.0, 7.0)))// (17)
  const SL = 1 + ((0.015 * pow(a_L - 50, 2)) /
                sqrt(20 + pow(a_L - 50, 2.0)))// (18)
  const SC = 1 + 0.045 * a_Cp// (19)
  const SH = 1 + 0.015 * a_Cp * T// (20)
  const RT = -2 * RC * sin(radians(2 * d_ro))// (21)
  // (22)
  return sqrt(pow(dLp / (SL * kL), 2) + pow(dCp / (SC * kC), 2) +
                pow(dHp / (SH * kH), 2) + RT * (dCp / (SC * kC)) *
                (dHp / (SH * kH)))
}

/**
 * calculate h' value, follows the next formula:
 *
 *      ⎧ 0                b*=a'=0
 * h' = ⎨
 *      ⎩ tan⁻¹(b*, a')   otherwise
 *
 * @param {number} x - b* value
 * @param {number} y - a' value
 * @returns {number} h' value
 */
function hp_f (x, y) { // (7)
  if (x === 0 && y === 0) return 0
  else {
    const tmphp = degrees(atan2(x, y))
    if (tmphp >= 0) return tmphp
    else return tmphp + 360
  }
}

/**
 * calculate 𝚫h' value, follows the next formula:
 *
 *       ⎧ 0                C₁'C₂'=0
 *       ⎪
 *       ⎪ h₂'-h₁'          C₁'C₂'≠0; |h₂'-h₁'|≤180°
 * 𝚫h' = ⎨
 *       ⎪ h₂'-h₁'-360      C₁'C₂'≠0; (h₂'-h₁')>180°
 *       ⎪
 *       ⎩ h₂'-h₁'+360      C₁'C₂'≠0; (h₂'-h₁')<-180°
 *
 * @param {number} C1 - C₁' value
 * @param {number} C2 - C₂' value
 * @param {number} h1p - h₁' value
 * @param {number} h2p - h₂' value
 * @returns {number} 𝚫h' value
 */
const dhp_f = function (C1, C2, h1p, h2p) { // (10)
  if (C1 * C2 === 0) return 0
  else if (abs(h2p - h1p) <= 180) return h2p - h1p
  else if ((h2p - h1p) > 180) return (h2p - h1p) - 360
  else if ((h2p - h1p) < -180) return (h2p - h1p) + 360
  else throw (new Error())
}

/**
 * calculate h͞' value, follows the next formula:
 *
 *      ⎧ h₁'+h₂'          C₁'C₂'=0
 *      ⎪
 *      ⎪ h₁'+h₂'          C₁'C₂'≠0; |h₁'-h₂'|≤180°
 *      ⎪ ───────
 *      ⎪    2
 *      ⎪
 * h͞' = ⎨ h₁'+h₂'+360      C₁'C₂'≠0; |h₁'-h₂'|>180°; (h₁'+h₂')<360°
 *      ⎪ ───────────
 *      ⎪      2
 *      ⎪
 *      ⎪ h₁'+h₂'-360      C₁'C₂'≠0; |h₁'-h₂'|>180°; (h₁'+h₂')≥360°
 *      ⎪ ───────────
 *      ⎩      2
 *
 * @param {number} C1 - C₁' value
 * @param {number} C2 - C₂' value
 * @param {number} h1p - h₁' value
 * @param {number} h2p - h₂' value
 * @returns {number} 𝚫h' value
 */
const a_hp_f = function (C1, C2, h1p, h2p) { // (14)
  if (C1 * C2 === 0) return h1p + h2p
  else if (abs(h1p - h2p) <= 180) return (h1p + h2p) / 2.0
  else if ((abs(h1p - h2p) > 180) && ((h1p + h2p) < 360)) return (h1p + h2p + 360) / 2.0
  else if ((abs(h1p - h2p) > 180) && ((h1p + h2p) >= 360)) return (h1p + h2p - 360) / 2.0
  else throw (new Error())
}

/**
 * convert radians to degrees
 * @param {number} radians - number in radians
 */
function degrees (radians) { return radians * (180 / PI) }
/**
 * convert degrees to radians
 * @param {number} degrees - number in degrees
 */
function radians (degrees) { return degrees * (PI / 180) }
