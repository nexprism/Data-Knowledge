import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchAdmins,
  createAdmin,
  updateAdmin,
  setAdminStatus,
  resetAdminPassword,
  deleteAdmin,
  clearAdminUsersError,
  selectAdminUsers,
  selectAdminUsersLoading,
  selectAdminUsersSaving,
  selectAdminUsersError,
  selectAdminUsersMeta,
} from "../../store/slices/adminUsers";
import type { ManagedAdmin } from "../../store/slices/adminUsers";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PopupAlert from "../../components/popUpAlert";
import { Modal } from "../../components/ui/modal";
import axiosInstance from "../../services/axiosConfig";
import {
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  Power,
  PowerOff,
  Copy,
  Check,
  Search,
  ShieldCheck,
  Users,
  Lock,
} from "lucide-react";

const inputCls =
  "w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm";
const labelCls = "block text-sm font-semibold mb-1";

const roleLabel = (role: string) =>
  role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : role;

const formatDate = (value?: string) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "-";
  }
};

const AdminUsers: React.FC = () => {
  const dispatch = useAppDispatch();
  const admins = useAppSelector(selectAdminUsers);
  const loading = useAppSelector(selectAdminUsersLoading);
  const saving = useAppSelector(selectAdminUsersSaving);
  const error = useAppSelector(selectAdminUsersError);
  const meta = useAppSelector(selectAdminUsersMeta);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
  const [page, setPage] = useState(1);
  const limit = meta.limit || 20;

  const [popup, setPopup] = useState<{
    isVisible: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ isVisible: false, message: "", type: "info" });

  // Credentials reveal modal (shown once after create / reset)
  const [credentials, setCredentials] = useState<{
    open: boolean;
    email: string;
    password: string;
    generated: boolean;
    title: string;
  }>({ open: false, email: "", password: "", generated: false, title: "" });
  const [copied, setCopied] = useState(false);

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: "", email: "", password: "" });

  // Edit modal
  const [editTarget, setEditTarget] = useState<ManagedAdmin | null>(null);
  const [editForm, setEditForm] = useState({ fullName: "", email: "" });

  // Reset password modal
  const [resetTarget, setResetTarget] = useState<ManagedAdmin | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState("");

  // Change-my-own-password modal (available to the signed-in admin)
  const [isChangePwOpen, setIsChangePwOpen] = useState(false);
  const [changePwForm, setChangePwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPw, setChangingPw] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<ManagedAdmin | null>(null);

  // Debounce the search box
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    dispatch(
      fetchAdmins({
        page,
        limit,
        search: search || undefined,
        status: statusFilter || undefined,
      })
    );
  }, [dispatch, page, limit, search, statusFilter]);

  useEffect(() => {
    if (error) {
      setPopup({ isVisible: true, message: error, type: "error" });
      dispatch(clearAdminUsersError());
    }
  }, [error, dispatch]);

  const currentUserId = meta.currentUserId;
  const canManage = (row: ManagedAdmin) =>
    row.role !== "super_admin" && row._id !== currentUserId;

  const showCredentials = (
    email: string,
    password: string,
    generated: boolean,
    title: string
  ) => {
    setCopied(false);
    setCredentials({ open: true, email, password, generated, title });
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(credentials.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  // --- Handlers ---
  const handleCreate = async () => {
    if (!createForm.fullName.trim() || !createForm.email.trim()) {
      setPopup({ isVisible: true, message: "Full name and email are required.", type: "error" });
      return;
    }
    try {
      const result = await dispatch(
        createAdmin({
          fullName: createForm.fullName.trim(),
          email: createForm.email.trim(),
          password: createForm.password.trim() || undefined,
        })
      ).unwrap();
      setIsCreateOpen(false);
      setCreateForm({ fullName: "", email: "", password: "" });
      dispatch(fetchAdmins({ page, limit, search: search || undefined, status: statusFilter || undefined }));
      showCredentials(
        result.admin.email,
        result.temporaryPassword,
        result.generatedPassword,
        "Admin created successfully"
      );
    } catch {
      /* error surfaced via redux error effect */
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    try {
      await dispatch(
        updateAdmin({
          id: editTarget._id,
          fullName: editForm.fullName.trim(),
          email: editForm.email.trim(),
        })
      ).unwrap();
      setEditTarget(null);
      setPopup({ isVisible: true, message: "Admin updated successfully.", type: "success" });
    } catch {
      /* handled by effect */
    }
  };

  const handleToggleStatus = async (row: ManagedAdmin) => {
    try {
      await dispatch(setAdminStatus({ id: row._id, isActive: !row.isActive })).unwrap();
      setPopup({
        isVisible: true,
        message: row.isActive ? "Admin deactivated." : "Admin activated.",
        type: "success",
      });
    } catch {
      /* handled by effect */
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    try {
      const result = await dispatch(
        resetAdminPassword({
          id: resetTarget._id,
          password: resetPasswordInput.trim() || undefined,
        })
      ).unwrap();
      const email = resetTarget.email;
      setResetTarget(null);
      setResetPasswordInput("");
      showCredentials(
        email,
        result.temporaryPassword,
        result.generatedPassword,
        "Password reset successfully"
      );
    } catch {
      /* handled by effect */
    }
  };

  const handleChangeOwnPassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = changePwForm;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPopup({ isVisible: true, message: "All password fields are required.", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPopup({ isVisible: true, message: "New password and confirm password do not match.", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setPopup({ isVisible: true, message: "New password must be at least 6 characters.", type: "error" });
      return;
    }
    if (newPassword === currentPassword) {
      setPopup({ isVisible: true, message: "New password must be different from the current password.", type: "error" });
      return;
    }

    setChangingPw(true);
    try {
      await axiosInstance.post("/change-password", {
        oldPassword: currentPassword,
        newPassword,
        confirmPassword,
      });
      setIsChangePwOpen(false);
      setChangePwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPopup({
        isVisible: true,
        message: "Password changed successfully. Please sign in again with your new password.",
        type: "success",
      });
      // Changing the password invalidates the current access token, so sign out.
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        window.location.href = "/signin";
      }, 1600);
    } catch (err: any) {
      setPopup({
        isVisible: true,
        message: err.response?.data?.message || err.message || "Failed to change password.",
        type: "error",
      });
    } finally {
      setChangingPw(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(deleteAdmin(deleteTarget._id)).unwrap();
      setDeleteTarget(null);
      setPopup({ isVisible: true, message: "Admin deleted successfully.", type: "success" });
    } catch {
      setDeleteTarget(null);
    }
  };

  const pageNumbers = useMemo(() => {
    const totalPages = meta.totalPages || 1;
    const pages: (number | string)[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    if (start > 1) pages.push(1, "...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) pages.push("...", totalPages);
    return pages;
  }, [page, meta.totalPages]);

  return (
    <>
      <PageMeta
        title="Admin Management | Data Knowledge Admin"
        description="Create and manage administrator accounts"
      />
      <PageBreadcrumb pageTitle="Admin Management" />

      <PopupAlert
        isVisible={popup.isVisible}
        message={popup.message}
        type={popup.type}
        onClose={() => setPopup({ isVisible: false, message: "", type: "info" })}
      />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-100 text-blue-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Administrator Accounts
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Super admin only &middot; {meta.total} account{meta.total === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setCreateForm({ fullName: "", email: "", password: "" });
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" /> Add Admin
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email..."
              className={`${inputCls} pl-9`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "" | "active" | "inactive");
              setPage(1);
            }}
            className={`${inputCls} sm:w-48`}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden bg-white border border-gray-200 rounded-2xl dark:bg-gray-900 dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-left text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-left text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold text-left text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-xs font-semibold text-left text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-left text-gray-500 uppercase">Password</th>
                  <th className="px-4 py-3 text-xs font-semibold text-left text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-3 text-xs font-semibold text-right text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        Loading admins...
                      </div>
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      No admins found.
                    </td>
                  </tr>
                ) : (
                  admins.map((row) => {
                    const manageable = canManage(row);
                    return (
                      <tr key={row._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                              {(row.fullName || row.email || "?").charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {row.fullName || "-"}
                              {row._id === currentUserId && (
                                <span className="ml-2 text-[10px] font-bold uppercase text-cyan-600">You</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{row.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                              row.role === "super_admin"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {roleLabel(row.role)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                              row.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {row.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {row.mustChangePassword ? (
                            <span className="inline-flex px-2 py-1 font-semibold rounded-full bg-amber-100 text-amber-700">
                              Must change
                            </span>
                          ) : (
                            <span className="text-gray-400">Set</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(row.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              disabled={row.role === "super_admin" && row._id !== currentUserId}
                              onClick={() => {
                                setEditTarget(row);
                                setEditForm({ fullName: row.fullName, email: row.email });
                              }}
                              title={
                                row.role === "super_admin" && row._id !== currentUserId
                                  ? "Super admin cannot be edited"
                                  : "Edit"
                              }
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={!manageable || saving}
                              onClick={() => handleToggleStatus(row)}
                              title={row.isActive ? "Deactivate" : "Activate"}
                              className={`p-2 rounded-lg ${
                                row.isActive
                                  ? "text-amber-600 hover:bg-amber-50"
                                  : "text-green-600 hover:bg-green-50"
                              } disabled:opacity-30 disabled:cursor-not-allowed`}
                            >
                              {row.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                            </button>
                            {row._id === currentUserId ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setChangePwForm({
                                    currentPassword: "",
                                    newPassword: "",
                                    confirmPassword: "",
                                  });
                                  setIsChangePwOpen(true);
                                }}
                                title="Change my password"
                                className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50"
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={!manageable || saving}
                                onClick={() => {
                                  setResetTarget(row);
                                  setResetPasswordInput("");
                                }}
                                title="Reset password"
                                className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={!manageable}
                              onClick={() => setDeleteTarget(row)}
                              title="Delete"
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40"
            >
              Prev
            </button>
            {pageNumbers.map((p, idx) =>
              typeof p === "number" ? (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${
                    p === page ? "bg-blue-600 text-white border-blue-600" : ""
                  }`}
                >
                  {p}
                </button>
              ) : (
                <span key={idx} className="px-2 text-gray-400">
                  {p}
                </span>
              )
            )}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} className="max-w-md p-6">
        <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">Create Admin</h3>
        <p className="mb-4 text-sm text-gray-500">
          A temporary password will be generated and must be changed on first login.
        </p>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Full Name *</label>
            <input
              className={inputCls}
              value={createForm.fullName}
              onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label className={labelCls}>Email *</label>
            <input
              className={inputCls}
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              placeholder="jane@dataknowledge.in"
            />
          </div>
          <div>
            <label className={labelCls}>Password (optional)</label>
            <input
              className={inputCls}
              type="text"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              placeholder="Leave blank to auto-generate"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setIsCreateOpen(false)}
            className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleCreate}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create Admin"}
          </button>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} className="max-w-md p-6">
        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Edit Admin</h3>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Full Name</label>
            <input
              className={inputCls}
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input
              className={inputCls}
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setEditTarget(null)}
            className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleEdit}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </Modal>

      {/* Reset password modal */}
      <Modal isOpen={!!resetTarget} onClose={() => setResetTarget(null)} className="max-w-md p-6">
        <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">Reset Password</h3>
        <p className="mb-4 text-sm text-gray-500">
          Set a temporary password for <strong>{resetTarget?.email}</strong>. They will be required
          to change it on next login.
        </p>
        <label className={labelCls}>Temporary Password (optional)</label>
        <input
          className={inputCls}
          type="text"
          value={resetPasswordInput}
          onChange={(e) => setResetPasswordInput(e.target.value)}
          placeholder="Leave blank to auto-generate"
        />
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setResetTarget(null)}
            className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleResetPassword}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      </Modal>

      {/* Change my password modal */}
      <Modal isOpen={isChangePwOpen} onClose={() => setIsChangePwOpen(false)} className="max-w-md p-6">
        <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">Change My Password</h3>
        <p className="mb-4 text-sm text-gray-500">
          Enter your current password and choose a new one. You will be signed out afterwards.
        </p>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Current Password</label>
            <input
              className={inputCls}
              type="password"
              value={changePwForm.currentPassword}
              onChange={(e) => setChangePwForm({ ...changePwForm, currentPassword: e.target.value })}
              placeholder="Enter your current password"
            />
          </div>
          <div>
            <label className={labelCls}>New Password</label>
            <input
              className={inputCls}
              type="password"
              value={changePwForm.newPassword}
              onChange={(e) => setChangePwForm({ ...changePwForm, newPassword: e.target.value })}
              placeholder="Enter a new password"
            />
          </div>
          <div>
            <label className={labelCls}>Confirm New Password</label>
            <input
              className={inputCls}
              type="password"
              value={changePwForm.confirmPassword}
              onChange={(e) => setChangePwForm({ ...changePwForm, confirmPassword: e.target.value })}
              placeholder="Re-enter the new password"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setIsChangePwOpen(false)}
            className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={changingPw}
            onClick={handleChangeOwnPassword}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
          >
            {changingPw ? "Updating..." : "Change Password"}
          </button>
        </div>
      </Modal>

      {/* Credentials reveal modal */}
      <Modal
        isOpen={credentials.open}
        onClose={() => setCredentials((c) => ({ ...c, open: false }))}
        className="max-w-md p-6"
      >
        <div className="flex items-center gap-2 mb-3 text-green-600">
          <Check className="w-5 h-5" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{credentials.title}</h3>
        </div>
        <div className="p-3 mb-3 text-xs text-amber-700 rounded-lg bg-amber-50 border border-amber-200">
          This password is shown only once. Copy it now and share it with the admin securely.
        </div>
        <label className={labelCls}>Email</label>
        <div className="mb-3 px-4 py-2 text-sm bg-gray-50 rounded-lg break-all dark:bg-gray-800">
          {credentials.email}
        </div>
        <label className={labelCls}>Temporary Password</label>
        <div className="flex items-center gap-2">
          <input readOnly value={credentials.password} className={`${inputCls} font-mono`} />
          <button
            type="button"
            onClick={copyPassword}
            className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        {!credentials.generated && (
          <p className="mt-2 text-xs text-gray-400">
            A password was supplied manually for this account.
          </p>
        )}
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={() => setCredentials((c) => ({ ...c, open: false }))}
            className="px-4 py-2 text-sm font-semibold text-white bg-gray-800 rounded-lg hover:bg-gray-900"
          >
            Done
          </button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <PopupAlert
        isVisible={!!deleteTarget}
        message={`Delete admin "${deleteTarget?.fullName || deleteTarget?.email}"? This cannot be undone.`}
        type="error"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default AdminUsers;
