import React, { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, X, Check, Percent, CreditCard, ShieldCheck, ArrowRight, HelpCircle } from "lucide-react";

export interface PlanItem {
  _id?: string;
  name: string;
  price: string;
  salePrice: string;
  description: string;
  durationType: string;
  duration: string;
  status: string;
  overrideGst?: boolean;
  gstType?: string;
  gstRate?: number | string;
  overridePaymentGatewayFee?: boolean;
  paymentGatewayFeeRate?: number | string;
  collectPaymentGatewayFeeFromStudent?: boolean;
}

interface CoursePlansManagerProps {
  plans: PlanItem[];
  setPlans: React.Dispatch<React.SetStateAction<PlanItem[]>>;
  courseGstType?: string;
  courseGstRate?: number | string;
  coursePgRate?: number | string;
  courseCollectPg?: boolean;
}

const GST_PRESETS = [0, 5, 12, 18, 28];
const PG_PRESETS = [0, 1.5, 2, 2.5, 3];

const round2 = (v: number) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
const normalizeRate = (rate: any, defaultVal = 0) => {
  if (rate === undefined || rate === null || isNaN(Number(rate))) return defaultVal;
  const num = Number(rate);
  return num > 1 ? num / 100 : num;
};

export default function CoursePlansManager({
  plans,
  setPlans,
  courseGstType = "exclusive",
  courseGstRate = 18,
  coursePgRate = 2,
  courseCollectPg = false,
}: CoursePlansManagerProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [error, setError] = useState("");

  const defaultForm: PlanItem = {
    name: "",
    price: "",
    salePrice: "",
    description: "",
    durationType: "Month",
    duration: "1",
    status: "active",
    overrideGst: false,
    gstType: courseGstType || "exclusive",
    gstRate: courseGstRate !== undefined ? courseGstRate : 18,
    overridePaymentGatewayFee: false,
    paymentGatewayFeeRate: coursePgRate !== undefined ? coursePgRate : 2,
    collectPaymentGatewayFeeFromStudent: Boolean(courseCollectPg),
  };

  const [form, setForm] = useState<PlanItem>(defaultForm);

  // Live calculation for the active plan form
  const planBreakdown = useMemo(() => {
    const rawPrice = parseFloat(form.salePrice || form.price || "0") || 0;
    const effectiveGstType = form.overrideGst ? (form.gstType || "exclusive") : (courseGstType || "exclusive");
    const effectiveGstRate = form.overrideGst && form.gstRate !== undefined ? form.gstRate : courseGstRate;
    const effectivePgRate = form.overridePaymentGatewayFee && form.paymentGatewayFeeRate !== undefined ? form.paymentGatewayFeeRate : coursePgRate;
    const effectiveCollectPg = form.overridePaymentGatewayFee ? Boolean(form.collectPaymentGatewayFeeFromStudent) : Boolean(courseCollectPg);

    const rGst = normalizeRate(effectiveGstRate, 0.18);
    const isInclusive = effectiveGstType === "inclusive";

    let base = 0;
    let gstAmt = 0;
    if (isInclusive) {
      base = rGst > 0 ? round2(rawPrice / (1 + rGst)) : rawPrice;
      gstAmt = round2(rawPrice - base);
    } else {
      base = rawPrice;
      gstAmt = round2(rawPrice * rGst);
    }

    const subWithTax = isInclusive ? rawPrice : round2(rawPrice + gstAmt);
    const rPg = normalizeRate(effectivePgRate, 0.02);
    const pgFee = round2(subWithTax * rPg);
    const pgCharged = effectiveCollectPg ? pgFee : 0;
    const grandTotal = round2(subWithTax + pgCharged);

    return {
      rawPrice,
      base,
      gstAmt,
      effectiveGstType,
      gstRatePercent: Math.round(rGst * 10000) / 100,
      pgFee,
      effectiveCollectPg,
      pgRatePercent: Math.round(rPg * 10000) / 100,
      grandTotal,
    };
  }, [form, courseGstType, courseGstRate, coursePgRate, courseCollectPg]);

  const handleAddOrUpdate = () => {
    if (!form.name.trim()) {
      setError("Plan Name is required");
      return;
    }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) {
      setError("Valid Price is required");
      return;
    }
    if (!form.duration || isNaN(Number(form.duration)) || Number(form.duration) <= 0) {
      setError("Duration must be a positive number");
      return;
    }

    const cleaned: PlanItem = {
      ...form,
      name: form.name.trim(),
      price: String(form.price).trim(),
      salePrice: form.salePrice ? String(form.salePrice).trim() : "",
      description: form.description ? form.description.trim() : "",
      duration: String(form.duration).trim(),
      durationType: form.durationType || "Month",
      status: form.status || "active",
      overrideGst: Boolean(form.overrideGst),
      gstType: form.gstType || "exclusive",
      gstRate: form.gstRate !== undefined ? Number(form.gstRate) : 18,
      overridePaymentGatewayFee: Boolean(form.overridePaymentGatewayFee),
      paymentGatewayFeeRate: form.paymentGatewayFeeRate !== undefined ? Number(form.paymentGatewayFeeRate) : 2,
      collectPaymentGatewayFeeFromStudent: Boolean(form.collectPaymentGatewayFeeFromStudent),
    };

    if (editingIdx !== null) {
      setPlans((prev) =>
        prev.map((p, idx) => (idx === editingIdx ? { ...cleaned, _id: p._id || cleaned._id } : p))
      );
      setEditingIdx(null);
    } else {
      setPlans((prev) => [...prev, cleaned]);
    }

    setForm(defaultForm);
    setError("");
  };

  const handleEdit = (idx: number) => {
    setForm({
      ...plans[idx],
      overrideGst: Boolean(plans[idx].overrideGst),
      gstType: plans[idx].gstType || courseGstType || "exclusive",
      gstRate: plans[idx].gstRate !== undefined ? plans[idx].gstRate : courseGstRate,
      overridePaymentGatewayFee: Boolean(plans[idx].overridePaymentGatewayFee),
      paymentGatewayFeeRate: plans[idx].paymentGatewayFeeRate !== undefined ? plans[idx].paymentGatewayFeeRate : coursePgRate,
      collectPaymentGatewayFeeFromStudent: Boolean(plans[idx].collectPaymentGatewayFeeFromStudent ?? courseCollectPg),
    });
    setEditingIdx(idx);
    setError("");
  };

  const handleCancel = () => {
    setForm(defaultForm);
    setEditingIdx(null);
    setError("");
  };

  const handleRemove = (idx: number) => {
    setPlans((prev) => prev.filter((_, i) => i !== idx));
    if (editingIdx === idx) {
      handleCancel();
    } else if (editingIdx !== null && editingIdx > idx) {
      setEditingIdx(editingIdx - 1);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-md font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            Course Plan Options & Pricing Tiers
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Configure access duration plans (e.g. 1 Month, 1 Year, Lifetime) with independent or inherited GST and transaction charges.
          </p>
        </div>
        {editingIdx !== null && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            Editing Plan #{editingIdx + 1}
          </span>
        )}
      </div>

      {/* Plan Input Form Box */}
      <div className="bg-gray-50/70 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
        {/* Row 1: Name, Duration, Duration Type, Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Plan Name *
            </label>
            <input
              type="text"
              placeholder="e.g. 1 Year Access"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-gray-200 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Duration Number *
            </label>
            <input
              type="number"
              min="1"
              placeholder="1"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-gray-200 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Duration Period *
            </label>
            <select
              value={form.durationType}
              onChange={(e) => setForm({ ...form, durationType: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-gray-200 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="Month">Month(s)</option>
              <option value="Year">Year(s)</option>
              <option value="Day">Day(s)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Plan Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-gray-200 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Row 2: Price, Sale Price, Description */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Price (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 4999"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-gray-200 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sale Price (₹) (Optional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 3499"
              value={form.salePrice}
              onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-gray-200 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Short Description / Subtitle
            </label>
            <input
              type="text"
              placeholder="e.g. Most Popular - Full Access"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-gray-200 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Row 3: GST & Transaction Charges Customization Panel */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GST Section */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.overrideGst)}
                  onChange={(e) => setForm({ ...form, overrideGst: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Custom GST for this Plan
                </span>
              </label>

              {form.overrideGst ? (
                <div className="space-y-2.5 pl-6 pt-1 border-l-2 border-blue-500">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, gstType: "exclusive" })}
                      className={`px-2.5 py-1 text-xs rounded font-medium transition cursor-pointer ${
                        form.gstType !== "inclusive"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      Exclusive GST
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, gstType: "inclusive" })}
                      className={`px-2.5 py-1 text-xs rounded font-medium transition cursor-pointer ${
                        form.gstType === "inclusive"
                          ? "bg-teal-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      Inclusive GST
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {GST_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm({ ...form, gstRate: p })}
                        className={`px-2 py-0.5 text-xs rounded border transition cursor-pointer ${
                          Number(form.gstRate) === p
                            ? "bg-blue-100 border-blue-500 text-blue-800 font-bold dark:bg-blue-900/50 dark:text-blue-200"
                            : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {p}%
                      </button>
                    ))}
                    <div className="flex items-center gap-1 ml-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={form.gstRate ?? 18}
                        onChange={(e) => setForm({ ...form, gstRate: e.target.value })}
                        className="w-14 border rounded px-1.5 py-0.5 text-xs dark:bg-gray-700 dark:text-gray-200"
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 pl-6">
                  Inherits Course GST:{" "}
                  <strong className="text-gray-700 dark:text-gray-300">
                    {courseGstType === "inclusive" ? "Inclusive" : "Exclusive"} ({courseGstRate}%)
                  </strong>
                </p>
              )}
            </div>

            {/* Transaction Charges Section */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.overridePaymentGatewayFee)}
                  onChange={(e) => setForm({ ...form, overridePaymentGatewayFee: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Custom Transaction Fee for this Plan
                </span>
              </label>

              {form.overridePaymentGatewayFee ? (
                <div className="space-y-2.5 pl-6 pt-1 border-l-2 border-purple-500">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PG_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm({ ...form, paymentGatewayFeeRate: p })}
                        className={`px-2 py-0.5 text-xs rounded border transition cursor-pointer ${
                          Number(form.paymentGatewayFeeRate) === p
                            ? "bg-purple-100 border-purple-500 text-purple-800 font-bold dark:bg-purple-900/50 dark:text-purple-200"
                            : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {p}%
                      </button>
                    ))}
                    <div className="flex items-center gap-1 ml-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={form.paymentGatewayFeeRate ?? 2}
                        onChange={(e) => setForm({ ...form, paymentGatewayFeeRate: e.target.value })}
                        className="w-14 border rounded px-1.5 py-0.5 text-xs dark:bg-gray-700 dark:text-gray-200"
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={Boolean(form.collectPaymentGatewayFeeFromStudent)}
                      onChange={(e) => setForm({ ...form, collectPaymentGatewayFeeFromStudent: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                    />
                    <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                      Collect transaction fee from student (+₹{planBreakdown.pgFee})
                    </span>
                  </label>
                </div>
              ) : (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 pl-6">
                  Inherits Course Gateway Fee:{" "}
                  <strong className="text-gray-700 dark:text-gray-300">
                    {coursePgRate}% ({courseCollectPg ? "Collected from student" : "Platform absorbed"})
                  </strong>
                </p>
              )}
            </div>
          </div>

          {/* Live Price Preview Bar */}
          {planBreakdown.rawPrice > 0 && (
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between text-xs bg-slate-50 dark:bg-gray-900/40 p-2.5 rounded-lg">
              <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
                <span>
                  Base: <strong>₹{planBreakdown.base.toFixed(2)}</strong>
                </span>
                <span>•</span>
                <span>
                  GST ({planBreakdown.gstRatePercent}%):{" "}
                  <strong>
                    {planBreakdown.effectiveGstType === "inclusive" ? `₹${planBreakdown.gstAmt.toFixed(2)} (Inc)` : `+₹${planBreakdown.gstAmt.toFixed(2)}`}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  PG Fee ({planBreakdown.pgRatePercent}%):{" "}
                  <strong className={planBreakdown.effectiveCollectPg ? "text-purple-600" : "text-emerald-600"}>
                    {planBreakdown.effectiveCollectPg ? `+₹${planBreakdown.pgFee.toFixed(2)}` : "₹0.00 (Waived)"}
                  </strong>
                </span>
              </div>
              <div className="text-right">
                <span className="text-gray-500">Student Pays: </span>
                <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                  ₹{planBreakdown.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {error && <div className="text-xs text-red-600 font-medium">{error}</div>}

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAddOrUpdate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            {editingIdx !== null ? (
              <>
                <Check className="w-4 h-4" /> Update Plan
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Add Plan Option
              </>
            )}
          </button>
          {editingIdx !== null && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* Plans List Table */}
      {plans.length > 0 ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs uppercase tracking-wider">
                <th className="p-3 text-left font-semibold">Plan Name</th>
                <th className="p-3 text-left font-semibold">Duration</th>
                <th className="p-3 text-left font-semibold">Price / Sale</th>
                <th className="p-3 text-left font-semibold">GST Mode & Rate</th>
                <th className="p-3 text-left font-semibold">Gateway Charges</th>
                <th className="p-3 text-left font-semibold">Final Approx Total</th>
                <th className="p-3 text-center font-semibold">Status</th>
                <th className="p-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {plans.map((p, idx) => {
                const planPrice = parseFloat(p.salePrice || p.price || "0") || 0;
                const pGstType = p.overrideGst ? (p.gstType || "exclusive") : (courseGstType || "exclusive");
                const pGstRate = p.overrideGst && p.gstRate !== undefined ? Number(p.gstRate) : Number(courseGstRate);
                const rGst = normalizeRate(pGstRate, 0.18);
                const isInc = pGstType === "inclusive";
                const pBase = isInc && rGst > 0 ? round2(planPrice / (1 + rGst)) : planPrice;
                const pGstAmt = isInc ? round2(planPrice - pBase) : round2(pBase * rGst);
                const subWithTax = isInc ? planPrice : round2(planPrice + pGstAmt);

                const pPgRate = p.overridePaymentGatewayFee && p.paymentGatewayFeeRate !== undefined ? Number(p.paymentGatewayFeeRate) : Number(coursePgRate);
                const pCollect = p.overridePaymentGatewayFee ? Boolean(p.collectPaymentGatewayFeeFromStudent) : Boolean(courseCollectPg);
                const rPg = normalizeRate(pPgRate, 0.02);
                const pPgAmt = round2(subWithTax * rPg);
                const finalTot = round2(subWithTax + (pCollect ? pPgAmt : 0));

                return (
                  <tr
                    key={p._id || idx}
                    className={`transition-colors ${
                      idx === editingIdx
                        ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-500"
                        : "hover:bg-gray-50 dark:hover:bg-gray-750"
                    }`}
                  >
                    <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">
                      {p.name}
                      {p.description && (
                        <p className="text-[11px] text-gray-500 font-normal truncate max-w-xs">{p.description}</p>
                      )}
                    </td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">
                      {p.duration} {p.durationType}
                    </td>
                    <td className="p-3 text-gray-900 dark:text-gray-100">
                      {p.salePrice && Number(p.salePrice) > 0 ? (
                        <div>
                          <span className="font-bold text-emerald-600">₹{p.salePrice}</span>
                          <span className="text-xs text-gray-400 line-through ml-1.5">₹{p.price}</span>
                        </div>
                      ) : (
                        <span className="font-bold">₹{p.price}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                          isInc
                            ? "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/30 dark:text-teal-300"
                            : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                        }`}
                      >
                        {pGstRate}% {isInc ? "Inclusive" : "Exclusive"}
                        {p.overrideGst && <span className="text-[9px] font-bold text-amber-600">• custom</span>}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                          pCollect
                            ? "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300"
                        }`}
                      >
                        {pPgRate}% {pCollect ? "Charged to Student" : "Waived"}
                        {p.overridePaymentGatewayFee && <span className="text-[9px] font-bold text-amber-600">• custom</span>}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-extrabold text-blue-600 dark:text-blue-400">
                        ₹{finalTot.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          p.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {p.status || "active"}
                      </span>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleEdit(idx)}
                        className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded mr-1.5 transition cursor-pointer"
                        title="Edit Plan"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline mr-1" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(idx)}
                        className="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition cursor-pointer"
                        title="Remove Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 p-4 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-xs text-gray-500">
          No course plan tiers added yet. Fill in the form above and click "Add Plan Option".
        </div>
      )}
    </div>
  );
}
