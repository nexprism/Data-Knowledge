import JWT from "passport-jwt";
import User from "../models/user.js";
import passport from "passport";
import { ServerConfig } from "./server.config.js";
import { isAccessTokenBlacklisted } from "../utils/tokens/generateTokens.js";

const JwtStrategy = JWT.Strategy;
const ExtractJwt = JWT.ExtractJwt;

// SECURITY: Fail fast at boot if the access-token secret is missing — a missing
// secret would cause tokens to be signed/verified with undefined, which some
// versions of jsonwebtoken accept (effectively no-signature tokens).
if (!ServerConfig.JWT_ACCESS_SECRET) {
  throw new Error(
    "FATAL: JWT_ACCESS_TOKEN_SECRET_KEY is required. " +
    "Please set JWT_ACCESS_TOKEN_SECRET_KEY in your environment variables."
  );
}

// Extract access token — prioritize Authorization header, fall back to cookie
const cookieExtractor = (req) =>
  req && req.cookies && req.cookies.accessToken ? req.cookies.accessToken : null;

const tokenExtractor = ExtractJwt.fromExtractors([
  ExtractJwt.fromAuthHeaderAsBearerToken(),
  cookieExtractor,
]);

const opts = {
  jwtFromRequest: tokenExtractor,
  secretOrKey: ServerConfig.JWT_ACCESS_SECRET,
  // SECURITY: Restrict accepted algorithms to HS256 (how tokens are signed).
  // Prevents alg:none and RSA/ECDSA confusion attacks.
  algorithms: ["HS256"],
  // Needed so the verify callback can re-extract the raw token for blacklist check.
  passReqToCallback: true,
};

passport.use(
  "jwt",
  new JwtStrategy(opts, async function (req, jwt_payload, done) {
    try {
      // SECURITY: centrally enforce token revocation. Logout and forced device
      // deauthorisation blacklist access tokens in Redis; without this check,
      // routes gated only by passport kept accepting revoked tokens until natural
      // TTL expiry.
      const rawToken = tokenExtractor(req);
      if (rawToken && (await isAccessTokenBlacklisted(rawToken, jwt_payload))) {
        return done(null, false);
      }

      const user = await User.findOne({ _id: jwt_payload._id }).select("-password");
      if (!user) {
        return done(null, false);
      }

      // Reject banned / inactive users at the authentication layer so every
      // JWT-protected route is covered without per-route middleware.
      if (user.isBanned === true || user.status === "inactive" || user.isActive === false) {
        return done(null, false);
      }

      // SECURITY: reject access tokens issued BEFORE the user's last password
      // change — guarantees stolen tokens die when the password is changed.
      if (user.passwordChangedAt && jwt_payload.iat) {
        const changedAtSec = Math.floor(new Date(user.passwordChangedAt).getTime() / 1000);
        if (jwt_payload.iat < changedAtSec) {
          return done(null, false);
        }
      }

      return done(null, user);
    } catch (error) {
      console.error("JWT Strategy Error:", error);
      return done(error, false);
    }
  })
);

export default passport;
