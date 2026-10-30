import React from 'react'
import { createPortal } from 'react-dom'
import { getApiBaseUrl, getImageBaseUrl } from '../../utils/apiConfig'

const ReceiptModal = ({ isOpen, onClose, enrollment, user }) => {
  if (!isOpen || !enrollment) return null

  const baseUrl = getApiBaseUrl()
  const imageBaseUrl = getImageBaseUrl()

  const order = enrollment.order || {}
  const receiptNo = order.orderNo
    ? `INV-${order.orderNo}`
    : `DK-REC-${enrollment._id?.slice(-8).toUpperCase() || '0000'}`

  const purchaseDate = enrollment.enrolledAt
    ? new Date(enrollment.enrolledAt).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })
    : 'N/A'

  const courseTitle =
    enrollment.course?.title ||
    enrollment.courseBundle?.title ||
    enrollment.coursePlan?.name ||
    'Course Enrollment'

  const pricePaid =
    enrollment.pricePaid !== undefined
      ? enrollment.pricePaid
      : order.grandTotal !== undefined
      ? order.grandTotal
      : 0

  const subTotal = order.subTotal !== undefined ? order.subTotal : pricePaid
  const discount = order.discount || 0
  const invoicePdfUrl = order.invoice_url
    ? order.invoice_url.startsWith('http')
      ? order.invoice_url
      : `${imageBaseUrl}/uploads/invoices/${order.invoice_url.replace(/^\/+/, '')}`
    : null

  const handlePrint = () => {
    window.print()
  }

  return createPortal(
    <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible !important;
          }
          #printable-receipt {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 30px !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: #0f172a !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm bg-slate-900/60 animate-in fade-in duration-300 no-print"
        onClick={onClose}
      />

      {/* Modal Dialog Container */}
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Modal Top Control Bar (Screen only) */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80 no-print">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-jetbrains text-[10px] uppercase font-bold text-slate-600 tracking-widest">Official Receipt</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Printable Receipt Content */}
        <div className="p-4 sm:p-8 md:p-10 overflow-y-auto" id="printable-receipt">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-200 pb-8">
            <div className="flex items-center gap-3.5">
              <img
                src="/data_knowlege/logo/logo.png"
                alt="Data Knowledge Logo"
                className="h-12 w-auto object-contain rounded-xl shadow-xs"
              />
              <div>
                <h2 className="font-outfit font-black text-xl text-slate-900 tracking-tight leading-none">
                  DATA <span className="text-[#3498db]">KNOWLEDGE</span>
                </h2>
                <p className="font-jetbrains text-[9px] uppercase tracking-widest text-slate-500 mt-1 font-bold">
                  Practical Learning Ecosystem
                </p>
                <p className="font-jetbrains text-[8px] text-slate-400">www.dataknowledge.in</p>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="font-jetbrains text-[9px] font-black uppercase tracking-[0.25em] bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
                PAID & VERIFIED
              </span>
              <p className="font-jetbrains text-base font-black text-slate-900 mt-2 tracking-tight">
                {receiptNo}
              </p>
              <p className="font-jetbrains text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                Date: {purchaseDate}
              </p>
            </div>
          </div>

          {/* Customer & Transaction Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-100">
            <div>
              <p className="font-jetbrains text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">
                Billed To
              </p>
              <p className="font-inter text-base font-bold text-slate-900">
                {user?.fullName || enrollment.userId?.fullName || 'Student'}
              </p>
              <p className="font-jetbrains text-xs text-slate-600 mt-0.5">
                {user?.email || enrollment.userId?.email || 'N/A'}
              </p>
              {user?.phone && (
                <p className="font-jetbrains text-xs text-slate-500 mt-0.5">
                  Phone: {user.phone}
                </p>
              )}
            </div>

            <div className="sm:text-right">
              <p className="font-jetbrains text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">
                Transaction Details
              </p>
              <p className="font-jetbrains text-xs font-semibold text-slate-800">
                Enrollment ID: #{enrollment._id?.slice(-8).toUpperCase() || 'N/A'}
              </p>
              <p className="font-jetbrains text-xs text-slate-500 mt-0.5">
                Type: {enrollment.type ? enrollment.type.toUpperCase() : 'COURSE ACCESS'}
              </p>
              <p className="font-jetbrains text-xs text-slate-500 mt-0.5">
                Access Status: {enrollment.status?.toUpperCase() || 'ACTIVE'}
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-6 border-b border-slate-200 overflow-x-auto -mx-2 px-2">
            <table className="w-full min-w-[280px] text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="font-jetbrains text-[10px] font-bold uppercase tracking-wider text-slate-500 pb-3">Item Description</th>
                  <th className="font-jetbrains text-[10px] font-bold uppercase tracking-wider text-slate-500 pb-3 text-center">Type</th>
                  <th className="font-jetbrains text-[10px] font-bold uppercase tracking-wider text-slate-500 pb-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-4 pr-4">
                    <p className="font-inter font-bold text-slate-900 text-sm">{courseTitle}</p>
                    <p className="font-jetbrains text-[10px] text-slate-500 mt-0.5">Full access to learning resources, modules & assignments</p>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <span className="font-jetbrains text-[10px] font-semibold uppercase text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                      Digital Course
                    </span>
                  </td>
                  <td className="py-4 pl-4 text-right font-jetbrains font-bold text-slate-900 text-sm">
                    {subTotal > 0 ? `₹${subTotal.toLocaleString()}` : 'FREE'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="flex justify-end py-6">
            <div className="w-full max-w-sm space-y-2.5">
              <div className="flex justify-between text-xs font-jetbrains text-slate-600">
                <span>Course Base Price</span>
                <span>
                  {order.pricingBreakdown?.basePrice != null
                    ? `₹${Number(order.pricingBreakdown.basePrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                    : order.basePrice != null
                    ? `₹${Number(order.basePrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                    : subTotal > 0
                    ? `₹${Number(subTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                    : '₹0.00'}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-xs font-jetbrains text-emerald-700">
                  <span>Discount Applied</span>
                  <span>-₹{Number(discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {/* GST breakdown */}
              <div className="flex justify-between text-xs font-jetbrains text-slate-600 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <span>
                    GST ({order.pricingBreakdown?.gstRate != null
                      ? (Number(order.pricingBreakdown.gstRate) > 1 ? Number(order.pricingBreakdown.gstRate) : Number(order.pricingBreakdown.gstRate) * 100).toFixed(0)
                      : order.gstRate
                      ? (Number(order.gstRate) > 1 ? Number(order.gstRate) : Number(order.gstRate) * 100).toFixed(0)
                      : '18'}%)
                  </span>
                  {(order.pricingBreakdown?.gstType === 'inclusive' || order.gstType === 'inclusive') && (
                    <span className="text-[9px] text-teal-700 bg-teal-50 border border-teal-200 px-1 py-0.2 rounded font-semibold uppercase">
                      Inclusive
                    </span>
                  )}
                </span>
                <span>
                  {order.pricingBreakdown?.gstAmount != null
                    ? (order.pricingBreakdown?.gstType === 'inclusive'
                        ? `₹${Number(order.pricingBreakdown.gstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} (Inc)`
                        : `+₹${Number(order.pricingBreakdown.gstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`)
                    : order.gstAmount != null
                    ? (order.gstType === 'inclusive'
                        ? `₹${Number(order.gstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} (Inc)`
                        : `+₹${Number(order.gstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`)
                    : 'Included'}
                </span>
              </div>

              {/* Payment Gateway Fee breakdown */}
              {(order.pricingBreakdown?.paymentGatewayFee != null || order.paymentGatewayFee != null) && (
                <div className="flex justify-between text-xs font-jetbrains text-slate-600">
                  <span>Payment Gateway Fee</span>
                  <span>
                    {(order.pricingBreakdown?.collectPaymentGatewayFeeFromStudent ?? order.collectGatewayFeeFromStudent)
                      ? `+₹${Number(order.pricingBreakdown?.paymentGatewayFee ?? order.paymentGatewayFee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                      : '₹0.00 (Waived)'}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-base font-jetbrains font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Paid</span>
                <span className="text-amber-800">{pricePaid > 0 ? `₹${Number(pricePaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'FREE'}</span>
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="pt-6 border-t border-slate-100 text-center space-y-1">
            <p className="font-jetbrains text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
              Thank you for learning with Data Knowledge!
            </p>
            <p className="font-jetbrains text-[9px] text-slate-400">
              This is a valid, system-generated payment confirmation. For support or invoice inquiries, contact support@dataknowledge.in
            </p>
          </div>
        </div>

        {/* Modal Actions (Screen only) */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end items-center gap-3 no-print">
          {invoicePdfUrl && (
            <a
              href={invoicePdfUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-jetbrains text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download PDF</span>
            </a>
          )}
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-accent hover:brightness-105 active:scale-95 text-slate-950 font-jetbrains text-xs font-black uppercase tracking-wider transition-all shadow-accent-soft flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Print / Save PDF</span>
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-slate-300 hover:bg-slate-200 text-slate-700 font-jetbrains text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ReceiptModal
