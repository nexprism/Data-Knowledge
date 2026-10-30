import mongoose from "mongoose";

const emailOtpChallengeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

emailOtpChallengeSchema.index({ email: 1 }, { unique: true });
emailOtpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailOtpChallenge = mongoose.model("EmailOtpChallenge", emailOtpChallengeSchema);

export default EmailOtpChallenge;
