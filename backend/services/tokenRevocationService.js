import crypto from "crypto";
import jwt from "jsonwebtoken";
import RevokedAccessToken from "../models/RevokedAccessToken.js";
import ActiveAccessToken from "../models/ActiveAccessToken.js";

export const normalizePlatform = (platform) => (platform === "web" ? "web" : "app");

export const hashAccessToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const getTokenExpMs = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded?.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const blacklistAccessTokenByHash = async (tokenHash, expMs, userId = null, jti = null) => {
  const ttlMs = expMs - Date.now();
  if (ttlMs <= 0) return;

  await RevokedAccessToken.updateOne(
    { tokenHash },
    {
      $set: {
        tokenHash,
        jti: jti || null,
        userId: userId || null,
        expiresAt: new Date(expMs),
      },
    },
    { upsert: true }
  );
};

export const blacklistAccessToken = async (token, expMs, userId = null) => {
  if (!token) return;
  const decoded = jwt.decode(token);
  const tokenHash = hashAccessToken(token);
  const exp = expMs || getTokenExpMs(token) || Date.now() + 60 * 1000;
  await blacklistAccessTokenByHash(tokenHash, exp, userId, decoded?.jti || null);
};

export const isAccessTokenBlacklisted = async (token, user) => {
  if (user) {
    const isAdmin =
      user?.role === "admin" ||
      user?.role === "super_admin" ||
      (Array.isArray(user?.roles) &&
        (user?.roles.includes("admin") || user?.roles.includes("super_admin"))) ||
      user?.roles === "admin" ||
      user?.roles === "super_admin";
    if (isAdmin) return false;
  }

  if (!token) return false;

  const tokenHash = hashAccessToken(token);
  const revoked = await RevokedAccessToken.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  })
    .select("_id")
    .lean();

  return Boolean(revoked);
};

export const cleanupExpiredActiveAccessTokensForUser = async (userId, platform = "web") => {
  const platformKey = normalizePlatform(platform);
  await ActiveAccessToken.deleteMany({
    userId,
    platform: platformKey,
    expiresAt: { $lte: new Date() },
  });
};

export const storeActiveAccessToken = async (userId, token, expMs, platform = "web", jti = null) => {
  const platformKey = normalizePlatform(platform);
  const tokenHash = hashAccessToken(token);

  await ActiveAccessToken.create({
    userId,
    platform: platformKey,
    tokenHash,
    jti,
    expiresAt: new Date(expMs),
  });
};

export const revokeActiveAccessTokensForUser = async (userId, platform = "web") => {
  const platformKey = normalizePlatform(platform);

  const actives = await ActiveAccessToken.find({
    userId,
    platform: platformKey,
    expiresAt: { $gt: new Date() },
  })
    .select("tokenHash expiresAt jti")
    .lean();

  if (actives.length === 0) return;

  await Promise.all(
    actives.map((row) =>
      blacklistAccessTokenByHash(row.tokenHash, row.expiresAt.getTime(), userId, row.jti)
    )
  );

  await ActiveAccessToken.deleteMany({ userId, platform: platformKey });
};

export const clearActiveAccessTokensForUser = async (userId, platform = "web") => {
  const platformKey = normalizePlatform(platform);
  await ActiveAccessToken.deleteMany({ userId, platform: platformKey });
};
