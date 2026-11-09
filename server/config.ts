import fs from "fs";
import path from "path";

const envFiles = [
  path.join(process.cwd(), ".env"),
  path.join(process.cwd(), "server", ".env"),
];

for (const envFile of envFiles) {
  if (!fs.existsSync(envFile)) continue;
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;

    const value = match[2].replace(/^(['"])(.*)\1$/, "$2");
    process.env[match[1]] = value;
  }
}
