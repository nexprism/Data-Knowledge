const setTokensCookies = (res, accessToken, refreshToken, accessTokenMaxAge, refreshTokenMaxAge) => {
  // Determine if connection is HTTPS (direct, via reverse proxy like Render, or in production)
  const isSecure =
    res.req?.secure ||
    res.req?.protocol === "https" ||
    res.req?.headers?.["x-forwarded-proto"] === "https" ||
    process.env.NODE_ENV === "production";

  // For cross-origin requests (e.g. Vercel frontend -> Render backend), SameSite must be 'none' when Secure is true.
  const sameSiteOption = isSecure ? "none" : "lax";

  // Default expirations for production
  const oneHour = 60 * 60 * 1000;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  const accessAge = accessTokenMaxAge || oneHour;
  const refreshAge = refreshTokenMaxAge || thirtyDays;

  if (typeof res?.cookie === 'function') {
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: sameSiteOption,
      maxAge: accessAge,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: sameSiteOption,
      maxAge: refreshAge,
    });

    res.cookie("is_auth", true, {
      httpOnly: false,
      secure: isSecure,
      sameSite: sameSiteOption,
      maxAge: refreshAge, // is_auth represents the overall session duration (refresh token)
    });
  }
};

const clearTokensCookies = (res) => {
  const isSecure =
    res.req?.secure ||
    res.req?.protocol === "https" ||
    res.req?.headers?.["x-forwarded-proto"] === "https" ||
    process.env.NODE_ENV === "production";
  const sameSiteOption = isSecure ? "none" : "lax";

  if (typeof res?.clearCookie === 'function') {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: isSecure,
      sameSite: sameSiteOption,
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isSecure,
      sameSite: sameSiteOption,
    });
    res.clearCookie("is_auth", {
      httpOnly: false,
      secure: isSecure,
      sameSite: sameSiteOption,
    });
  }
};

export { setTokensCookies, clearTokensCookies };