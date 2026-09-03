// The site is a single page plus /privacy. Client tools may only resolve to
// these exact routes / in-page anchors.
export const allowedPaths = new Set([
  "/",
  "/privacy",
  "/#research",
  "/#publications",
  "/#experience",
  "/#digital-zerun",
  "/#contact",
]);
export const allowedProjects = new Set([
  "brave",
  "wasecom",
  "fedeq",
  "dual-group-website",
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
  return allowedProjects.has(slug) ? `/#p-${slug}` : null;
}

export function researchFilterPath(tag: string) {
  return allowedTags.has(tag) ? "/#research" : null;
}

export function resumePath(variant: string) {
  if (!allowedResume.has(variant)) return null;
  return variant === "industry"
    ? "/assets/Zerun_Niu_Research_Engineer_Resume.pdf"
    : "/assets/Zerun_Niu_Academic_CV.pdf";
}
