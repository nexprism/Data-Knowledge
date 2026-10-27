import React, { useState } from "react";
import { Database, Zap, Sliders, RefreshCw, Server } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  toggleRedisConnection,
  optimisticSetEnabled,
} from "../../store/slices/redisSlice";
import { RedisManageModal } from "./RedisManageModal";
import { toastConfig } from "../../utils/toastConfig";

export const AdminBottomBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { status, toggling } = useAppSelector((state) => state.redis);
  const [modalOpen, setModalOpen] = useState(false);

  const isEnabled = status?.enabled ?? true;
  const isConnected = status?.connected ?? false;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toggling) return;

    const nextState = !isEnabled;
    dispatch(optimisticSetEnabled(nextState));

    try {
      const res = await dispatch(toggleRedisConnection(nextState)).unwrap();
      if (res.connected) {
        toastConfig.success("Redis connection turned ON & connected!");
      } else if (!nextState) {
        toastConfig.success("Redis connection turned OFF");
      } else {
        toastConfig.error(res.message || "Could not connect to external Redis server");
      }
    } catch (err: any) {
      toastConfig.error(err || "Failed to toggle Redis");
    }
  };

  return (
    <>
      <footer className="mt-auto pt-6 pb-2">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/70 dark:border-gray-800 shadow-xs text-xs">
          {/* Left: Branding & System Status */}
          <div className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Data Knowledge Admin
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
            <span className="text-[11px]">System Status: Operational</span>
          </div>

          {/* Right: Redis Connection Control Bar */}
          <div className="flex items-center gap-3">
            {/* Redis Connectivity Status Pill */}
            <div
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-150 dark:bg-gray-800 dark:hover:bg-gray-750 border border-gray-200/80 dark:border-gray-700 transition-colors cursor-pointer"
              title="Click to manage Redis connectivity & cache"
            >
              <div className="relative flex items-center">
                <Database
                  className={`w-3.5 h-3.5 ${
                    !isEnabled
                      ? "text-gray-400"
                      : isConnected
                      ? "text-emerald-500"
                      : "text-amber-500"
                  }`}
                />
                <span
                  className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
                    !isEnabled
                      ? "bg-gray-400"
                      : isConnected
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-amber-500"
                  }`}
                />
              </div>

              <span className="font-semibold text-[11px] text-gray-700 dark:text-gray-200">
                Redis:
              </span>

              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                  !isEnabled
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    : isConnected
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                {!isEnabled
                  ? "OFF"
                  : isConnected
                  ? `${status?.latencyMs ? `${status.latencyMs}ms` : "Connected"}`
                  : "Memory"}
              </span>
            </div>

            {/* Quick Toggle Button */}
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-850 px-2.5 py-1.5 rounded-xl border border-gray-200/80 dark:border-gray-750">
              <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                Connection:
              </span>
              <button
                type="button"
                onClick={handleToggle}
                disabled={toggling}
                title={isEnabled ? "Turn Redis Connection OFF" : "Turn Redis Connection ON"}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isEnabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                } ${toggling ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span className="sr-only">Toggle Redis connection</span>
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out flex items-center justify-center ${
                    isEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                >
                  {toggling ? (
                    <RefreshCw className="w-2.5 h-2.5 text-gray-700 animate-spin" />
                  ) : (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isEnabled ? "bg-emerald-500" : "bg-gray-400"
                      }`}
                    />
                  )}
                </span>
              </button>
            </div>

            {/* Manage Button */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-500" />
              <span>Manage</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Redis Management Modal */}
      <RedisManageModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
