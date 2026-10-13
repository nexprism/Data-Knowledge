import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { fetchAdminBookings, ConsultationBooking } from "../../store/slices/consultationSlice";

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");

const ConsultationBookings = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { bookings, loading, error } = useSelector((state: RootState) => state.consultation);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "free" | "paid">("all");
  const [selectedBooking, setSelectedBooking] = useState<ConsultationBooking | null>(null);

  useEffect(() => {
    dispatch(fetchAdminBookings());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchAdminBookings());
  };

  const filteredBookings = (bookings || []).filter((b) => {
    const matchesSearch =
      (b.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.userId?.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.department || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.institute || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.query || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ? true : b.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalBookings = bookings?.length || 0;
  const freeBookings = bookings?.filter((b) => b.paymentStatus === "free").length || 0;
  const paidBookings = bookings?.filter((b) => b.paymentStatus === "paid").length || 0;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <span>Consultation Bookings</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-semibold">
              DARC Helpline
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review and manage all candidate 1-on-1 consultation appointments
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-boxdark border border-stroke dark:border-strokedark text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-meta-4 transition shadow-xs"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={loading ? "animate-spin text-primary" : ""}
          >
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span>{loading ? "Refreshing..." : "Refresh Records"}</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-boxdark shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Bookings</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalBookings}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-boxdark shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Free 15-Min Sessions</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{freeBookings}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 3h12" />
              <path d="M6 8h12" />
              <path d="m6 13 8.5 8" />
              <path d="M6 13h3" />
              <path d="M9 13c6.667 0 6.667-10 0-10" />
            </svg>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-boxdark shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Paid 30-Min Consultations</p>
            <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{paidBookings}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by candidate name, email, department, institute..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg text-sm text-gray-800 dark:text-white focus:outline-none focus:border-primary transition"
          />
        </div>

        <div className="flex bg-gray-100 dark:bg-meta-4 p-1 rounded-lg">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              statusFilter === "all"
                ? "bg-white dark:bg-boxdark text-primary shadow-2xs font-bold"
                : "text-gray-600 dark:text-gray-300"
            }`}
          >
            All ({totalBookings})
          </button>
          <button
            onClick={() => setStatusFilter("free")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              statusFilter === "free"
                ? "bg-white dark:bg-boxdark text-emerald-600 shadow-2xs font-bold"
                : "text-gray-600 dark:text-gray-300"
            }`}
          >
            Free ({freeBookings})
          </button>
          <button
            onClick={() => setStatusFilter("paid")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              statusFilter === "paid"
                ? "bg-white dark:bg-boxdark text-indigo-600 shadow-2xs font-bold"
                : "text-gray-600 dark:text-gray-300"
            }`}
          >
            Paid ({paidBookings})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-boxdark shadow-default overflow-hidden">
        {error && <div className="p-4 bg-red-50 text-red-600 text-sm border-b border-red-100">{error}</div>}

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-meta-4 text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider font-semibold border-b border-stroke dark:border-strokedark">
                <th className="py-3.5 px-4">Candidate Details</th>
                <th className="py-3.5 px-4">Appointment Slot</th>
                <th className="py-3.5 px-4">Institute & Dept</th>
                <th className="py-3.5 px-4">Query / Synopsis</th>
                <th className="py-3.5 px-4">Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-strokedark text-sm">
              {filteredBookings.map((booking) => {
                const startTime = booking.slotId?.startTime ? new Date(booking.slotId.startTime) : null;
                const endTime = booking.slotId?.endTime ? new Date(booking.slotId.endTime) : null;

                return (
                  <tr key={booking._id} className="hover:bg-gray-50/70 dark:hover:bg-meta-4/40 transition">
                    <td className="py-4 px-4">
                      <p className="font-semibold text-gray-900 dark:text-white">{booking.fullName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{booking.userId?.email || "No Email"}</p>
                      {booking.userId?.phone && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">📞 {booking.userId.phone}</p>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {startTime ? (
                        <>
                          <p className="font-medium text-gray-900 dark:text-white text-xs">
                            {startTime.toLocaleDateString(undefined, {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                            {endTime?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                            {booking.slotId?.duration || 15} Min Session
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Slot detail unavailable</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-xs">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{booking.institute}</p>
                      <p className="text-gray-500 dark:text-gray-400 mt-0.5">{booking.department}</p>
                      <p className="text-gray-400 dark:text-gray-500 text-[11px] mt-0.5">Desig: {booking.designation}</p>
                    </td>

                    <td className="py-4 px-4 text-xs max-w-xs">
                      <p className="text-gray-700 dark:text-gray-300 truncate" title={booking.query}>
                        {booking.query}
                      </p>
                      {booking.fileUpload && (
                        <a
                          href={`${API_BASE_URL}/uploads/${booking.fileUpload}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1 text-primary hover:underline text-xs font-semibold"
                        >
                          <span>📄 Download Attachment</span>
                        </a>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-col items-start gap-2">
                        <span
                          className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                            booking.paymentStatus === "paid"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-300"
                              : booking.paymentStatus === "free"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                          }`}
                        >
                          {booking.paymentStatus?.toUpperCase()}
                        </span>
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="text-xs text-primary hover:underline font-semibold"
                        >
                          View Details →
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredBookings.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">
                    {searchTerm ? "No consultation bookings matching your search." : "No consultation bookings found yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="relative w-full max-w-lg bg-white dark:bg-boxdark rounded-2xl shadow-2xl border border-stroke dark:border-strokedark p-6 space-y-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stroke dark:border-strokedark pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Consultation Details</h3>
                <p className="text-xs text-gray-500">ID: {selectedBooking._id}</p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center text-gray-600 hover:text-gray-900 dark:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 dark:bg-meta-4">
                <div>
                  <span className="text-gray-500 font-medium block">Candidate Name:</span>
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{selectedBooking.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium block">User Email:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedBooking.userId?.email || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium block">Designation:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedBooking.designation}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium block">Department:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedBooking.department}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 font-medium block">Institution / Organization:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{selectedBooking.institute}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <span className="text-blue-800 dark:text-blue-300 font-bold block mb-1">Appointment Slot:</span>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {selectedBooking.slotId?.startTime
                    ? new Date(selectedBooking.slotId.startTime).toLocaleString(undefined, {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </p>
                <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                  Duration: {selectedBooking.slotId?.duration || 15} Mins • Payment: {selectedBooking.paymentStatus.toUpperCase()}
                  {selectedBooking.paymentId ? ` • Payment ID: ${selectedBooking.paymentId}` : ""}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-gray-700 dark:text-gray-300 font-bold block">Candidate Query / Requirements:</span>
                <p className="p-3 rounded-xl bg-gray-50 dark:bg-meta-4 text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                  {selectedBooking.query}
                </p>
              </div>

              {selectedBooking.fileUpload && (
                <div className="pt-2">
                  <a
                    href={`${API_BASE_URL}/uploads/${selectedBooking.fileUpload}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-primary text-white font-bold text-center block hover:bg-opacity-90 transition shadow-sm"
                  >
                    📄 Download Uploaded Document / Synopsis
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-stroke dark:border-strokedark flex justify-end">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2 rounded-lg bg-gray-100 dark:bg-meta-4 text-gray-700 dark:text-gray-200 font-bold text-xs hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationBookings;
