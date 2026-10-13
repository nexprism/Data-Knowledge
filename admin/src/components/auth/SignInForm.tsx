import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import {
  login,
  clearError,
  selectLoginStatus,
  selectAuthError,
  selectIsAuthenticated,
  selectCurrentUser,
} from "../../store/slices/authslice"; // Adjust path as needed
import type { AppDispatch } from "../../store"; // <-- Import your AppDispatch type

export default function SignInForm() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  // Form state
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: ""
  });

  // Redux state
  const loginStatus = useSelector(selectLoginStatus);
  const authError = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  // Redirect if already authenticated — respect role
  useEffect(() => {
    if (isAuthenticated) {
      if (currentUser?.mustChangePassword) {
        navigate("/change-password");
        return;
      }
      const role = currentUser?.role || localStorage.getItem("role");
      if (role === "news_editor") {
        navigate("/news");
      } else {
        navigate("/");
      }
    }
  }, [isAuthenticated, currentUser, navigate]);

  // Clear errors when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Handle input changes
  const handleInputChange = (field: "email" | "password", value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {
      email: "",
      password: ""
    };

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password.trim()) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setFormErrors(errors);
    return !errors.email && !errors.password;
  };

  // Handle form submission
  const handleSubmit = async (e:any) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
     
      const result = await dispatch(login({
        email: formData.email.trim(),
        password: formData.password.trim(),
      }));

      if (login.fulfilled.match(result)) {
        // Login successful - persist role and navigate based on role
        const payloadUser = result.payload?.user;
        try {
          const roleToStore = payloadUser?.role;
          if (roleToStore) {
            localStorage.setItem("role", String(roleToStore));
          }
        } catch (e) {
          // ignore
        }

        if (payloadUser?.mustChangePassword) {
          navigate("/change-password");
        } else if (payloadUser?.role === "news_editor") {
          navigate("/news");
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const isLoading = loginStatus === "loading";

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="w-full p-8 bg-white border border-gray-200 shadow-theme-lg rounded-2xl dark:bg-gray-900 dark:border-gray-800">
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>

          {/* Display API error if any */}
          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{authError}</p>
            </div>
          )}

          <div>
          
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input 
                    placeholder="info@gmail.com" 
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled={isLoading}
                    className={formErrors.email ? "border-red-500" : ""}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>
                
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      disabled={isLoading}
                      className={formErrors.password ? "border-red-500" : ""}
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
                  {formErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                  )}
                </div>
                
                <div className="flex sm:flex-row items-center sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={isChecked} 
                      onChange={setIsChecked}
                      disabled={isLoading}
                    />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                
                </div>
                
                <div>
                  <Button 
                    type="submit"
                    className="w-full" 
                    size="sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Signing in...
                      </div>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </div>
              </div>
            </form>

          
          </div>
        </div>
      </div>
    </div>
  );
}