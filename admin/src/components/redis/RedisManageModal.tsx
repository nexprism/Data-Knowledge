import React, { useState } from "react";
import {
  Server,
  Zap,
  RefreshCw,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  Cpu,
  Layers,
  KeyRound,
  Activity,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchRedisStatus,
  toggleRedisConnection,
  testRedisPing,
  flushRedisCache,
  optimisticSetEnabled,
} from "../../store/slices/redisSlice";
import { toastConfig } from "../../utils/toastConfig";

interface RedisManageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RedisManageModal: React.FC<RedisManageModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { status, loading, toggling, pinging, flushing, lastPingResult } =
    useAppSelector((state) => state.redis);

  const [confirmFlush, setConfirmFlush] = useState(false);

  if (!isOpen) return null;

  const isEnabled = status?.enabled ?? true;
  const isConnected = status?.connected ?? false;
  const mode = status?.mode || "memory";

  const handleToggle = async () => {
    const nextState = !isEnabled;
    dispatch(optimisticSetEnabled(nextState));
    try {
      const res = await dispatch(toggleRedisConnection(nextState)).unwrap();
      if (res.connected) {
        toastConfig.success(res.message || "Redis connected successfully!");
      } else if (!nextState) {
        toastConfig.success("Redis connection turned OFF");
      } else {
        toastConfig.error(res.message || "Could not connect to external Redis server");
      }
    } catch (err: any) {
      toastConfig.error(err || "Failed to update Redis connection");
    }
  };

  const handlePing = async () => {
    try {
      const res = await dispatch(testRedisPing()).unwrap();
      if (res.success) {
        toastConfig.success(`Ping response: ${res.ping} (${res.latencyMs}ms)`);
      } else {
        toastConfig.error(res.message || "Ping failed");
      }
    } catch (err: any) {
      toastConfig.error(err || "Ping test failed");
    }
  };

  const handleFlush = async () => {
    try {
      await dispatch(flushRedisCache()).unwrap();
      toastConfig.success("Redis cache flushed successfully!");
      setConfirmFlush(false);
      dispatch(fetchRedisStatus());
    } catch (err: any) {
      toastConfig.error(err || "Failed to flush cache");
    }
  };

  const handleRefresh = () => {
    dispatch(fetchRedisStatus());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with decorative gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-rose-500 to-amber-500" />

        <div className="p-6 md:p-7">
          {/* Top Bar: Title & Close */}
          <div className="flex items-center justify-between pb-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-500/25 ring-4 ring-red-50 dark:ring-red-950/40">
                <Database className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Redis Cache Engine
                  </h3>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      !isEnabled
                        ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        : isConnected
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {!isEnabled ? "Disabled" : isConnected ? "Live" : "In-Memory Fallback"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Manage high-speed in-memory database and caching connectivity
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Master Toggle Banner */}
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/60 dark:from-gray-800/60 dark:to-gray-800/30 border border-gray-200/80 dark:border-gray-750 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isEnabled
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                }`}
              >
                <Server className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  Redis Connection
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isEnabled
                    ? "Redis caching is actively enabled"
                    : "Turned OFF. Application routes run without external Redis."}
                </p>
              </div>
            </div>

            {/* iOS-style Master Switch */}
            <button
              type="button"
              disabled={toggling}
              onClick={handleToggle}
              className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500/30 ${
                isEnabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
              } ${toggling ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <span className="sr-only">Toggle Redis connection</span>
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                  isEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              >
                {toggling ? (
                  <RefreshCw className="w-3 h-3 text-gray-600 animate-spin" />
                ) : isEnabled ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                )}
              </span>
            </button>
          </div>

          {/* Metric Details Grid */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Status Metric */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800">
              <div className="flex items-center justify-between text-gray-400 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  State
                </span>
                <Activity className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    !isEnabled
                      ? "bg-gray-400"
                      : isConnected
                      ? "bg-emerald-500 animate-ping"
                      : "bg-amber-500"
                  }`}
                />
                <span className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                  {!isEnabled ? "OFF" : isConnected ? "Online" : "Fallback"}
                </span>
              </div>
            </div>

            {/* Mode Metric */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800">
              <div className="flex items-center justify-between text-gray-400 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Engine Mode
                </span>
                <Cpu className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white capitalize truncate">
                {mode === "external"
                  ? "External Host"
                  : mode === "memory"
                  ? "In-Memory"
                  : "Offline"}
              </p>
            </div>

            {/* Latency Metric */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800">
              <div className="flex items-center justify-between text-gray-400 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Ping Latency
                </span>
                <Zap className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {status?.latencyMs !== null && status?.latencyMs !== undefined
                  ? `${status.latencyMs} ms`
                  : "-"}
              </p>
            </div>

            {/* Host Metric */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800">
              <div className="flex items-center justify-between text-gray-400 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Endpoint
                </span>
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <p className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300 truncate">
                {status?.host || "localhost"}:{status?.port || 6379}
              </p>
            </div>

            {/* Total Keys */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800">
              <div className="flex items-center justify-between text-gray-400 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Keys In Cache
                </span>
                <Database className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {status?.keyCount ?? 0}{" "}
                <span className="text-[11px] font-normal text-gray-400">keys</span>
              </p>
            </div>

            {/* Password Auth */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800">
              <div className="flex items-center justify-between text-gray-400 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Authentication
                </span>
                <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {status?.hasPassword ? "Protected (PW)" : "None"}
              </p>
            </div>
          </div>

          {/* Error / Offline Warning if any */}
          {isEnabled && !isConnected && status?.error && (
            <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold">Notice: </span>
                <span>{status.error}</span>
                <div className="text-[11px] text-amber-600/90 dark:text-amber-400/90 mt-1">
                  Using local in-memory fallback. You can toggle OFF or re-test the connection below.
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons: Ping, Refresh, Flush */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {/* Ping Test Button */}
            <button
              type="button"
              disabled={pinging || !isEnabled}
              onClick={handlePing}
              className={`flex-1 min-w-[120px] h-10 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                pinging
                  ? "bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40"
              }`}
            >
              {pinging ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              )}
              <span>{pinging ? "Testing..." : "Test Latency (Ping)"}</span>
            </button>

            {/* Refresh Status */}
            <button
              type="button"
              disabled={loading}
              onClick={handleRefresh}
              className="h-10 px-3.5 rounded-xl font-semibold text-xs text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Refresh status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            {/* Clear / Flush Cache */}
            {!confirmFlush ? (
              <button
                type="button"
                onClick={() => setConfirmFlush(true)}
                className="h-10 px-4 rounded-xl font-semibold text-xs text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Flush Cache</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={flushing}
                  onClick={handleFlush}
                  className="h-10 px-3.5 rounded-xl font-semibold text-xs text-white bg-rose-600 hover:bg-rose-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  {flushing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm Flush</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmFlush(false)}
                  className="h-10 px-3 rounded-xl font-semibold text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Last Ping Result pill */}
          {lastPingResult && (
            <div className="mt-4 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-750 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {lastPingResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500" />
                )}
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {lastPingResult.message || `Reply: ${lastPingResult.ping}`}
                </span>
              </div>
              {lastPingResult.latencyMs !== undefined && (
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px]">
                  {lastPingResult.latencyMs}ms
                </span>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-850/80 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
          <span>Changes take effect immediately across all admin services.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
