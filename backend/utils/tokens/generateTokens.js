import crypto from "crypto";
import jwt from "jsonwebtoken";
import UserRefreshToken from "../../models/UserRefreshToken.js";
import { ServerConfig } from "../../config/server.config.js";
import {
  blacklistAccessToken,
  cleanupExpiredActiveAccessTokensForUser,
  isAccessTokenBlacklisted,
  revokeActiveAccessTokensForUser,
  storeActiveAccessToken,
} from "../../services/tokenRevocationService.js";

const getTokenExp = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded?.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
};

const generateTokens = async (user, platform = "web", deviceId = null, isRefresh = false) => {
  try {
    if (!user || !user._id) {
      throw new Error("User object is missing or invalid");
    }

    const jti = crypto.randomUUID();
    const payload = { _id: user._id, roles: user.role || user.roles, platform, jti };

    const accessSecret = process.env.JWT_ACCESS_TOKEN_SECRET_KEY || process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_TOKEN_SECRET_KEY;

    if (!accessSecret || !refreshSecret) {
      throw new Error("JWT secrets are not defined in environment variables");
    }

    const accessToken = jwt.sign(payload, accessSecret, { expiresIn: "7d" });
    const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: "30d" });

    const decodedAccess = jwt.decode(accessToken);
    const decodedRefresh = jwt.decode(refreshToken);

    const accessTokenExp = decodedAccess?.exp
      ? decodedAccess.exp * 1000
      : Date.now() + 1000 * 60 * 60 * 24 * 7;
    const refreshTokenExp = decodedRefresh?.exp
      ? decodedRefresh.exp * 1000
      : Date.now() + 1000 * 60 * 60 * 24 * 30;

    if (!isRefresh) {
      await UserRefreshToken.deleteMany({
        userId: user._id,
        platform: platform === "web" ? "web" : { $in: ["app", "android", "ios"] },
      });
    }

    const newRefreshToken = new UserRefreshToken({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(refreshTokenExp),
      platform: platform,
      deviceId: deviceId,
    });
    await newRefreshToken.save();

    const isAdmin =
      user?.role === "admin" ||
      user?.role === "super_admin" ||
      (Array.isArray(user?.roles) &&
        (user?.roles.includes("admin") || user?.roles.includes("super_admin"))) ||
      user?.roles === "admin" ||
      user?.roles === "super_admin";

    if (!isAdmin && !isRefresh) {
      await cleanupExpiredActiveAccessTokensForUser(user._id, platform);
      await revokeActiveAccessTokensForUser(user._id, platform);
    }

    await storeActiveAccessToken(user._id, accessToken, accessTokenExp, platform, jti);

    return {
      accessToken,
      refreshToken,
      accessTokenExp,
      refreshTokenExp,
    };
  } catch (error) {
    console.error("❌ Error in generateTokens:", error);
    throw new Error(`Token generation failed: ${error.message}`);
  }
};

const generateTokenForResetPassword = async (user) => {
  try {
    const secret = ServerConfig.JWT_EMAIL_RESET_SECRET;
    const token = jwt.sign({ userID: user._id }, secret, { expiresIn: "15m" });
    return token;
  } catch (error) {
    console.error("❌ Error in generateTokenForResetPassword:", error);
    throw new Error(`Reset token generation failed: ${error.message}`);
  }
};

const cleanupExpiredAccessTokensForUser = cleanupExpiredActiveAccessTokensForUser;

export {
  generateTokens,
  generateTokenForResetPassword,
  isAccessTokenBlacklisted,
  blacklistAccessToken,
  cleanupExpiredAccessTokensForUser,
  getTokenExp,
};

export { revokeActiveAccessTokensForUser } from "../../services/tokenRevocationService.js";
