import { describe, expect, it } from "vitest";
import {
  allowedPaths,
  projectPath,
  researchFilterPath,
  resumePath,
} from "../src/lib/agentAllowlist";
import { readFileSync } from "node:fs";

const root = new URL("..", import.meta.url);
const brave = readFileSync(
  new URL("src/content/projects/brave.md", root),
  "utf8",
);
const privacy = readFileSync(new URL("src/pages/privacy.astro", root), "utf8");

describe("Digital Zerun public facts", () => {
  const facts = [
    "first author",
    "algorithm design",
    "literature review",
    "experimental design",
    "code implementation",
    "experimental deployment",
    "illusory evidence accumulation",
    "block-local",
    "global posterior",
    "controlled evidence feedback",
    "14 crowdsourcing benchmarks",
    "5/14",
    "9/14",
    "11/14",
    "0.03",
    "reward-model calibration transfer",
    "under review",
    "TMLR",
    "OpenReview",
    "Zerun Niu",
  ];
  it.each(facts)("contains the verified BRAVE fact: %s", (fact) =>
    expect(brave.toLowerCase()).toContain(fact.toLowerCase()),
  );
});

describe("client tool allowlists", () => {
  it("accepts exact local routes", () =>
    expect(allowedPaths.has("/publications")).toBe(true));
  it("rejects arbitrary URLs and traversal", () => {
    for (const value of [
      "https://evil.example",
      "javascript:alert(1)",
      "//evil.example",
      "/../admin",
      "/projects/brave?next=https://evil.example",
    ])
      expect(allowedPaths.has(value)).toBe(false);
  });
  it("accepts only known project slugs", () => {
    expect(projectPath("brave")).toBe("/projects/brave");
    expect(projectPath("../../privacy")).toBeNull();
  });
  it("accepts only known tags and resume variants", () => {
    expect(researchFilterPath("Calibration")).toContain("Calibration");
    expect(researchFilterPath("<script>")).toBeNull();
    expect(resumePath("industry")).toContain("Research_Engineer");
    expect(resumePath("https://evil.example")).toBeNull();
  });
});

describe("privacy and boundary policy", () => {
  const boundaries = [
    "salary",
    "visa",
    "private contact",
    "unpublished reviews",
    "Author Console",
    "promise",
    "employment",
    "meetings",
    "collaboration",
    "commitments",
  ];
  it.each(boundaries)("publishes the refusal boundary: %s", (boundary) =>
    expect(privacy.toLowerCase()).toContain(boundary.toLowerCase()),
  );
});
