import React, { useEffect, useState } from "react";
import { Database, Sliders, RefreshCw, Zap } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchRedisStatus,
  toggleRedisConnection,
  optimisticSetEnabled,
} from "../../store/slices/redisSlice";
import { RedisManageModal } from "./RedisManageModal";
import { toastConfig } from "../../utils/toastConfig";

interface RedisSidebarWidgetProps {
  isExpanded: boolean;
  isHovered: boolean;
  isMobileOpen?: boolean;
}

export const RedisSidebarWidget: React.FC<RedisSidebarWidgetProps> = ({
  isExpanded,
  isHovered,
  isMobileOpen = false,
}) => {
  const dispatch = useAppDispatch();
  const { status, loading, toggling } = useAppSelector((state) => state.redis);
  const [modalOpen, setModalOpen] = useState(false);

  // Poll status on mount and every 30s
  useEffect(() => {
    dispatch(fetchRedisStatus());
    const timer = setInterval(() => {
      dispatch(fetchRedisStatus());
    }, 30000);
    return () => clearInterval(timer);
  }, [dispatch]);

  const isEnabled = status?.enabled ?? true;
  const isConnected = status?.connected ?? false;
  const isOpen = isExpanded || isHovered || isMobileOpen;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toggling) return;

    const nextState = !isEnabled;
    dispatch(optimisticSetEnabled(nextState));

    try {
      const res = await dispatch(toggleRedisConnection(nextState)).unwrap();
      if (res.connected) {
        toastConfig.success("Redis connected successfully!");
      } else if (!nextState) {
        toastConfig.success("Redis connection turned OFF");
      } else {
        toastConfig.error(res.message || "Could not reach external Redis server");
      }
    } catch (err: any) {
      toastConfig.error(err || "Failed to toggle Redis connection");
    }
  };

  return (
    <>
      <div className="w-full px-2 py-2 mt-auto border-t border-white/10 shrink-0">
        {isOpen ? (
          <div
            onClick={() => setModalOpen(true)}
            className="group relative p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/30 transition-all duration-200 cursor-pointer shadow-xs"
          >
            <div className="flex items-center justify-between gap-2">
              {/* Left: Icon & Title */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`relative w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    !isEnabled
                      ? "bg-white/10 text-white/50"
                      : isConnected
                      ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40"
                      : "bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40"
                  }`}
                >
                  <Database className="w-4 h-4" />
                  {/* Status ping indicator */}
                  <span
                    className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                      !isEnabled
                        ? "bg-gray-400"
                        : isConnected
                        ? "bg-emerald-400 animate-pulse"
                        : "bg-amber-400 animate-ping"
                    }`}
                  />
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white tracking-tight truncate">
                      Redis Connection
                    </span>
                  </div>
                  <span className="text-[10px] text-white/60 font-mono truncate">
                    {!isEnabled
                      ? "Offline (Turned OFF)"
                      : isConnected
                      ? `Online • ${status?.latencyMs ? `${status.latencyMs}ms` : "Active"}`
                      : "Memory Fallback"}
                  </span>
                </div>
              </div>

              {/* Right: Quick iOS Toggle Switch */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  title={isEnabled ? "Click to turn Redis OFF" : "Click to turn Redis ON"}
                  onClick={handleToggle}
                  disabled={toggling}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isEnabled ? "bg-emerald-500" : "bg-white/20"
                  } ${toggling ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span className="sr-only">Toggle Redis</span>
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

                {/* Manage icon */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalOpen(true);
                  }}
                  className="w-6 h-6 rounded-lg hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Manage Redis details & cache"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-200" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Collapsed Sidebar Mode (90px) */
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                !isEnabled
                  ? "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                  : isConnected
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border-amber-400/30 hover:bg-amber-500/30"
              }`}
              title={`Redis: ${
                !isEnabled ? "Turned OFF" : isConnected ? "Connected (Live)" : "Memory Fallback"
              } • Click to manage`}
            >
              <Database className="w-4 h-4" />
              <span
                className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                  !isEnabled
                    ? "bg-gray-400"
                    : isConnected
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-amber-400"
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Full Redis Management Modal */}
      <RedisManageModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
