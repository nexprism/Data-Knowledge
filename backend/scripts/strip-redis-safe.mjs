import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.join(root, "..");

const skipFiles = new Set([
  "userController.js",
  "checkoutController.js",
  "textLessonController.js",
  "settingController.js",
]);

const controllersDir = path.join(root, "controllers");
const files = fs.readdirSync(controllersDir).filter((f) => f.endsWith(".js") && !skipFiles.has(f));

function stripRedisFromSource(source) {
  const lines = source.split(/\r?\n/);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/import \{ initRedis \}/.test(line)) {
      i++;
      continue;
    }
    if (/^\s*const redis = await initRedis\(\);\s*$/.test(line)) {
      i++;
      continue;
    }
    if (/^\s*await redis\./.test(line)) {
      i++;
      continue;
    }
    if (/^\s*if \(redis\)/.test(line)) {
      // skip until closing brace of if block (single-level)
      i++;
      while (i < lines.length && !/^\s*\}\s*$/.test(lines[i])) i++;
      if (i < lines.length) i++;
      continue;
    }
    if (/^\s*if \(cached/.test(line)) {
      i++;
      while (i < lines.length && !/^\s*\}\s*$/.test(lines[i])) i++;
      if (i < lines.length) i++;
      continue;
    }
    if (/^\s*const cached\w* = await redis\.get/.test(line)) {
      i++;
      continue;
    }
    out.push(line);
    i++;
  }
  return out.join("\n");
}

for (const file of files) {
  const rel = `backend/controllers/${file}`;
  let source;
  try {
    source = execSync(`git show HEAD:${rel}`, { cwd: repoRoot, encoding: "utf8" });
  } catch {
    console.warn("skip (no git)", file);
    continue;
  }
  if (!source.includes("initRedis") && !source.includes("redis.")) {
    continue;
  }
  const stripped = stripRedisFromSource(source);
  fs.writeFileSync(path.join(controllersDir, file), stripped);
  console.log("processed", file);
}
