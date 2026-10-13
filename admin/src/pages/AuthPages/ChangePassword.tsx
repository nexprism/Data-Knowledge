import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { EyeCloseIcon, EyeIcon, CheckCircleIcon } from "../../icons";
import axiosInstance from "../../services/axiosConfig";

const ChangePassword: React.FC = () => {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Direct visits without a session must go to signin.
  useEffect(() => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) {
      navigate("/signin", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from the current password.");
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post("/change-password", {
        oldPassword: currentPassword,
        newPassword,
        confirmPassword,
      });

      setSuccess(true);

      // Changing the password invalidates the existing access token
      // (passwordChangedAt), so the user is signed out and must log in again.
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      setTimeout(() => navigate("/signin", { replace: true }), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to change password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Change Password | Data Knowledge Admin"
        description="Set a new password for your administrator account"
      />
      <AuthLayout>
        <div className="flex flex-col flex-1">
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div className="w-full p-8 bg-white border border-gray-200 shadow-theme-lg rounded-2xl dark:bg-gray-900 dark:border-gray-800">
              <div className="mb-6">
                <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                  Change Your Password
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  For your security, you must set a new password before continuing.
                </p>
              </div>

              {error && (
                <div className="p-3 mb-4 border border-red-200 rounded-lg bg-red-50">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 mb-4 border border-green-200 rounded-lg bg-green-50">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-700">
                    Password changed. Redirecting to sign in...
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                  <div>
                    <Label>
                      Current Password <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your current / temporary password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={submitting || success}
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        )}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label>
                      New Password <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter a new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={submitting || success}
                    />
                  </div>

                  <div>
                    <Label>
                      Confirm New Password <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-enter the new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={submitting || success}
                    />
                  </div>

                  <div>
                    <Button type="submit" className="w-full" size="sm" disabled={submitting || success}>
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                          Updating...
                        </span>
                      ) : (
                        "Change Password"
                      )}
                    </Button>
                  </div>
                </div>
              </form>

              <div className="mt-5 text-center">
                <Link
                  to="/signin"
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AuthLayout>
    </>
  );
};

export default ChangePassword;
