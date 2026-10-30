/**
 * Logs duration for hot admin API paths. Controllers may set res.locals.docCount.
 */
const TIMED_PREFIXES = [
  "/students",
  "/courses",
  "/enrollment",
  "/sales-analytics",
  "/project-analytics",
];

function shouldTime(path) {
  return TIMED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export default function adminTimingMiddleware(req, res, next) {
  if (req.method === "OPTIONS" || !shouldTime(req.path)) {
    return next();
  }

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    const role = req.user?.role ?? "anonymous";
    const docCount =
      res.locals.docCount !== undefined ? ` docs=${res.locals.docCount}` : "";
    const slow = durationMs >= 2000 ? " [SLOW]" : "";
    console.log(
      `[admin-timing]${slow} ${req.method} ${req.path} ${Math.round(durationMs)}ms role=${role}${docCount} status=${res.statusCode}`
    );
  });

  next();
}
