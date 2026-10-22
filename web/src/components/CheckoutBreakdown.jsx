import React, { useMemo } from 'react'

/**
 * Normalizes rate which could be passed either as percentage (e.g. 18) or decimal (e.g. 0.18).
 */
const normalizeRate = (rate, defaultVal = 0) => {
  if (rate === undefined || rate === null || isNaN(Number(rate))) return defaultVal
  const num = Number(rate)
  return num > 1 ? num / 100 : num
}

const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100

const CheckoutBreakdown = ({
  breakdown = null,
  basePrice = 0,
  discount = 0,
  gstRate = 0.18,
  gstType = 'exclusive',
  paymentGatewayFeeRate = 0.02,
  collectPaymentGatewayFeeFromStudent = false,
  couponData = null,
  className = '',
  compact = false
}) => {
  const format = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Compute breakdown if not explicitly supplied from backend
  const data = useMemo(() => {
    if (breakdown && typeof breakdown === 'object') {
      return {
        listedPrice: round2(breakdown.listedPrice || 0),
        discount: round2(breakdown.discount || 0),
        discountedPrice: round2(breakdown.discountedPrice || 0),
        gstType: breakdown.gstType === 'inclusive' ? 'inclusive' : 'exclusive',
        gstRatePercent: Math.round(normalizeRate(breakdown.gstRate, 0.18) * 10000) / 100,
        basePrice: round2(breakdown.basePrice || 0),
        gstAmount: round2(breakdown.gstAmount || 0),
        paymentGatewayFeeRatePercent: Math.round(normalizeRate(breakdown.paymentGatewayFeeRate, 0.02) * 10000) / 100,
        collectGatewayFee: Boolean(breakdown.collectPaymentGatewayFeeFromStudent),
        paymentGatewayFee: round2(breakdown.paymentGatewayFee || 0),
        grandTotal: round2(breakdown.grandTotal || 0)
      }
    }

    const listed = Number(basePrice || 0)
    const disc = Math.min(listed, Math.max(0, Number(discount || 0)))
    const net = Math.max(0, listed - disc)

    const rGst = normalizeRate(gstRate, 0.18)
    const isInclusive = gstType === 'inclusive'

    let base = 0
    let gstAmt = 0

    if (isInclusive) {
      base = rGst > 0 ? round2(net / (1 + rGst)) : net
      gstAmt = round2(net - base)
    } else {
      base = net
      gstAmt = round2(net * rGst)
    }

    const payableBeforeGateway = isInclusive ? net : round2(net + gstAmt)
    const rPg = normalizeRate(paymentGatewayFeeRate, 0.02)
    const totalPgFee = round2(payableBeforeGateway * rPg)
    const collectPg = Boolean(collectPaymentGatewayFeeFromStudent)
    const pgFeeCharged = collectPg ? totalPgFee : 0
    const grand = round2(payableBeforeGateway + pgFeeCharged)

    return {
      listedPrice: round2(listed),
      discount: round2(disc),
      discountedPrice: round2(net),
      gstType: isInclusive ? 'inclusive' : 'exclusive',
      gstRatePercent: Math.round(rGst * 10000) / 100,
      basePrice: base,
      gstAmount: gstAmt,
      paymentGatewayFeeRatePercent: Math.round(rPg * 10000) / 100,
      collectGatewayFee: collectPg,
      paymentGatewayFee: totalPgFee,
      paymentGatewayFeeCharged: pgFeeCharged,
      grandTotal: grand
    }
  }, [breakdown, basePrice, discount, gstRate, gstType, paymentGatewayFeeRate, collectPaymentGatewayFeeFromStudent])

  const savingsPercent =
    couponData && couponData.discountType === 'percentage' && couponData.discountPercent

  return (
    <div
      className={`rounded-2xl p-5 transition-all ${
        compact
          ? 'bg-slate-50/90 border border-slate-200/90 shadow-sm'
          : 'bg-white border border-slate-200 shadow-sm'
      } ${className}`}
    >
      {/* Title & Coupon Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 mb-3.5">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-800">Checkout Price Breakdown</h4>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
              data.gstType === 'inclusive'
                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            {data.gstType === 'inclusive' ? 'GST Inclusive' : 'GST Exclusive'}
          </span>
        </div>

        {couponData?.code && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {couponData.code}
            {savingsPercent ? ` (${savingsPercent}% OFF)` : ''}
          </span>
        )}
      </div>

      <dl className="space-y-2.5 text-sm">
        {/* Base / Listed Price */}
        <div className="flex justify-between items-center text-slate-600">
          <dt className="flex items-center gap-1.5">
            <span>Course Base Price</span>
            {data.gstType === 'inclusive' && (
              <span className="text-[10px] text-slate-600 bg-slate-200/60 px-1.5 py-0.2 rounded font-medium">
                (Pre-tax)
              </span>
            )}
          </dt>
          <dd className="font-medium text-slate-900">{format(data.basePrice)}</dd>
        </div>

        {/* Discount Line */}
        {data.discount > 0 && (
          <div className="flex justify-between items-center text-emerald-600 font-medium">
            <dt>Coupon Discount</dt>
            <dd>-{format(data.discount)}</dd>
          </div>
        )}

        {/* GST Line */}
        <div className="flex justify-between items-center text-slate-600">
          <dt className="flex items-center gap-1.5">
            <span>GST ({data.gstRatePercent}%)</span>
            {data.gstType === 'inclusive' && (
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">
                Included in Price
              </span>
            )}
          </dt>
          <dd className="font-medium text-slate-900">
            {data.gstType === 'inclusive' ? (
              <span>{format(data.gstAmount)}</span>
            ) : (
              <span>+{format(data.gstAmount)}</span>
            )}
          </dd>
        </div>

        {/* Payment Gateway Charges */}
        <div className="flex justify-between items-center text-slate-600">
          <dt className="flex items-center gap-1.5">
            <span>Payment Gateway Charges ({data.paymentGatewayFeeRatePercent}%)</span>
            {!data.collectGatewayFee && (
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">
                Waived / Included
              </span>
            )}
          </dt>
          <dd className="font-medium text-slate-900">
            {data.collectGatewayFee ? (
              <span className="text-slate-900 font-semibold">+{format(data.paymentGatewayFee)}</span>
            ) : (
              <span className="text-emerald-600 font-medium">₹0.00</span>
            )}
          </dd>
        </div>

        {/* Final Payable Amount */}
        <div className="pt-3 border-t border-slate-200/80 flex justify-between items-baseline">
          <div>
            <dt className="text-base font-bold text-slate-900">Final Payable Amount</dt>
            <p className="text-[11px] text-slate-500 font-normal">
              {data.gstType === 'inclusive'
                ? `Includes ${data.gstRatePercent}% GST${data.collectGatewayFee ? ` + ${data.paymentGatewayFeeRatePercent}% PG fee` : ''}`
                : `Base + ${data.gstRatePercent}% GST${data.collectGatewayFee ? ` + ${data.paymentGatewayFeeRatePercent}% PG fee` : ''}`}
            </p>
          </div>
          <dd className="text-2xl font-extrabold text-blue-600 tracking-tight">
            {format(data.grandTotal)}
          </dd>
        </div>
      </dl>

      {!compact && (
        <div className="mt-4 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>100% transparent pricing with itemized GST invoice upon successful checkout.</span>
        </div>
      )}
    </div>
  )
}

export default CheckoutBreakdown
