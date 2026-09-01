import { getCollection } from "astro:content";

export async function GET() {
  const projects = (await getCollection("projects")).sort(
    (a, b) => a.data.order - b.data.order,
  );
  const body = [
    "# Zerun Niu",
    "> AI Research Engineer working on agentic AI and reliable ML: federated learning, semantic communication, calibration, and reproducible systems.",
    "",
    "## Canonical resources",
    "- [Site](https://zerunniu.github.io/)",
    "- [Screened agent knowledge](https://zerunniu.github.io/agent-context.md)",
    "- [Industry résumé (PDF)](https://zerunniu.github.io/assets/Zerun_Niu_Research_Engineer_Resume.pdf)",
    "- [Academic CV (PDF)](https://zerunniu.github.io/assets/Zerun_Niu_Academic_CV.pdf)",
    "- [Privacy](https://zerunniu.github.io/privacy)",
    "",
    "## Projects",
    ...projects.map(
      (project) =>
        `- ${project.data.shortTitle}: ${project.data.summary}`,
    ),
    "",
    "Under-review work must remain labelled under review.",
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
