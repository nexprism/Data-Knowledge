/**
 * LMS GST & Payment Charges Calculation Utility
 * 
 * Handles accurate mathematical calculations for:
 * - Exclusive GST: Price is base, GST is added on top.
 * - Inclusive GST: Price already contains GST; base price is extracted.
 * - Payment Gateway Charges: Fee calculated as percentage, can be collected from student or absorbed.
 * - Coupon / Promo discounts applied cleanly before tax calculation.
 */

/**
 * Normalizes percentage rates (handles both 18 and 0.18 for 18%)
 * @param {number|string} rate 
 * @returns {{ percent: number, decimal: number }}
 */
export const normalizeRate = (rate, defaultPercent = 0) => {
  const num = parseFloat(rate);
  if (isNaN(num) || num < 0) {
    const d = defaultPercent > 1 ? defaultPercent / 100 : defaultPercent;
    const p = defaultPercent > 1 ? defaultPercent : defaultPercent * 100;
    return { percent: p, decimal: d };
  }
  if (num <= 1 && num > 0) {
    return { percent: Math.round(num * 10000) / 100, decimal: num };
  }
  return { percent: num, decimal: num / 100 };
};

/**
 * Rounds to 2 decimal places with banker's / precision rounding
 * @param {number} value 
 * @returns {number}
 */
export const round2 = (value) => {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates complete pricing breakdown
 * 
 * @param {Object} options
 * @param {number} options.listedPrice - Course regular or sale price (gross or base depending on gstType)
 * @param {number} [options.discount=0] - Coupon discount amount
 * @param {'inclusive'|'exclusive'} [options.gstType='exclusive'] - Inclusive or Exclusive GST
 * @param {number} [options.gstRate=18] - GST rate (e.g. 18 for 18% or 0.18)
 * @param {number} [options.paymentGatewayFeeRate=2] - Gateway fee rate (e.g. 2 for 2% or 0.02)
 * @param {boolean} [options.collectGatewayFee=false] - Whether gateway fee is charged to student
 * @param {number} [options.otherCharges=0] - Any other applicable charges
 * @returns {Object} Full itemized breakdown
 */
export const calculatePricingBreakdown = ({
  listedPrice = 0,
  discount = 0,
  gstType = 'exclusive',
  gstRate = 18,
  paymentGatewayFeeRate = 2,
  collectGatewayFee,
  collectPaymentGatewayFeeFromStudent,
  otherCharges = 0,
}) => {
  const p = Math.max(0, parseFloat(listedPrice) || 0);
  const d = Math.min(p, Math.max(0, parseFloat(discount) || 0));
  const netCourseAmount = Math.max(0, round2(p - d));

  const { percent: gstPercent, decimal: gstDecimal } = normalizeRate(gstRate, 18);
  const { percent: pgPercent, decimal: pgDecimal } = normalizeRate(paymentGatewayFeeRate, 2);
  const isInclusive = String(gstType).toLowerCase() === 'inclusive';

  const shouldCollectFee = collectPaymentGatewayFeeFromStudent !== undefined
    ? (collectPaymentGatewayFeeFromStudent === true || collectPaymentGatewayFeeFromStudent === 'true' || collectPaymentGatewayFeeFromStudent === 1)
    : (collectGatewayFee === true || collectGatewayFee === 'true' || collectGatewayFee === 1);

  let basePrice = 0;
  let gstAmount = 0;
  let courseSubtotalWithTax = 0;

  if (isInclusive) {
    // INCLUSIVE GST:
    // netCourseAmount contains both Base Price + GST
    // Base Price = netCourseAmount / (1 + gstDecimal)
    // GST Amount = netCourseAmount - Base Price
    basePrice = round2(netCourseAmount / (1 + gstDecimal));
    gstAmount = round2(netCourseAmount - basePrice);
    courseSubtotalWithTax = netCourseAmount;
  } else {
    // EXCLUSIVE GST:
    // netCourseAmount is the Base Price
    // GST is added on top
    basePrice = netCourseAmount;
    gstAmount = round2(basePrice * gstDecimal);
    courseSubtotalWithTax = round2(basePrice + gstAmount);
  }

  // Payment Gateway Fee calculation
  // Calculated on the payable course subtotal with tax
  const calculatedGatewayFee = round2(courseSubtotalWithTax * pgDecimal);
  const paymentGatewayFee = shouldCollectFee ? calculatedGatewayFee : 0;
  const platformAbsorbedGatewayFee = shouldCollectFee ? 0 : calculatedGatewayFee;

  const validOtherCharges = Math.max(0, round2(parseFloat(otherCharges) || 0));

  // Grand Total payable by student
  const grandTotal = round2(courseSubtotalWithTax + paymentGatewayFee + validOtherCharges);

  // Platform net earnings (GrandTotal - gateway fee)
  const platformNetPayout = round2(grandTotal - (shouldCollectFee ? paymentGatewayFee : platformAbsorbedGatewayFee));

  return {
    listedPrice: round2(p),
    discount: round2(d),
    netCourseAmount: round2(netCourseAmount),
    discountedPrice: round2(netCourseAmount),
    gstType: isInclusive ? 'inclusive' : 'exclusive',
    gstRate: gstPercent,
    gstRatePercent: gstPercent,
    gstRateDecimal: gstDecimal,
    basePrice: round2(basePrice),
    gstAmount: round2(gstAmount),
    courseSubtotalWithTax: round2(courseSubtotalWithTax),
    payableAmountWithoutGatewayFee: round2(courseSubtotalWithTax),
    paymentGatewayFeeRate: pgPercent,
    paymentGatewayFeeRatePercent: pgPercent,
    paymentGatewayFeeRateDecimal: pgDecimal,
    calculatedGatewayFee: round2(calculatedGatewayFee),
    paymentGatewayFee: round2(paymentGatewayFee),
    platformAbsorbedGatewayFee: round2(platformAbsorbedGatewayFee),
    collectGatewayFee: shouldCollectFee,
    collectPaymentGatewayFeeFromStudent: shouldCollectFee,
    otherCharges: validOtherCharges,
    grandTotal: round2(grandTotal),
    platformNetPayout: round2(platformNetPayout),
  };
};

export default calculatePricingBreakdown;
