// The site is a single page plus /privacy and one project deep-dive
// (/projects/brave). Client tools may only resolve to these exact routes /
// in-page anchors.
export const allowedPaths = new Set([
  "/",
  "/privacy",
  "/projects/brave",
  "/#research",
  "/#systems",
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
  if (!allowedProjects.has(slug)) return null;
  // BRAVE has its own deep-dive page; the rest scroll to their homepage card.
  return slug === "brave" ? "/projects/brave" : `/#p-${slug}`;
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
