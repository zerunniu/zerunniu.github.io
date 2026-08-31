export const allowedPaths = new Set([
  "/",
  "/projects",
  "/publications",
  "/experience",
  "/notes",
  "/cv",
  "/privacy",
]);
export const allowedProjects = new Set([
  "brave",
  "wasecom",
  "fedeq",
  "dual-group-website",
  "fedylora",
  "ai-study-assistant",
  "vit-jscc",
]);
export const allowedEvidence = new Set([
  "brave-metrics",
  "brave-mechanism",
  "wasecom-robustness",
  "fedeq-system",
  "dual-deployment",
]);
export const allowedTags = new Set([
  "Reliable ML",
  "Federated learning",
  "Semantic communication",
  "Calibration",
  "Edge AI",
  "Research communication",
]);
export const allowedResume = new Set(["industry", "academic"]);

export function projectPath(slug: string) {
  return allowedProjects.has(slug) ? `/projects/${slug}` : null;
}

export function researchFilterPath(tag: string) {
  return allowedTags.has(tag)
    ? `/projects?tag=${encodeURIComponent(tag)}`
    : null;
}

export function resumePath(variant: string) {
  if (!allowedResume.has(variant)) return null;
  return variant === "industry"
    ? "/assets/Zerun_Niu_Research_Engineer_Resume.pdf"
    : "/assets/Zerun_Niu_Academic_CV.pdf";
}
