import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const required = [
  "index.html",
  "projects/brave/index.html",
  "publications/index.html",
  "experience/index.html",
  "notes/index.html",
  "cv/index.html",
  "privacy/index.html",
  "agent-context.md",
  "llms.txt",
  "sitemap-index.xml",
  "rss.xml",
  "assets/Zerun_Niu_Research_Engineer_Resume.pdf",
  "assets/Zerun_Niu_Academic_CV.pdf",
  "assets/og-zerun-lab.png",
];

for (const file of required) {
  await fs.access(path.join(dist, file));
}

const files = [];
async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(absolute);
    else files.push(absolute);
  }
}
await walk(dist);

const forbidden = [
  /(?:sk|xi)-[A-Za-z0-9_-]{20,}/,
  /ELEVENLABS_API_KEY\s*[:=]\s*[^\s<]+/,
  /TURNSTILE_SECRET_KEY\s*[:=]\s*[^\s<]+/,
];
for (const file of files.filter((file) =>
  /\.(?:html|js|css|md|txt|json)$/.test(file),
)) {
  const contents = await fs.readFile(file, "utf8");
  for (const pattern of forbidden)
    if (pattern.test(contents))
      throw new Error(`Potential secret in ${path.relative(root, file)}`);
}

console.log(
  `Verified ${required.length} required artifacts and scanned ${files.length} build files for secrets.`,
);
