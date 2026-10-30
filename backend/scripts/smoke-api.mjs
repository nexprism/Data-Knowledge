/**
 * Opt-in HTTP smoke tests for API auth, settings, and core routes.
 * Does not print passwords, tokens, OTP values, or Mongo/API secrets.
 *
 * Required to run:
 *   SMOKE_RUN=1
 *   SMOKE_API_BASE=https://your-render-test.onrender.com/api/v1  (or http://localhost:5000/api/v1)
 *   SMOKE_TEST_EMAIL=...
 *   SMOKE_TEST_PASSWORD=...
 *
 * For non-localhost API targets:
 *   SMOKE_CONFIRM_TEST_TARGET=1
 *
 * Optional:
 *   SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD — admin login + settings GET
 *   SMOKE_COURSE_ID — GET /courses/:id
 *   SMOKE_SUBMISSION_ID — GET /quiz/submitted-quiz/:id (needs student login)
 *   SMOKE_SOCKET=1 — Socket.IO video-progress ping (needs SMOKE_LESSON_ID, SMOKE_COURSE_ID)
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}${detail ? ` — ${detail}` : ""}`);
}

function parseSetCookie(setCookieHeader) {
  if (!setCookieHeader) return "";
  const parts = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  return parts.map((c) => c.split(";")[0]).join("; ");
}

function mergeCookies(existing, added) {
  const map = new Map();
  for (const chunk of `${existing};${added}`.split(";")) {
    const t = chunk.trim();
    if (!t) continue;
    const eq = t.indexOf("=");
    if (eq > 0) map.set(t.slice(0, eq), t.slice(eq + 1));
  }
  return [...map.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function jsonFetch(url, options = {}, cookieJar = { value: "" }) {
  const headers = { ...(options.headers || {}) };
  if (cookieJar.value) headers.Cookie = cookieJar.value;
  const res = await fetch(url, { ...options, headers });
  const setCookie = res.headers.getSetCookie?.() || res.headers.raw?.()?.["set-cookie"];
  if (setCookie) {
    cookieJar.value = mergeCookies(cookieJar.value, parseSetCookie(setCookie));
  }
  let body = null;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { _raw: text?.slice(0, 200) };
  }
  return { res, body };
}

const run = process.env.SMOKE_RUN === "1" || process.env.SMOKE_RUN === "true";
const base = (process.env.SMOKE_API_BASE || "").replace(/\/$/, "");
const email = process.env.SMOKE_TEST_EMAIL || "";
const password = process.env.SMOKE_TEST_PASSWORD || "";
const isLocalApi = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(base);
const confirmTarget =
  process.env.SMOKE_CONFIRM_TEST_TARGET === "1" ||
  process.env.SMOKE_CONFIRM_TEST_TARGET === "true";

if (!run) {
  console.log("SKIP: smoke-api (set SMOKE_RUN=1 and SMOKE_API_BASE + credentials to execute)");
  process.exit(0);
}

if (!base || !email || !password) {
  record("smoke prerequisites", false, "SMOKE_API_BASE, SMOKE_TEST_EMAIL, SMOKE_TEST_PASSWORD required");
  process.exit(1);
}

if (!isLocalApi && !confirmTarget) {
  record("smoke target guard", false, "non-local API requires SMOKE_CONFIRM_TEST_TARGET=1");
  process.exit(1);
}

const jar = { value: "" };

try {
  // Public reads
  {
    const { res } = await jsonFetch(`${base}/modules`, { method: "GET" }, jar);
    record("GET /modules", res.status === 200, `HTTP ${res.status}`);
  }
  {
    const { res } = await jsonFetch(`${base}/filter`, { method: "GET" }, jar);
    record("GET /filter", res.status === 200, `HTTP ${res.status}`);
  }

  // Login
  let accessHeader = "";
  {
    const { res, body } = await jsonFetch(
      `${base}/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, platform: "web" }),
      },
      jar
    );
    record("POST /login", res.status === 200 && body?.success !== false, `HTTP ${res.status}`);
    accessHeader = res.headers.get("x-access-token") || body?.data?.accessToken || "";
  }

  // Me (protected)
  {
    const headers = { "Content-Type": "application/json" };
    if (accessHeader) headers.Authorization = `Bearer ${accessHeader}`;
    const { res } = await jsonFetch(`${base}/me`, { method: "GET", headers }, jar);
    record("GET /me", res.status === 200, `HTTP ${res.status}`);
  }

  // Refresh
  {
    const { res, body } = await jsonFetch(
      `${base}/refresh-token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      jar
    );
    record("POST /refresh-token", res.status === 200, `HTTP ${res.status}`);
    if (body?.data?.accessToken) accessHeader = body.data.accessToken;
  }

  // OTP send (uses test email — may hit real SMTP)
  const otpEmail = process.env.SMOKE_OTP_EMAIL || `smoke-${Date.now()}@example.test`;
  {
    const { res } = await jsonFetch(
      `${base}/sendotp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail }),
      },
      jar
    );
    record("POST /sendotp", res.status === 200 || res.status === 429, `HTTP ${res.status}`);
  }
  {
    const { res } = await jsonFetch(
      `${base}/sendotp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail }),
      },
      jar
    );
    record("POST /sendotp resend cooldown", res.status === 429, `HTTP ${res.status}`);
  }

  if (process.env.SMOKE_OTP_CODE) {
    const { res } = await jsonFetch(
      `${base}/verifyotp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail, otp: process.env.SMOKE_OTP_CODE }),
      },
      jar
    );
    record("POST /verifyotp", res.status === 200, `HTTP ${res.status}`);
  } else {
    record("POST /verifyotp", true, "skipped (set SMOKE_OTP_CODE from email to test verify)");
  }

  // Forum tags (public-ish)
  {
    const headers = {};
    if (accessHeader) headers.Authorization = `Bearer ${accessHeader}`;
    const { res } = await jsonFetch(`${base}/forum/tags`, { method: "GET", headers }, jar);
    record("GET /forum/tags", res.status === 200, `HTTP ${res.status}`);
  }

  const courseId = process.env.SMOKE_COURSE_ID;
  if (courseId) {
    const { res } = await jsonFetch(`${base}/courses/${courseId}`, { method: "GET" }, jar);
    record("GET /courses/:id", res.status === 200, `HTTP ${res.status}`);
  } else {
    record("GET /courses/:id", true, "skipped (set SMOKE_COURSE_ID)");
  }

  const submissionId = process.env.SMOKE_SUBMISSION_ID;
  if (submissionId) {
    const headers = {};
    if (accessHeader) headers.Authorization = `Bearer ${accessHeader}`;
    const { res } = await jsonFetch(
      `${base}/quiz/submitted-quiz/${submissionId}`,
      { method: "GET", headers },
      jar
    );
    record("GET /quiz/submitted-quiz/:id", res.status === 200, `HTTP ${res.status}`);
  } else {
    record("GET /quiz/submitted-quiz/:id", true, "skipped (set SMOKE_SUBMISSION_ID)");
  }

  // Logout-all (optional — invalidates all sessions for test user)
  if (process.env.SMOKE_TEST_LOGOUT_ALL === "1") {
    const headers = { "Content-Type": "application/json" };
    if (accessHeader) headers.Authorization = `Bearer ${accessHeader}`;
    const { res } = await jsonFetch(
      `${base}/logout-all-sessions`,
      { method: "POST", headers, body: JSON.stringify({}) },
      jar
    );
    record("POST /logout-all-sessions", res.status === 200, `HTTP ${res.status}`);
  } else {
    record("POST /logout-all-sessions", true, "skipped (set SMOKE_TEST_LOGOUT_ALL=1 to run)");
  }

  // Logout current session
  {
    const headers = { "Content-Type": "application/json" };
    if (accessHeader) headers.Authorization = `Bearer ${accessHeader}`;
    const { res } = await jsonFetch(`${base}/logout`, { method: "POST", headers }, jar);
    record("POST /logout", res.status === 200, `HTTP ${res.status}`);
  }

  // Admin
  const adminEmail = process.env.SMOKE_ADMIN_EMAIL;
  const adminPassword = process.env.SMOKE_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const adminJar = { value: "" };
    const { res, body } = await jsonFetch(
      `${base}/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword, platform: "web" }),
      },
      adminJar
    );
    record("admin POST /login", res.status === 200, `HTTP ${res.status}`);
    const adminToken = res.headers.get("x-access-token") || body?.data?.accessToken || "";
    const headers = {};
    if (adminToken) headers.Authorization = `Bearer ${adminToken}`;
    const settings = await jsonFetch(`${base}/settings`, { method: "GET", headers }, adminJar);
    record("admin GET /settings", settings.res.status === 200, `HTTP ${settings.res.status}`);
  } else {
    record("admin login/settings", true, "skipped (SMOKE_ADMIN_EMAIL/PASSWORD)");
  }

  // Socket.IO (optional)
  if (process.env.SMOKE_SOCKET === "1") {
    const origin = base.replace(/\/api\/v1\/?$/, "");
    const lessonId = process.env.SMOKE_LESSON_ID;
    const socketCourseId = process.env.SMOKE_COURSE_ID;
    if (!lessonId || !socketCourseId) {
      record("Socket video-progress", true, "skipped (SMOKE_LESSON_ID + SMOKE_COURSE_ID)");
    } else {
      const { io } = await import("socket.io-client");
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("socket timeout")), 10000);
        const socket = io(origin, {
          transports: ["websocket"],
          auth: accessHeader ? { token: accessHeader } : undefined,
        });
        socket.on("connect", () => {
          socket.emit("video-progress", {
            lessonId,
            courseId: socketCourseId,
            currentTime: 10,
            duration: 100,
          });
        });
        socket.on("progress-updated", () => {
          clearTimeout(timer);
          socket.close();
          resolve();
        });
        socket.on("connect_error", (err) => {
          clearTimeout(timer);
          reject(err);
        });
      })
        .then(() => record("Socket video-progress", true))
        .catch((e) => record("Socket video-progress", false, e.message));
    }
  } else {
    record("Socket video-progress", true, "skipped (SMOKE_SOCKET=1)");
  }
} catch (e) {
  record("smoke-api fatal", false, e.message);
}

const failed = results.filter((r) => !r.ok);
process.exit(failed.length ? 1 : 0);
