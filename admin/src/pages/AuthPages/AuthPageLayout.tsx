import React from "react";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row sm:p-0">
        {children}
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-gradient-to-br from-brand-900 via-brand-950 to-gray-950 lg:grid">
          <div className="relative flex items-center justify-center z-1">
            {/* <!-- ===== Common Grid Shape Start ===== --> */}
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              <Link to="/" className="block mb-4">
                <img
                  className="h-24 w-24 rounded-2xl shadow-theme-xl object-contain bg-white p-2"
                  src="/images/logo/logo.png"
                  alt="Data Knowledge"
                />
              </Link>
                <p className="text-lg font-semibold text-white">
                Data Knowledge Admin
                </p>
                <p className="text-sm text-gray-400">
                Course &amp; Learning Management Dashboard
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
