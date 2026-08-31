import { promises as fs } from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
const site = new URL("https://zerunniu.github.io/");
const htmlFiles = [];

async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(absolute);
    else if (entry.name.endsWith(".html")) htmlFiles.push(absolute);
  }
}

async function exists(absolute) {
  try {
    await fs.access(absolute);
    return true;
  } catch {
    return false;
  }
}

function routeFor(file) {
  const relative = path.relative(dist, file).split(path.sep).join("/");
  if (relative === "index.html") return "/";
  return `/${relative.replace(/index\.html$/, "")}`;
}

function candidateFiles(pathname) {
  const clean = decodeURIComponent(pathname)
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  if (!clean) return [path.join(dist, "index.html")];
  if (pathname.endsWith("/"))
    return [
      path.join(dist, clean, "index.html"),
      path.join(dist, `${clean}.html`),
    ];
  if (path.extname(clean)) return [path.join(dist, clean)];
  return [
    path.join(dist, clean),
    path.join(dist, `${clean}.html`),
    path.join(dist, clean, "index.html"),
  ];
}

await walk(dist);
const failures = [];
let checked = 0;

for (const file of htmlFiles) {
  const html = await fs.readFile(file, "utf8");
  const base = new URL(routeFor(file), site);
  const attributes = html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g);
  for (const [, raw] of attributes) {
    if (/^(?:mailto:|tel:|data:|javascript:)/i.test(raw)) continue;
    let resolved;
    try {
      resolved = new URL(raw, base);
    } catch {
      failures.push(`${path.relative(dist, file)} -> invalid URL: ${raw}`);
      continue;
    }
    if (resolved.origin !== site.origin) continue;
    checked += 1;
    const candidates = candidateFiles(resolved.pathname);
    const target = (
      await Promise.all(
        candidates.map(async (candidate) =>
          (await exists(candidate)) ? candidate : null,
        ),
      )
    ).find(Boolean);
    if (!target) {
      failures.push(
        `${path.relative(dist, file)} -> missing ${resolved.pathname}`,
      );
      continue;
    }
    if (resolved.hash && target.endsWith(".html")) {
      const targetHtml = await fs.readFile(target, "utf8");
      const id = decodeURIComponent(resolved.hash.slice(1)).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );
      if (id && !new RegExp(`\\bid=["']${id}["']`).test(targetHtml)) {
        failures.push(
          `${path.relative(dist, file)} -> missing anchor ${resolved.pathname}${resolved.hash}`,
        );
      }
    }
  }
}

if (failures.length)
  throw new Error(`Internal link verification failed:\n${failures.join("\n")}`);
console.log(
  `Verified ${checked} internal href/src references across ${htmlFiles.length} HTML files.`,
);
