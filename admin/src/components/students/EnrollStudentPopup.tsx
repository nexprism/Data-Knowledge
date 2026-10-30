import React, { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { enrollStudent, fetchAllStudents } from "../../store/slices/students";
import { fetchCourses } from "../../store/slices/course";
import { X, Search } from "lucide-react";
import axiosInstance from "../../services/axiosConfig";

interface EnrollStudentPopupProps {
  open: boolean;
  onClose: () => void;
  studentId?: string;
}

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "https://api.dataknowledge.in").replace(/\/+$/, '');

const EnrollStudentPopup: React.FC<EnrollStudentPopupProps> = ({ open, onClose, studentId }) => {
  const dispatch = useAppDispatch<any>();
  const { loading } = useAppSelector((state: any) => state.students);
  const courseState = useAppSelector((state: any) => state.course);

  const [selectedStudent, setSelectedStudent] = useState(studentId || "");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [accessExpiry, setAccessExpiry] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [addToRevenue, setAddToRevenue] = useState(true);

  // Student dropdown search state
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentOptions, setStudentOptions] = useState<any[]>([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const courseSearchTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      dispatch(fetchCourses({ page: 1, limit: 20 }));
      setSelectedStudent(studentId || "");
      setSelectedCourse("");
      setSubmitted(false);
      setLocalError(null);
      setSuccess(false);
      setAccessExpiry("");
      setCustomPrice("");
      setAddToRevenue(true);
      setStudentSearch("");
      setStudentOptions([]);
    }
  }, [open, dispatch, studentId]);

  // Fetch students for dropdown (debounced, server-side search)
  useEffect(() => {
    if (!open) return;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    setStudentLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (studentSearch) params.append("search", studentSearch);
        params.append("sort", JSON.stringify({ createdAt: "desc" }));
        params.append("page", "1");
        params.append("limit", "20");
        const res = await axiosInstance.get(
          `${API_BASE_URL}/students?${params.toString()}`
        );
        setStudentOptions(res.data?.data?.students || []);
      } catch {
        setStudentOptions([]);
      } finally {
        setStudentLoading(false);
      }
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [studentSearch, open]);

  useEffect(() => {
    if (!open) return;
    if (courseSearchTimeout.current) clearTimeout(courseSearchTimeout.current);
    courseSearchTimeout.current = setTimeout(() => {
      dispatch(
        fetchCourses({
          page: 1,
          limit: 20,
          search: courseSearch.trim() || undefined,
        })
      );
    }, 400);
    return () => {
      if (courseSearchTimeout.current) clearTimeout(courseSearchTimeout.current);
    };
  }, [courseSearch, open, dispatch]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!studentDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStudentDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [studentDropdownOpen]);

  // Use courses from redux state
  const courses = courseState?.data?.courses || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setLocalError(null);
    setSuccess(false);
    if (!selectedStudent || !selectedCourse) {
      setLocalError("Please select both a student and a course.");
      return;
    }
    try {
      const result = await dispatch(
        enrollStudent({
          userId: selectedStudent,
          courseId: selectedCourse,
          accessExpiry: accessExpiry ? new Date(accessExpiry).toISOString() : undefined,
          customPrice: customPrice ? Number(customPrice) : undefined,
          addToRevenue,
        })
      );
      if (result.meta.requestStatus === "fulfilled") {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
        window.location.reload();
      } else {
        setLocalError(result.payload || "Failed to enroll student.");
      }
    } catch (err: any) {
      setLocalError(err.message || "Failed to enroll student.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md relative transform transition-all duration-300 scale-100 animate-in zoom-in-90">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
          onClick={onClose}
          disabled={loading}
          aria-label="Close popup"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white tracking-tight">
            Enroll a Student
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Student Dropdown with Search */}
            <div className="space-y-2">
              <label
                htmlFor="student-select"
                className="text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Student
              </label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  className={`w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-left flex justify-between items-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 ${!!studentId || loading ? "opacity-60 cursor-not-allowed" : ""}`}
                  onClick={() => {
                    if (!studentId && !loading) setStudentDropdownOpen((v) => !v);
                  }}
                  disabled={!!studentId || loading}
                  aria-haspopup="listbox"
                  aria-expanded={studentDropdownOpen}
                >
                  {selectedStudent
                    ? studentOptions.find((s) => s._id === selectedStudent)?.fullName ||
                      studentOptions.find((s) => s._id === selectedStudent)?.name ||
                      "Selected Student"
                    : "Select a student"}
                  <span className="ml-2">&#9662;</span>
                </button>
                {studentDropdownOpen && (
                  <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto animate-in fade-in">
                    <div className="sticky top-0 bg-white dark:bg-gray-700 px-2 py-2 border-b border-gray-100 dark:border-gray-600">
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          autoFocus
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          placeholder="Search student..."
                          className="w-full bg-transparent outline-none text-gray-900 dark:text-gray-100"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    {studentLoading ? (
                      <div className="p-3 text-center text-gray-500 text-sm">Loading...</div>
                    ) : studentOptions.length === 0 ? (
                      <div className="p-3 text-center text-gray-500 text-sm">No students found.</div>
                    ) : (
                      studentOptions.map((s: any) => (
                        <div
                          key={s._id}
                          className={`px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-600 ${selectedStudent === s._id ? "bg-blue-100 dark:bg-gray-800" : ""}`}
                          onClick={() => {
                            setSelectedStudent(s._id);
                            setStudentDropdownOpen(false);
                          }}
                        >
                          {s.fullName || s.name} ({s.email})
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="course-select"
                className="text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Course
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="w-full pl-9 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>
              <select
                id="course-select"
                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                required
                disabled={loading}
                aria-describedby={localError && submitted ? "course-error" : undefined}
              >
                <option value="">Select a course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Access Expiry (optional)
              </label>
              <input
                type="date"
                value={accessExpiry}
                onChange={(e) => setAccessExpiry(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Custom Price (optional)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                placeholder="e.g. 99.99"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={addToRevenue}
                onChange={(e) => setAddToRevenue(e.target.checked)}
                id="add-to-revenue"
              />
              <label
                htmlFor="add-to-revenue"
                className="text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Add to Revenue
              </label>
            </div>
            {localError && submitted && (
              <div
                id="error-message"
                className="bg-red-50 text-red-700 rounded-lg p-3 text-sm animate-in fade-in"
                role="alert"
              >
                {localError}
              </div>
            )}
            {success && (
              <div
                id="success-message"
                className="bg-green-50 text-green-700 rounded-lg p-3 text-sm animate-in fade-in"
                role="status"
              >
                Student enrolled successfully!
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}
                Enroll
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnrollStudentPopup;