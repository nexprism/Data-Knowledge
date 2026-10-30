import mongoose from "mongoose";

const activeAccessTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ["web", "app"],
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    jti: {
      type: String,
      default: null,
      sparse: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

activeAccessTokenSchema.index({ userId: 1, platform: 1, expiresAt: 1 });
activeAccessTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ActiveAccessToken = mongoose.model("ActiveAccessToken", activeAccessTokenSchema);

export default ActiveAccessToken;
