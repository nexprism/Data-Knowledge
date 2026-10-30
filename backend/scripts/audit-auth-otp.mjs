/**
 * Local audit checks (no production). Does not print secrets or OTP values.
 */
import crypto from "crypto";
import jwt from "jsonwebtoken";
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

// --- Unit: token hash consistency ---
const { hashAccessToken } = await import("../services/tokenRevocationService.js");
const sample = "eyJhbGci.test.token";
const h1 = hashAccessToken(sample);
const h2 = hashAccessToken(sample);
record("hashAccessToken deterministic", h1 === h2 && h1.length === 64);

// --- Module imports ---
try {
  await import("../app.js");
  record("import app.js", true);
} catch (e) {
  record("import app.js", false, e.message);
}

try {
  await import("../utils/tokens/generateTokens.js");
  record("import generateTokens.js", true);
} catch (e) {
  record("import generateTokens.js", false, e.message);
}

{
  const fs = await import("node:fs/promises");
  let legacyOtpFileExists = false;
  try {
    await fs.access(new URL("../utils/tokens/sendEmailVerificationOTP.js", import.meta.url));
    legacyOtpFileExists = true;
  } catch {
    legacyOtpFileExists = false;
  }
  record("legacy sendEmailVerificationOTP.js removed", !legacyOtpFileExists);
}

const defaultMongo = process.env.MONGODB_URI || process.env.MONGO_URI || "";
const isLocalDefault = /localhost|127\.0\.0\.1|mongodb:\/\/mongo:/i.test(defaultMongo);
const explicitTestUri = process.env.AUDIT_TEST_MONGO_URI || "";
const integrationUri = explicitTestUri || (isLocalDefault ? defaultMongo : "");

const isLocalIntegration = /localhost|127\.0\.0\.1|mongodb:\/\/mongo:/i.test(integrationUri);
const confirmNonLocal =
  process.env.AUDIT_CONFIRM_TEST_DB === "1" || process.env.AUDIT_CONFIRM_TEST_DB === "true";

if (!integrationUri) {
  record(
    "Mongo integration tests",
    true,
    "skipped (use local Mongo in .env, or set AUDIT_TEST_MONGO_URI to Render test DB)"
  );
} else if (!isLocalIntegration && !confirmNonLocal) {
  record(
    "Mongo integration tests",
    true,
    "skipped (non-local URI requires AUDIT_CONFIRM_TEST_DB=1 — use your Render TEST database only)"
  );
} else {
  const mongoose = (await import("mongoose")).default;
  try {
    await mongoose.connect(integrationUri, { serverSelectionTimeoutMS: 8000 });
    record("mongoose connect (integration)", true);

    const {
      createEmailOtpChallenge,
      verifyEmailOtpChallenge,
    } = await import("../services/emailOtpService.js");
    const EmailOtpChallenge = (await import("../models/EmailOtpChallenge.js")).default;
    const {
      blacklistAccessTokenByHash,
      isAccessTokenBlacklisted,
    } = await import("../services/tokenRevocationService.js");

    const testEmail = `audit-${Date.now()}@example.test`;
    const otp = "123456";
    await EmailOtpChallenge.deleteMany({ email: testEmail });

    await createEmailOtpChallenge(testEmail, otp);
    record("OTP create challenge", true);

    let cooldownHit = false;
    try {
      await createEmailOtpChallenge(testEmail, "654321");
    } catch (e) {
      cooldownHit = e.code === "OTP_RESEND_COOLDOWN";
    }
    record("OTP resend cooldown", cooldownHit);

    const bad = await verifyEmailOtpChallenge(testEmail, "000000");
    record("OTP wrong code rejected", bad.ok === false && bad.reason === "mismatch");

    const good = await verifyEmailOtpChallenge(testEmail, otp);
    record("OTP correct verifies", good.ok === true);

    const gone = await EmailOtpChallenge.findOne({ email: testEmail });
    record("OTP challenge removed after success", gone === null);

    // Expiration (app logic, not TTL)
    await createEmailOtpChallenge(testEmail, otp);
    await EmailOtpChallenge.updateOne(
      { email: testEmail },
      { $set: { expiresAt: new Date(Date.now() - 1000) } }
    );
    const expired = await verifyEmailOtpChallenge(testEmail, otp);
    record("OTP expired rejected before TTL sweep", expired.ok === false && expired.reason === "expired");

    await EmailOtpChallenge.deleteMany({ email: testEmail });

    // Revocation
    const secret = process.env.JWT_ACCESS_TOKEN_SECRET_KEY || process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      record("revocation JWT test", false, "missing JWT access secret in env");
    } else {
      const token = jwt.sign({ _id: "507f1f77bcf86cd799439011", roles: "student" }, secret, {
        expiresIn: "1h",
      });
      const hash = hashAccessToken(token);
      const expMs = jwt.decode(token).exp * 1000;
      await blacklistAccessTokenByHash(hash, expMs);
      const blacklisted = await isAccessTokenBlacklisted(token, { roles: "student" });
      record("revocation blacklist enforced", blacklisted === true);

      const adminBypass = await isAccessTokenBlacklisted(token, { role: "admin" });
      record("admin blacklist bypass", adminBypass === false);

      await mongoose.connection.db.collection("revokedaccesstokens").deleteOne({ tokenHash: hash });
    }
  } catch (e) {
    record("Mongo integration block", false, e.message);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

const failed = results.filter((r) => !r.ok);
process.exit(failed.length ? 1 : 0);
