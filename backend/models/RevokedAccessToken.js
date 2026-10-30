import mongoose from "mongoose";

const revokedAccessTokenSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    jti: {
      type: String,
      default: null,
      index: true,
      sparse: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

revokedAccessTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RevokedAccessToken = mongoose.model("RevokedAccessToken", revokedAccessTokenSchema);

export default RevokedAccessToken;
