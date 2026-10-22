import React, { useEffect, useState, useMemo } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import axiosInstance from "../../services/axiosConfig";
import {
  Percent,
  CreditCard,
  Building2,
  Calculator,
  Save,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Info,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

interface TaxSettings {
  gstRate: number; // decimal e.g. 0.18
  gstRatePercent: number; // e.g. 18
  gstType: "inclusive" | "exclusive";
  paymentGatewayFeeRate: number; // decimal e.g. 0.02
  paymentGatewayFeeRatePercent: number; // e.g. 2
  collectPaymentGatewayFeeFromStudent: boolean;
  companyName: string;
  companyGstNumber: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  otherChargesRate: number;
  otherChargesLabel: string;
}

const GST_PRESETS = [0, 5, 12, 18, 28];
const PG_FEE_PRESETS = [0, 1.5, 2, 2.5, 3];

export default function TaxPaymentSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState<TaxSettings>({
    gstRate: 0.18,
    gstRatePercent: 18,
    gstType: "exclusive",
    paymentGatewayFeeRate: 0.02,
    paymentGatewayFeeRatePercent: 2,
    collectPaymentGatewayFeeFromStudent: false,
    companyName: "Data Knowledge",
    companyGstNumber: "",
    companyAddress: "",
    companyEmail: "support@dataknowledge.in",
    companyPhone: "",
    otherChargesRate: 0,
    otherChargesLabel: "",
  });

  // Sandbox preview state
  const [testPrice, setTestPrice] = useState<number>(1000);
  const [testDiscount, setTestDiscount] = useState<number>(0);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/settings/tax-payment");
      const d = res.data?.data || res.data?.settings || res.data;
      if (d) {
        setFormData({
          gstRate: d.gstRate !== undefined ? Number(d.gstRate) : 0.18,
          gstRatePercent:
            d.gstRatePercent !== undefined
              ? Number(d.gstRatePercent)
              : d.gstRate <= 1
              ? Math.round(Number(d.gstRate) * 100)
              : Number(d.gstRate),
          gstType: d.gstType === "inclusive" ? "inclusive" : "exclusive",
          paymentGatewayFeeRate:
            d.paymentGatewayFeeRate !== undefined
              ? Number(d.paymentGatewayFeeRate)
              : 0.02,
          paymentGatewayFeeRatePercent:
            d.paymentGatewayFeeRatePercent !== undefined
              ? Number(d.paymentGatewayFeeRatePercent)
              : d.paymentGatewayFeeRate <= 1
              ? Math.round(Number(d.paymentGatewayFeeRate) * 100)
              : Number(d.paymentGatewayFeeRate),
          collectPaymentGatewayFeeFromStudent: Boolean(
            d.collectPaymentGatewayFeeFromStudent
          ),
          companyName: d.companyName || "Data Knowledge",
          companyGstNumber: d.companyGstNumber || "",
          companyAddress: d.companyAddress || "",
          companyEmail: d.companyEmail || "support@dataknowledge.in",
          companyPhone: d.companyPhone || "",
          otherChargesRate: d.otherChargesRate || 0,
          otherChargesLabel: d.otherChargesLabel || "",
        });
      }
    } catch (err: any) {
      console.error("Error fetching tax and payment settings:", err);
      setStatusMessage({
        type: "error",
        text: err?.response?.data?.message || "Failed to load settings from server",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);
    try {
      const payload = {
        gstRate: formData.gstRatePercent / 100,
        gstType: formData.gstType,
        paymentGatewayFeeRate: formData.paymentGatewayFeeRatePercent / 100,
        collectPaymentGatewayFeeFromStudent:
          formData.collectPaymentGatewayFeeFromStudent,
        companyName: formData.companyName.trim(),
        companyGstNumber: formData.companyGstNumber.trim(),
        companyAddress: formData.companyAddress.trim(),
        companyEmail: formData.companyEmail.trim(),
        companyPhone: formData.companyPhone.trim(),
        otherChargesRate: formData.otherChargesRate,
        otherChargesLabel: formData.otherChargesLabel.trim(),
      };

      await axiosInstance.put("/settings/tax-payment", payload);
      setStatusMessage({
        type: "success",
        text: "GST & Payment Charges settings updated successfully!",
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      console.error("Error saving tax and payment settings:", err);
      setStatusMessage({
        type: "error",
        text:
          err?.response?.data?.message ||
          "Failed to update settings. Please check your network and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Real-time calculation preview
  const preview = useMemo(() => {
    const p = Math.max(0, testPrice || 0);
    const d = Math.min(p, Math.max(0, testDiscount || 0));
    const net = Math.max(0, p - d);
    const gstRateDec = (formData.gstRatePercent || 0) / 100;
    const pgRateDec = (formData.paymentGatewayFeeRatePercent || 0) / 100;

    let base = 0;
    let gst = 0;
    let courseWithTax = 0;

    if (formData.gstType === "inclusive") {
      base = net / (1 + gstRateDec);
      gst = net - base;
      courseWithTax = net;
    } else {
      base = net;
      gst = base * gstRateDec;
      courseWithTax = base + gst;
    }

    const calculatedPgFee = courseWithTax * pgRateDec;
    const studentPgFee = formData.collectPaymentGatewayFeeFromStudent
      ? calculatedPgFee
      : 0;
    const platformAbsorbedPgFee = formData.collectPaymentGatewayFeeFromStudent
      ? 0
      : calculatedPgFee;

    const grandTotal = courseWithTax + studentPgFee;
    const platformNetPayout = grandTotal - (formData.collectPaymentGatewayFeeFromStudent ? studentPgFee : platformAbsorbedPgFee);

    return {
      listedPrice: p,
      discount: d,
      netPrice: net,
      basePrice: Math.round(base * 100) / 100,
      gstAmount: Math.round(gst * 100) / 100,
      courseWithTax: Math.round(courseWithTax * 100) / 100,
      pgFee: Math.round(calculatedPgFee * 100) / 100,
      studentPgFee: Math.round(studentPgFee * 100) / 100,
      platformAbsorbedPgFee: Math.round(platformAbsorbedPgFee * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      platformNetPayout: Math.round(platformNetPayout * 100) / 100,
    };
  }, [testPrice, testDiscount, formData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Loading GST & Payment Charges settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="GST & Payment Charges Settings | Data Knowledge LMS"
        description="Configure default GST, calculation modes, payment gateway transaction charges, and invoice details"
      />

      <PageBreadcrumb pageTitle="GST & Payment Charges Settings" />

      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 md:p-8 text-white shadow-xl">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-3">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Tax Compliance & Financial Controls
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              GST &amp; Payment Charges Management
            </h1>
            <p className="mt-2 text-sm md:text-base text-blue-100/90 leading-relaxed">
              Define global tax rules, select between <strong>Inclusive GST</strong> and{" "}
              <strong>Exclusive GST</strong>, set payment gateway fee handling, and
              configure business details that appear on student invoices and receipts.
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border animate-in fade-in duration-200 ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            )}
            <span className="flex-1">{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs underline hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Configuration Columns (2 Cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Card 1: GST Calculation Mode & Rate */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-7 border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700/80 pb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    1. GST Calculation Mode &amp; Global Rate
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Determines how GST is computed when not overridden per-course
                  </p>
                </div>
              </div>

              {/* GST Mode Selection Cards */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  GST Calculation Mode *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Exclusive GST */}
                  <label
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      formData.gstType === "exclusive"
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500 shadow-xs"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                          Exclusive GST (Recommended)
                        </span>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          Course price is the base fee. GST percentage is added on
                          top at checkout.
                        </p>
                      </div>
                      <input
                        type="radio"
                        name="gstType"
                        value="exclusive"
                        checked={formData.gstType === "exclusive"}
                        onChange={() =>
                          setFormData((prev) => ({ ...prev, gstType: "exclusive" }))
                        }
                        className="mt-1 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 text-[11px] font-mono text-blue-700 dark:text-blue-300">
                      Formula: Final = Base Price + (Base × GST%)
                    </div>
                  </label>

                  {/* Inclusive GST */}
                  <label
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      formData.gstType === "inclusive"
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500 shadow-xs"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                          Inclusive GST
                        </span>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          Course price already includes GST. GST amount is reverse-calculated
                          from the price.
                        </p>
                      </div>
                      <input
                        type="radio"
                        name="gstType"
                        value="inclusive"
                        checked={formData.gstType === "inclusive"}
                        onChange={() =>
                          setFormData((prev) => ({ ...prev, gstType: "inclusive" }))
                        }
                        className="mt-1 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 text-[11px] font-mono text-blue-700 dark:text-blue-300">
                      Formula: Base = Price / (1 + GST%)
                    </div>
                  </label>
                </div>
              </div>

              {/* GST Rate Preset Buttons & Custom Input */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Default GST Rate (%) *
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Standard in India is 18% for educational/digital services
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5 items-center">
                  {GST_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          gstRatePercent: preset,
                          gstRate: preset / 100,
                        }))
                      }
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        formData.gstRatePercent === preset
                          ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {preset}% {preset === 0 ? "(Exempt)" : ""}
                    </button>
                  ))}

                  {/* Custom Input */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-xs text-gray-500">Custom:</span>
                    <div className="relative w-28">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.gstRatePercent}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                          setFormData((prev) => ({
                            ...prev,
                            gstRatePercent: val,
                            gstRate: val / 100,
                          }));
                        }}
                        className="w-full pl-3 pr-7 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-semibold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-2.5 top-2 text-xs font-bold text-gray-400">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Payment Gateway Charges */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-7 border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700/80 pb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    2. Payment Gateway Charges
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Configure standard payment processing fee and customer collection rules
                  </p>
                </div>
              </div>

              {/* Gateway Fee Percentage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Gateway Transaction Fee Rate (%) *
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Razorpay/Stripe standard is typically ~2%
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5 items-center">
                  {PG_FEE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentGatewayFeeRatePercent: preset,
                          paymentGatewayFeeRate: preset / 100,
                        }))
                      }
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        formData.paymentGatewayFeeRatePercent === preset
                          ? "bg-purple-600 text-white shadow-sm ring-2 ring-purple-600/30"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}

                  {/* Custom PG Rate Input */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-xs text-gray-500">Custom:</span>
                    <div className="relative w-28">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.1"
                        value={formData.paymentGatewayFeeRatePercent}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(20, parseFloat(e.target.value) || 0));
                          setFormData((prev) => ({
                            ...prev,
                            paymentGatewayFeeRatePercent: val,
                            paymentGatewayFeeRate: val / 100,
                          }));
                        }}
                        className="w-full pl-3 pr-7 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-semibold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="absolute right-2.5 top-2 text-xs font-bold text-gray-400">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Surcharge Toggle */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      Collect Payment Gateway Fee from Student
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        formData.collectPaymentGatewayFeeFromStudent
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                          : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {formData.collectPaymentGatewayFeeFromStudent
                        ? "Student Pays"
                        : "Platform Absorbs"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-lg">
                    {formData.collectPaymentGatewayFeeFromStudent
                      ? "The gateway charge will be added as a separate line item on the checkout screen and invoice."
                      : "The fee is absorbed by the academy. Student pays only the course base price (+ GST)."}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.collectPaymentGatewayFeeFromStudent}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        collectPaymentGatewayFeeFromStudent: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

            {/* Card 3: Business & Invoice Details */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-7 border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700/80 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    3. Business &amp; Official Invoice Details
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Printed automatically on generated PDF invoices and receipts for students
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Registered Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, companyName: e.target.value }))
                    }
                    placeholder="e.g. Data Knowledge Pvt Ltd"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Company GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    value={formData.companyGstNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        companyGstNumber: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-mono text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Registered Business Address
                  </label>
                  <textarea
                    rows={2}
                    value={formData.companyAddress}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        companyAddress: e.target.value,
                      }))
                    }
                    placeholder="e.g. Floor 3, Tech Hub, Connaught Place, New Delhi 110001"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Invoice Support Email
                  </label>
                  <input
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, companyEmail: e.target.value }))
                    }
                    placeholder="e.g. billing@dataknowledge.in"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Invoice Support Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.companyPhone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, companyPhone: e.target.value }))
                    }
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={fetchSettings}
                className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold text-sm transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Settings...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Global Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Live Interactive Calculator Preview (1 Col) */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm sticky top-24 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-gray-700 pb-3">
                <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                  Live Calculation Sandbox
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Simulate how checkout breakdown will calculate and display to students:
              </p>

              {/* Simulation Inputs */}
              <div className="space-y-3 p-3.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Sample Course Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={testPrice}
                    onChange={(e) => setTestPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 font-mono font-bold text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Coupon Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={testDiscount}
                    onChange={(e) => setTestDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 font-mono text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Itemized Calculation Result */}
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Listed Course Price</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                    ₹{preview.listedPrice.toFixed(2)}
                  </span>
                </div>

                {preview.discount > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Coupon Discount</span>
                    <span className="font-mono">-₹{preview.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    Course Base Price (excl. GST)
                  </span>
                  <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                    ₹{preview.basePrice.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    GST ({formData.gstRatePercent}%)
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      {formData.gstType}
                    </span>
                  </span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                    ₹{preview.gstAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    Payment Gateway Fee ({formData.paymentGatewayFeeRatePercent}%)
                  </span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                    {formData.collectPaymentGatewayFeeFromStudent ? (
                      `₹${preview.studentPgFee.toFixed(2)}`
                    ) : (
                      <span className="text-emerald-600 font-bold text-[11px]">
                        ₹0.00 (Waived)
                      </span>
                    )}
                  </span>
                </div>

                <div className="pt-3 border-t-2 border-gray-200 dark:border-gray-700 flex justify-between items-baseline">
                  <div>
                    <span className="block text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                      Student Pays
                    </span>
                    <span className="text-[10px] text-gray-400">Total charge amount</span>
                  </div>
                  <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 tracking-tight">
                    ₹{preview.grandTotal.toFixed(2)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                    <span>Gateway Fee Absorbed:</span>
                    <span className="font-mono">
                      ₹{preview.platformAbsorbedPgFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-gray-800 dark:text-gray-200">
                    <span>Academy Payout:</span>
                    <span className="font-mono text-emerald-600">
                      ₹{preview.platformNetPayout.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Note on Course-Level Overrides */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700/80">
                <div className="flex items-start gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>
                    Each course can optionally override these global defaults in its own{" "}
                    <strong>Pricing tab</strong>.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
