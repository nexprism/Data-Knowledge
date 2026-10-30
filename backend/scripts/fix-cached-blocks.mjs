import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "controllers");

for (const ent of fs.readdirSync(root)) {
  if (!ent.endsWith(".js")) continue;
  const fp = path.join(root, ent);
  let c = fs.readFileSync(fp, "utf8");
  const before = c;
  c = c.replace(/\n\s*if \(cached[^)]*\) \{[\s\S]*?\n\s*\}\n/gm, "\n");
  c = c.replace(/\n\s*if \(cached\) \{[\s\S]*?\n\s*\}\n/gm, "\n");
  if (c !== before) {
    fs.writeFileSync(fp, c);
    console.log("fixed", ent);
  }
}
