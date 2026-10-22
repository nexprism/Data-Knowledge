import React, { useEffect } from "react";

interface PopupAlertProps {
  message: React.ReactNode | string;
  title?: string;
  type?: "success" | "error" | "info";
  isVisible: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

const PopupAlert: React.FC<PopupAlertProps> = ({
  message,
  title,
  type = "info",
  isVisible,
  onClose,
  onConfirm,
  confirmLabel = "Yes",
  cancelLabel = "Cancel",
}) => {
  if (!isVisible) return null;

  const showConfirm = typeof onConfirm === "function";

  useEffect(() => {
    if (isVisible) {
      console.log("PopupAlert visible", { type, message });
    }
  }, [isVisible, type, message]);

  const defaultTitle = type === "success" ? "Success" : type === "error" ? "Warning" : "Notice";

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex: 999999 }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-auto shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center mb-4">
          {type === "success" && (
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
          )}
          {type === "error" && (
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </div>
          )}
          {type === "info" && (
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
          )}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {title || defaultTitle}
          </h3>
        </div>

        <div className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed whitespace-pre-line max-h-[60vh] overflow-y-auto">
          {message}
        </div>

        <div className="flex gap-3">
          {showConfirm ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm && onConfirm();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-medium text-sm shadow-sm"
              >
                {confirmLabel}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl transition-colors font-medium text-sm shadow-sm hover:shadow"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PopupAlert;
