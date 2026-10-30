import bcrypt from "bcryptjs";
import EmailOtpChallenge from "../models/EmailOtpChallenge.js";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const normalizeEmail = (email) => String(email || "").toLowerCase().trim();

export const createEmailOtpChallenge = async (email, otpPlaintext) => {
  const normalized = normalizeEmail(email);
  const existing = await EmailOtpChallenge.findOne({ email: normalized });

  if (existing?.lastSentAt && Date.now() - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
    const err = new Error("Please wait before requesting another OTP");
    err.code = "OTP_RESEND_COOLDOWN";
    throw err;
  }

  const otpHash = await bcrypt.hash(String(otpPlaintext), 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await EmailOtpChallenge.findOneAndUpdate(
    { email: normalized },
    {
      $set: {
        email: normalized,
        otpHash,
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );
};

export const verifyEmailOtpChallenge = async (email, otpPlaintext) => {
  const normalized = normalizeEmail(email);
  const challenge = await EmailOtpChallenge.findOne({ email: normalized });

  if (!challenge || challenge.expiresAt <= new Date()) {
    if (challenge) await EmailOtpChallenge.deleteOne({ _id: challenge._id });
    return { ok: false, reason: "expired" };
  }

  if (challenge.attempts >= MAX_ATTEMPTS) {
    await EmailOtpChallenge.deleteOne({ _id: challenge._id });
    return { ok: false, reason: "max_attempts" };
  }

  const match = await bcrypt.compare(String(otpPlaintext), challenge.otpHash);
  if (!match) {
    challenge.attempts += 1;
    await challenge.save();
    return { ok: false, reason: "mismatch" };
  }

  await EmailOtpChallenge.deleteOne({ _id: challenge._id });
  return { ok: true };
};
