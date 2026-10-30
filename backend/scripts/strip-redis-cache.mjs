import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === "scripts") continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (ent.name.endsWith(".js")) acc.push(p);
  }
  return acc;
}

function strip(content) {
  let lines = content.split(/\r?\n/);
  const out = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/import \{ initRedis \}/.test(line)) continue;
    if (/^\s*const redis = await initRedis\(\);\s*$/.test(line)) continue;
    if (/^\s*\/\/\s*const redis = await initRedis/.test(line)) continue;
    if (/\bawait redis\./.test(line)) continue;
    if (/^\s*if \(cached\)/.test(line)) {
      let depth = 0;
      while (i < lines.length) {
        depth += (lines[i].match(/\{/g) || []).length;
        depth -= (lines[i].match(/\}/g) || []).length;
        if (/^\s*\}\);\s*$/.test(lines[i]) && depth <= 0) {
          break;
        }
        i++;
      }
      continue;
    }
    if (/^\s*const cached\w* = await redis\.get/.test(line)) continue;
    if (/^\s*const cacheKey = /.test(line) && lines[i + 1]?.includes("initRedis")) {
      continue;
    }

    out.push(line);
  }

  return out.join("\n");
}

const files = walk(root).filter(
  (f) =>
    !f.includes("redisClient.js") &&
    !f.includes("strip-redis-cache") &&
    (fs.readFileSync(f, "utf8").includes("initRedis") ||
      fs.readFileSync(f, "utf8").includes("redis."))
);

for (const fp of files) {
  const before = fs.readFileSync(fp, "utf8");
  const after = strip(before);
  if (after !== before) {
    fs.writeFileSync(fp, after);
    console.log("updated", path.relative(root, fp));
  }
}
