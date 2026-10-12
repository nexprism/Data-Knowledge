import React from 'react'

const CheckoutBreakdown = ({
  basePrice = 0,
  discount = 0,
  gstRate = 0.18,
  couponData = null,
  className = '',
  compact = false
}) => {
  const format = (v) => `₹${Number(v || 0).toFixed(2)}`
  const discountedBase = Math.max(0, basePrice - discount)
  const gstAmount = discountedBase * Number(gstRate || 0)
  const total = discountedBase + gstAmount
  const savingsPercent =
    couponData && couponData.discountType === 'percentage' && couponData.discountPercent

  return (
    <div
      className={`rounded-2xl p-5 ${
        compact
          ? 'bg-slate-50/80 border border-slate-200/80 shadow-sm'
          : 'bg-white border border-slate-200 shadow-sm'
      } ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <h4 className="text-sm font-semibold text-slate-800">Price Breakdown</h4>
        {couponData?.code && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {couponData.code}
            {savingsPercent ? ` (${savingsPercent}% OFF)` : ''}
          </span>
        )}
      </div>

      <dl className="space-y-2.5 text-sm">
        <div className="flex justify-between items-center text-slate-600">
          <dt>Base Price</dt>
          <dd className="font-medium text-slate-900">{format(basePrice)}</dd>
        </div>

        {discount > 0 && (
          <div className="flex justify-between items-center text-emerald-600 font-medium">
            <dt>Coupon Discount</dt>
            <dd>-{format(discount)}</dd>
          </div>
        )}

        <div className="flex justify-between items-center text-slate-600">
          <dt>GST ({(Number(gstRate || 0) * 100).toFixed(0)}%)</dt>
          <dd className="font-medium text-slate-900">{format(gstAmount)}</dd>
        </div>

        <div className="pt-3 border-t border-slate-200/80 flex justify-between items-baseline">
          <dt className="text-base font-bold text-slate-900">Total Amount</dt>
          <dd className="text-2xl font-extrabold text-blue-600 tracking-tight">
            {format(total)}
          </dd>
        </div>
      </dl>

      {!compact && (
        <p className="mt-4 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
          Taxes are calculated after discounts. No additional hidden transaction fees.
        </p>
      )}
    </div>
  )
}

export default CheckoutBreakdown
