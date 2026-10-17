import jwt from "jsonwebtoken";
import { isAccessTokenBlacklisted } from "../utils/tokens/generateTokens.js";
import { clearTokensCookies } from "../utils/tokens/setTokensCookies.js";

const jwtBlacklistAuth = async (req, res, next) => {
  try {
    // Extract token from Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];

    // Check blacklist (await for Redis-based check)
    const blacklisted = await isAccessTokenBlacklisted(token, req.user);
    if (blacklisted) {
      clearTokensCookies(res);
      res.setHeader("X-Session-Expired", "true");
      return res.status(401).json({
        message: "Session expired. Please log in again.",
        isNewDeviceLogin: true,
      });
    }

    // Verify JWT signature and decode payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    clearTokensCookies(res);
    res.setHeader("X-Session-Expired", "true");
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default jwtBlacklistAuth;
