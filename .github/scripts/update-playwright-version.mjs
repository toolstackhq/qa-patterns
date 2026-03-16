import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const nextVersion = process.argv[2];

if (!nextVersion) {
  throw new Error("Usage: node .github/scripts/update-playwright-version.mjs <version>");
}

const targets = [
  "templates/playwright-template/package.json",
  "tools/create-qa-patterns/templates/playwright-template/package.json"
];

for (const target of targets) {
  const filePath = path.resolve(process.cwd(), target);
  const packageJson = JSON.parse(fs.readFileSync(filePath, "utf8"));
  packageJson.devDependencies["@playwright/test"] = `^${nextVersion}`;
  fs.writeFileSync(filePath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
}
