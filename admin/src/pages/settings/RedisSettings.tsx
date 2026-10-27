import React, { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import {
  Database,
  Zap,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  Activity,
  ShieldAlert,
  ShieldCheck,
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

export default function RedisSettings() {
  const dispatch = useAppDispatch();
  const { status, loading, toggling, pinging, flushing, lastPingResult } =
    useAppSelector((state) => state.redis);

  const [confirmFlush, setConfirmFlush] = useState(false);

  // Check super_admin permission
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(() => {
    try {
      const role = localStorage.getItem("role");
      if (role === "super_admin") return true;
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const u = JSON.parse(userStr);
        return u?.role === "super_admin" || u?.roles?.includes("super_admin");
      }
      return false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isSuperAdmin) {
      dispatch(fetchRedisStatus());
    }
  }, [dispatch, isSuperAdmin]);

  const isEnabled = status?.enabled ?? true;
  const isConnected = status?.connected ?? false;

  const handleToggle = async () => {
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
        toastConfig.error(res.message || "Could not connect to Redis server");
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
        toastConfig.error(res.message || "Ping test failed");
      }
    } catch (err: any) {
      toastConfig.error(err || "Ping test failed");
    }
  };

  const handleFlush = async () => {
    try {
      await dispatch(flushRedisCache()).unwrap();
      toastConfig.success("Redis cache cleared successfully!");
      setConfirmFlush(false);
      dispatch(fetchRedisStatus());
    } catch (err: any) {
      toastConfig.error(err || "Failed to flush cache");
    }
  };

  // If not super admin, block access
  if (!isSuperAdmin) {
    return (
      <>
        <PageMeta
          title="Access Restricted | Data Knowledge Admin"
          description="Super Admin access required"
        />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Access Restricted
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
            Redis connectivity and cache management is restricted to Super Admin accounts only.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Redis Management | Data Knowledge Admin"
        description="Manage Redis server connectivity and caching"
      />

      <PageBreadcrumb pageTitle="Redis Management" />

      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1b6294] via-[#16517a] to-[#103a58] p-6 md:p-8 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-cyan-200 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Super Admin Settings
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Redis Management
            </h1>
            <p className="mt-2 text-sm text-cyan-100/90 leading-relaxed">
              Manage platform caching connectivity. Turn Redis ON or OFF, test live response time, and clear cache when required.
            </p>
          </div>
        </div>

        {/* Master Connection Switch Card */}
        <div className="p-6 md:p-7 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                  isEnabled && isConnected
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20"
                    : isEnabled
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                }`}
              >
                <Database className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Redis Connection
                  </h2>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      !isEnabled
                        ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        : isConnected
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {!isEnabled ? "Turned OFF" : isConnected ? "Online" : "Fallback"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {isEnabled
                    ? "Redis connection is currently enabled."
                    : "Redis connection is turned OFF."}
                </p>
              </div>
            </div>

            {/* Master Toggle Button */}
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {isEnabled ? "Enabled" : "Disabled"}
              </span>
              <button
                type="button"
                onClick={handleToggle}
                disabled={toggling}
                title={isEnabled ? "Click to turn Redis OFF" : "Click to turn Redis ON"}
                className={`relative inline-flex h-8 w-15 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isEnabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-700"
                } ${toggling ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <span className="sr-only">Toggle Redis</span>
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                    isEnabled ? "translate-x-7" : "translate-x-0"
                  }`}
                >
                  {toggling ? (
                    <RefreshCw className="w-3.5 h-3.5 text-gray-600 animate-spin" />
                  ) : (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isEnabled ? "bg-emerald-500" : "bg-gray-400"
                      }`}
                    />
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Clean Status Cards (Without IP or extra details) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Status Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Connection Status
              </span>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  !isEnabled
                    ? "bg-gray-400"
                    : isConnected
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-amber-500"
                }`}
              />
              <span className="text-base font-bold text-gray-900 dark:text-white capitalize">
                {!isEnabled ? "OFF" : isConnected ? "Online" : "Fallback"}
              </span>
            </div>
          </div>

          {/* Latency Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Response Time
              </span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-base font-bold text-gray-900 dark:text-white">
              {status?.latencyMs !== null && status?.latencyMs !== undefined
                ? `${status.latencyMs} ms`
                : "-"}
            </p>
          </div>

          {/* Cached Keys Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Cached Keys
              </span>
              <Database className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-base font-bold text-gray-900 dark:text-white">
              {status?.keyCount ?? 0} keys
            </p>
          </div>
        </div>

        {/* Clean Action Controls */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            Actions
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            {/* Ping Test Button */}
            <button
              type="button"
              disabled={pinging || !isEnabled}
              onClick={handlePing}
              className={`h-10 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                pinging
                  ? "bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40"
              }`}
            >
              {pinging ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
              <span>{pinging ? "Testing..." : "Test Latency"}</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              disabled={loading}
              onClick={() => dispatch(fetchRedisStatus())}
              className="h-10 px-4 rounded-xl font-semibold text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Status</span>
            </button>

            {/* Flush Cache Button */}
            {!confirmFlush ? (
              <button
                type="button"
                onClick={() => setConfirmFlush(true)}
                className="h-10 px-4 rounded-xl font-semibold text-xs sm:text-sm text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Flush Cache</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={flushing}
                  onClick={handleFlush}
                  className="h-10 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-rose-600 hover:bg-rose-700 flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  {flushing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
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

          {/* Ping Result */}
          {lastPingResult && (
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-750 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                {lastPingResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {lastPingResult.message || `Reply: ${lastPingResult.ping}`}
                </span>
              </div>
              {lastPingResult.latencyMs !== undefined && (
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {lastPingResult.latencyMs} ms
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
