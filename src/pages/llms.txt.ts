import { getCollection } from "astro:content";

export async function GET() {
  const projects = (await getCollection("projects")).sort(
    (a, b) => a.data.order - b.data.order,
  );
  const body = [
    "# Zerun Niu",
    "> AI researcher and ML systems engineer working on reliable and efficient AI.",
    "",
    "## Canonical resources",
    "- [Screened agent knowledge](https://zerunniu.github.io/agent-context.md)",
    "- [Publications](https://zerunniu.github.io/publications)",
    "- [Experience](https://zerunniu.github.io/experience)",
    "- [CV](https://zerunniu.github.io/cv)",
    "",
    "## Projects",
    ...projects.map(
      (project) =>
        `- [${project.data.shortTitle}](https://zerunniu.github.io/projects/${project.id}): ${project.data.summary}`,
    ),
    "",
    "Under-review work must remain labelled under review.",
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
