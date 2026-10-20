import accessTokenAutoRefresh from "./accessTokenAutoRefresh.js";

/**
 * Runs accessTokenAutoRefresh only when the request actually carries tokens.
 * If no access/refresh token is present (guest user), it simply proceeds
 * without authentication so public endpoints (e.g. consultation booking)
 * are not blocked with a 401.
 */
const readToken = (req) =>
  req.headers["x-access-token"] ||
  (req.headers["authorization"]?.startsWith("Bearer ")
    ? req.headers["authorization"].slice(7)
    : null) ||
  req.cookies?.accessToken ||
  req.cookies?.refreshToken ||
  req.headers["x-refresh-token"];

const optionalTokenAutoRefresh = (req, res, next) => {
  if (!readToken(req)) {
    return next();
  }
  return accessTokenAutoRefresh(req, res, next);
};

export default optionalTokenAutoRefresh;
