import React, { useMemo } from "react";
import {
  DollarSign,
  Percent,
  CreditCard,
  Calculator,
  HelpCircle,
  Info,
  CheckCircle,
} from "lucide-react";

interface CoursePricingGstSectionProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  formErrors: Record<string, string>;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}

const GST_PRESETS = [0, 5, 12, 18, 28];
const PG_PRESETS = [0, 1.5, 2, 2.5, 3];

export default function CoursePricingGstSection({
  formData,
  setFormData,
  formErrors,
  handleInputChange,
}: CoursePricingGstSectionProps) {
  const currentPrice = parseFloat(formData.salePrice || formData.price || 0) || 0;
  const gstRate = formData.gstRate !== undefined ? parseFloat(formData.gstRate) : 18;
  const gstType = formData.gstType === "inclusive" ? "inclusive" : "exclusive";
  const pgFeeRate =
    formData.paymentGatewayFeeRate !== undefined
      ? parseFloat(formData.paymentGatewayFeeRate)
      : 2;
  const collectPgFee = Boolean(formData.collectPaymentGatewayFeeFromStudent);

  // Live breakdown calculation
  const breakdown = useMemo(() => {
    const p = Math.max(0, currentPrice);
    const gstDec = (gstRate || 0) / 100;
    const pgDec = (pgFeeRate || 0) / 100;

    let base = 0;
    let gstAmount = 0;
    let courseWithTax = 0;

    if (gstType === "inclusive") {
      base = p / (1 + gstDec);
      gstAmount = p - base;
      courseWithTax = p;
    } else {
      base = p;
      gstAmount = base * gstDec;
      courseWithTax = base + gstAmount;
    }

    const calculatedPg = courseWithTax * pgDec;
    const studentPg = collectPgFee ? calculatedPg : 0;
    const grandTotal = courseWithTax + studentPg;
    const academyPayout = grandTotal - calculatedPg;

    return {
      listedPrice: p,
      basePrice: Math.round(base * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      courseWithTax: Math.round(courseWithTax * 100) / 100,
      pgFee: Math.round(calculatedPg * 100) / 100,
      studentPg: Math.round(studentPg * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      academyPayout: Math.round(academyPayout * 100) / 100,
    };
  }, [currentPrice, gstRate, gstType, pgFeeRate, collectPgFee]);

  return (
    <div className="space-y-8">
      {/* Basic Pricing Grid */}
      <div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-blue-600" />
          Course Base Pricing
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Regular Price *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d+(\.\d{0,2})?$/.test(val)) {
                  handleInputChange(e);
                }
              }}
              step="0.01"
              min="0"
              className={`w-full border rounded-xl px-4 py-3 dark:text-gray-200 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.price
                  ? "border-red-400"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="e.g. 2999"
              required
            />
            {formErrors.price && (
              <p className="mt-1 text-xs text-red-600">{formErrors.price}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Sale Price (Optional)
            </label>
            <input
              type="number"
              name="salePrice"
              value={formData.salePrice}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d+(\.\d{0,2})?$/.test(val)) {
                  handleInputChange(e);
                }
              }}
              step="0.01"
              min="0"
              className={`w-full border rounded-xl px-4 py-3 dark:text-gray-200 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.salePrice
                  ? "border-red-400"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="e.g. 1999"
            />
            {formErrors.salePrice && (
              <p className="mt-1 text-xs text-red-600">{formErrors.salePrice}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Currency
            </label>
            <select
              name="currency"
              value={formData.currency || "INR"}
              onChange={handleInputChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 dark:text-gray-200 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>
      </div>

      {/* GST Configuration Card */}
      <div className="bg-gray-50/70 dark:bg-gray-900/40 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                GST (Goods &amp; Services Tax) Settings
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Configure Inclusive vs Exclusive GST and custom tax rate for this course
              </p>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={Boolean(formData.overrideGst)}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  overrideGst: e.target.checked,
                }))
              }
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span>Customize GST for this course</span>
          </label>
        </div>

        {/* GST Type Selection (Inclusive vs Exclusive) */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            GST Calculation Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Exclusive GST */}
            <div
              onClick={() =>
                setFormData((prev: any) => ({ ...prev, gstType: "exclusive" }))
              }
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                gstType === "exclusive"
                  ? "border-blue-600 bg-white dark:bg-gray-800 shadow-sm"
                  : "border-gray-200 dark:border-gray-700/80 hover:border-gray-300 bg-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  Exclusive GST
                </span>
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    gstType === "exclusive"
                      ? "border-blue-600 bg-blue-600"
                      : "border-gray-300"
                  }`}
                >
                  {gstType === "exclusive" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Course price is the base amount. GST is added on top during checkout.
              </p>
              <div className="mt-2 text-[11px] font-mono text-blue-600 dark:text-blue-400">
                Student pays: Price + GST
              </div>
            </div>

            {/* Inclusive GST */}
            <div
              onClick={() =>
                setFormData((prev: any) => ({ ...prev, gstType: "inclusive" }))
              }
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                gstType === "inclusive"
                  ? "border-blue-600 bg-white dark:bg-gray-800 shadow-sm"
                  : "border-gray-200 dark:border-gray-700/80 hover:border-gray-300 bg-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  Inclusive GST
                </span>
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    gstType === "inclusive"
                      ? "border-blue-600 bg-blue-600"
                      : "border-gray-300"
                  }`}
                >
                  {gstType === "inclusive" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Course price already contains GST. Tax is extracted for invoicing.
              </p>
              <div className="mt-2 text-[11px] font-mono text-blue-600 dark:text-blue-400">
                Student pays: Price (GST included)
              </div>
            </div>
          </div>
        </div>

        {/* GST Rate Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            GST Percentage (%)
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            {GST_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() =>
                  setFormData((prev: any) => ({ ...prev, gstRate: preset }))
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  gstRate === preset
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {preset}% {preset === 0 ? "(Exempt)" : ""}
              </button>
            ))}

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-gray-500">Custom:</span>
              <div className="relative w-24">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.gstRate ?? 18}
                  onChange={(e) => {
                    const val = Math.max(
                      0,
                      Math.min(100, parseFloat(e.target.value) || 0)
                    );
                    setFormData((prev: any) => ({ ...prev, gstRate: val }));
                  }}
                  className="w-full pl-3 pr-6 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-bold text-gray-900 dark:text-gray-100"
                />
                <span className="absolute right-2 top-1.5 text-xs text-gray-400">
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Gateway Charges Card */}
      <div className="bg-gray-50/70 dark:bg-gray-900/40 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Payment Gateway Charges
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Set transaction fee percentage and decide if collected from student
              </p>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={Boolean(formData.overridePaymentGatewayFee)}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  overridePaymentGatewayFee: e.target.checked,
                }))
              }
              className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
            />
            <span>Customize fee for this course</span>
          </label>
        </div>

        {/* Fee Rate Presets */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Gateway Fee Rate (%)
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            {PG_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() =>
                  setFormData((prev: any) => ({
                    ...prev,
                    paymentGatewayFeeRate: preset,
                  }))
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  pgFeeRate === preset
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {preset}%
              </button>
            ))}

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-gray-500">Custom:</span>
              <div className="relative w-24">
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  value={formData.paymentGatewayFeeRate ?? 2}
                  onChange={(e) => {
                    const val = Math.max(
                      0,
                      Math.min(20, parseFloat(e.target.value) || 0)
                    );
                    setFormData((prev: any) => ({
                      ...prev,
                      paymentGatewayFeeRate: val,
                    }));
                  }}
                  className="w-full pl-3 pr-6 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-bold text-gray-900 dark:text-gray-100"
                />
                <span className="absolute right-2 top-1.5 text-xs text-gray-400">
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Collect From Student Toggle */}
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Collect Payment Gateway Fee from Student
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  collectPgFee
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {collectPgFee ? "Student Pays" : "Academy Absorbs"}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {collectPgFee
                ? "Fee will be added as a transparent line item at checkout and invoice."
                : "Fee is absorbed by the academy from course payout."}
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              checked={collectPgFee}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  collectPaymentGatewayFeeFromStudent: e.target.checked,
                }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>
      </div>

      {/* Live Real-time Price Breakdown Preview Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-6 shadow-lg border border-indigo-900/50 space-y-4">
        <div className="flex items-center justify-between border-b border-indigo-800/60 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-400" />
            <h4 className="font-bold text-sm tracking-wide text-white">
              Live Checkout Breakdown Preview
            </h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase">
            Auto-calculated
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="block text-slate-400 text-[11px] mb-0.5">Base Price (excl. GST)</span>
            <span className="font-mono font-bold text-sm text-white">
              ₹{breakdown.basePrice.toFixed(2)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="block text-slate-400 text-[11px] mb-0.5">
              GST ({gstRate}% {gstType})
            </span>
            <span className="font-mono font-bold text-sm text-blue-300">
              ₹{breakdown.gstAmount.toFixed(2)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="block text-slate-400 text-[11px] mb-0.5">Gateway Fee ({pgFeeRate}%)</span>
            <span className="font-mono font-bold text-sm text-purple-300">
              {collectPgFee ? `₹${breakdown.studentPg.toFixed(2)}` : "₹0.00 (Waived)"}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/10 border border-emerald-400/30">
            <span className="block text-emerald-300 text-[11px] font-bold mb-0.5 uppercase tracking-wider">
              Student Pays
            </span>
            <span className="font-mono font-extrabold text-lg text-emerald-400">
              ₹{breakdown.grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
          <span className="text-slate-400">Platform Estimated Net Payout:</span>
          <span className="font-mono font-bold text-emerald-300">
            ₹{breakdown.academyPayout.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
