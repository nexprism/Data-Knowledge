import { Token } from "../utils/index.js";
import jwt from "jsonwebtoken";
import DeviceApproval from "../models/DeviceApproval.js";
import UserRefreshToken from "../models/UserRefreshToken.js";

const accessTokenAutoRefresh = async (req, res, next) => {
  try {
    // Read access token — prioritize headers over cookies
    // This prevents stale cookies from overriding valid tokens sent by the frontend
    let accessToken =
      req.headers["x-access-token"] ||
      (req.headers["authorization"]?.startsWith("Bearer ")
        ? req.headers["authorization"].slice(7)
        : null) ||
      req.cookies?.accessToken;

    // Handle JSON parsing for headers if needed
    if (typeof accessToken === "string" && accessToken.startsWith("{")) {
      try {
        accessToken = JSON.parse(accessToken);
      } catch (e) {
        // If parsing fails, use the string as is
      }
    }

    // Verify token signature to get user info (needed for admin bypass in blacklist check)
    // Use jwt.verify() — NOT jwt.decode() — so forged tokens cannot claim admin role
    let decodedUser = null;
    if (accessToken) {
      try {
        decodedUser = jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN_SECRET_KEY || process.env.JWT_ACCESS_SECRET);
      } catch (e) {
        // Token is invalid/expired — decodedUser stays null; refresh flow handles it below
      }
    }

    // Check if access token is blacklisted before proceeding
    // Pass decoded user so admins can bypass the blacklist check
    if (accessToken && decodedUser) {
      const isBlacklisted = await Token.isAccessTokenBlacklisted(accessToken, decodedUser);
      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          isNewDeviceLogin: true,
          message: "Session expired. Please log in again.",
        });
      }
    }

    // If access token is valid and not blacklisted, check device approval and proceed
    if (decodedUser) {
      req.headers["authorization"] = `Bearer ${accessToken}`;

      // Device approval guard for existing access tokens
      try {
        const decoded = decodedUser;
        const platform = decoded?.platform;

        const bypassPaths = [
          "/device-approval/request",
          "/device-approval/status",
          "/device-approvals",
          "/device-approvals/manage"
        ];
        const cleanPath = req.path.replace(/\/$/, "");
        const isBypass = bypassPaths.some(p => cleanPath.endsWith(p));

        if (platform && platform !== "web" && decoded?._id && !isBypass) {
          const deviceId =
            req.query.deviceId || req.headers["x-device-id"] || req.body?.deviceId;
          if (deviceId) {
            const deviceApproval = await DeviceApproval.findOne({
              userId: decoded._id,
              deviceId,
            }).sort({ requestedAt: -1 });
            const approved =
              deviceApproval?.status === "approved" && deviceApproval?.isActive === true;
            if (!approved) {
              let message = "Device approval required";
              if (deviceApproval) {
                if (deviceApproval.status === "pending") {
                  message = "Device approval pending";
                } else if (deviceApproval.status === "rejected") {
                  message = "Device rejected by admin";
                } else if (deviceApproval.status === "approved" && !deviceApproval.isActive) {
                  message = "Device deactivated. Please request approval again.";
                  // Auto-transition back to pending so it shows on the Admin panel
                  deviceApproval.status = "pending";
                  deviceApproval.approvedBy = undefined;
                  deviceApproval.rejectionReason = undefined;
                  deviceApproval.requestedAt = new Date();
                  await deviceApproval.save();
                }
              } else {
                message = "Device not registered";
              }

              return res.status(403).json({
                success: false,
                message,
                data: {
                  deviceStatus: deviceApproval?.status || "no_device",
                  deviceApproval: deviceApproval ? {
                    id: deviceApproval._id,
                    status: deviceApproval.status,
                    isActive: deviceApproval.isActive,
                  } : null,
                },
                err: { message: "Device not approved", requiresApproval: true },
              });
            }
          }
        }
      } catch (deviceCheckErr) {
        console.error("Device approval check failed:", deviceCheckErr);
      }

      return next();
    }

    // If access token is missing or expired, try to refresh it
    // Read refresh token from cookies or custom header `X-Refresh-Token`
    let refreshToken = req.cookies?.refreshToken || req.headers["x-refresh-token"];

    // Handle JSON parsing for headers if needed
    if (typeof refreshToken === "string" && refreshToken.startsWith("{")) {
      try {
        refreshToken = JSON.parse(refreshToken);
      } catch (e) {
        // If parsing fails, use the string as is
      }
    }

    if (!refreshToken) {
      // If refresh token is also missing, return an unauthorized response
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Access and refresh tokens are missing or invalid",
      });
    }

    try {
      // Blacklist old access token if it had not already expired
      if (accessToken && decodedUser) {
        const exp = decodedUser?.exp ? decodedUser.exp * 1000 : Date.now();
        if (!(decodedUser?.role === "admin" || decodedUser?.roles?.includes("admin"))) {
          await Token.blacklistAccessToken(accessToken, exp);
        }
      }

      // Refresh the access token using the refresh token
      const tokenData = await Token.refreshAccessToken(req, res);

      if (!tokenData) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Failed to refresh access token",
        });
      }

      const {
        newAccessToken,
        newRefreshToken,
        newAccessTokenExp,
        newRefreshTokenExp,
      } = tokenData;

      // Set the new access and refresh tokens as HTTP-only cookies
      Token.setTokensCookies(
        res,
        newAccessToken,
        newRefreshToken,
        newAccessTokenExp,
        newRefreshTokenExp
      );

      // Set response headers so the frontend can capture and persist new tokens
      res.setHeader("x-access-token", newAccessToken);
      res.setHeader("x-refresh-token", newRefreshToken);

      // Set the new access token in both Authorization header and req.cookies for passport
      req.headers["authorization"] = `Bearer ${newAccessToken}`;
      if (!req.cookies) req.cookies = {};
      req.cookies.accessToken = newAccessToken;

      // Device approval guard: prevent token refresh for unapproved devices
      try {
        const decoded = jwt.decode(newAccessToken);
        const platform = decoded?.platform;

        const bypassPaths = [
          "/device-approval/request",
          "/device-approval/status",
          "/device-approvals",
          "/device-approvals/manage"
        ];
        const cleanPath = req.path.replace(/\/$/, "");
        const isBypass = bypassPaths.some(p => cleanPath.endsWith(p));

        if (platform && platform !== "web" && !isBypass) {
          const refreshTokenRec = await UserRefreshToken.findOne({
            token: refreshToken,
            blacklisted: false,
          });
          const deviceId = refreshTokenRec?.deviceId;
          if (deviceId && decoded?._id) {
            const deviceApproval = await DeviceApproval.findOne({
              userId: decoded._id,
              deviceId,
            }).sort({ requestedAt: -1 });
            const approved =
              deviceApproval?.status === "approved" && deviceApproval?.isActive === true;
            if (!approved) {
              let message = "Device approval required";
              if (deviceApproval) {
                if (deviceApproval.status === "pending") {
                  message = "Device approval pending";
                } else if (deviceApproval.status === "rejected") {
                  message = "Device rejected by admin";
                } else if (deviceApproval.status === "approved" && !deviceApproval.isActive) {
                  message = "Device deactivated. Please request approval again.";
                  // Auto-transition back to pending so it shows on the Admin panel
                  deviceApproval.status = "pending";
                  deviceApproval.approvedBy = undefined;
                  deviceApproval.rejectionReason = undefined;
                  deviceApproval.requestedAt = new Date();
                  await deviceApproval.save();
                }
              } else {
                message = "Device not registered";
              }

              return res.status(403).json({
                success: false,
                message,
                data: {
                  deviceStatus: deviceApproval?.status || "no_device",
                  deviceApproval: deviceApproval ? {
                    id: deviceApproval._id,
                    status: deviceApproval.status,
                    isActive: deviceApproval.isActive,
                  } : null,
                },
                err: { message: "Device not approved", requiresApproval: true },
              });
            }
          }
        }
      } catch (deviceCheckErr) {
        console.error("Device approval check during refresh failed:", deviceCheckErr);
      }

      return next(); // Proceed to the next middleware
    } catch (refreshError) {
      console.error("Error during token refresh:", refreshError);
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Failed to refresh access token or token is invalid",
      });
    }
  }
  catch (error) {
    // Log error and send a response if something goes wrong
    console.error("Error in accessTokenAutoRefresh:", error);
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Authentication error",
    });
  }
};

export default accessTokenAutoRefresh;
