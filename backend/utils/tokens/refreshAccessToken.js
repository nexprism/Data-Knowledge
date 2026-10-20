import User from "../../models/user.js";
import UserRefreshToken from "../../models/UserRefreshToken.js";
import { generateTokens } from "./generateTokens.js";
import { verifyRefreshToken } from "./verifyToken.js";

// Deduplicate concurrent refreshes for the same token and keep a short grace window
const inFlightRefreshes = new Map();
const recentRefreshes = new Map();

// Periodic cleanup of recentRefreshes cache
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of recentRefreshes.entries()) {
    if (now - val.timestamp > 60000) {
      recentRefreshes.delete(key);
    }
  }
}, 60000).unref?.();

const refreshAccessToken = async (req, res) => {
  try {
    let oldRefreshToken = req.cookies?.refreshToken || req.headers["x-refresh-token"];

    // Handle JSON parsing for headers if needed
    if (typeof oldRefreshToken === 'string' && oldRefreshToken.startsWith('{')) {
      try {
        oldRefreshToken = JSON.parse(oldRefreshToken);
      } catch (e) {
        // If parsing fails, use the string as is
      }
    }

    if (!oldRefreshToken) {
      throw new Error("No refresh token provided");
    }

    // 1. If this token was already refreshed in the last 30 seconds, return the same active tokens
    const cached = recentRefreshes.get(oldRefreshToken);
    if (cached && (Date.now() - cached.timestamp < 30000)) {
      return cached.tokenData;
    }

    // 2. If a refresh is currently in-flight for this token, await the shared promise
    if (inFlightRefreshes.has(oldRefreshToken)) {
      return await inFlightRefreshes.get(oldRefreshToken);
    }

    const refreshPromise = (async () => {
      try {
        // Verify Refresh Token is valid or not
        const { tokenDetails, error } = await verifyRefreshToken(oldRefreshToken);

        if (error) {
          throw new Error(`Invalid refresh token: ${error.message || 'Unknown error'}`);
        }

        // Find User based on Refresh Token detail id
        const user = await User.findById(tokenDetails._id);

        if (!user) {
          throw new Error("User not found");
        }

        // Reject refresh token if issued before last password change
        if (user.passwordChangedAt && tokenDetails.iat) {
          const passwordChangedTime = Math.floor(user.passwordChangedAt.getTime() / 1000);
          if (tokenDetails.iat < passwordChangedTime) {
            throw new Error("Refresh token was issued before the last password change");
          }
        }

        // Additional verification: check if token still exists and is not blacklisted
        const userRefreshToken = await UserRefreshToken.findOne({
          userId: tokenDetails._id,
          token: oldRefreshToken,
          blacklisted: false
        });

        if (!userRefreshToken) {
          throw new Error("Refresh token not found in database or is blacklisted");
        }

        // Generate new access and refresh tokens
        const { accessToken, refreshToken, accessTokenExp, refreshTokenExp } = await generateTokens(
          user,
          userRefreshToken.platform || "web",
          userRefreshToken.deviceId
        );

        const tokenData = {
          newAccessToken: accessToken,
          newRefreshToken: refreshToken,
          newAccessTokenExp: accessTokenExp,
          newRefreshTokenExp: refreshTokenExp
        };

        recentRefreshes.set(oldRefreshToken, {
          tokenData,
          timestamp: Date.now()
        });

        return tokenData;
      } finally {
        inFlightRefreshes.delete(oldRefreshToken);
      }
    })();

    inFlightRefreshes.set(oldRefreshToken, refreshPromise);
    return await refreshPromise;

  } catch (error) {
    console.error("❌ RefreshAccessToken error:", error.message);
    throw error;
  }
};

export { refreshAccessToken };