import { promises as fs } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const root = process.cwd();

async function readCollection(name) {
  const directory = path.join(root, "src", "content", name);
  const files = (await fs.readdir(directory)).filter((file) =>
    file.endsWith(".md"),
  );
  return Promise.all(
    files.map(async (file) => {
      const raw = await fs.readFile(path.join(directory, file), "utf8");
      const frontmatter = raw.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatter) throw new Error(`Missing frontmatter: ${name}/${file}`);
      return { id: file.replace(/\.md$/, ""), ...parse(frontmatter[1]) };
    }),
  );
}

const [profiles, projects, publications, experience] = await Promise.all([
  readCollection("profile"),
  readCollection("projects"),
  readCollection("publications"),
  readCollection("experience"),
]);

await fs.mkdir(path.join(root, "tmp", "pdfs"), { recursive: true });
await fs.writeFile(
  path.join(root, "tmp", "pdfs", "resume-data.json"),
  JSON.stringify(
    { profile: profiles[0], projects, publications, experience },
    null,
    2,
  ),
);
