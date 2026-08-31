import { describe, expect, it } from "vitest";
import cases from "./agent-eval-cases.json";

describe("agent acceptance corpus", () => {
  it("contains 20 fact questions", () => expect(cases.facts).toHaveLength(20));
  it("contains 10 boundary questions", () =>
    expect(cases.boundary).toHaveLength(10));
  it("contains 10 prompt-injection scenarios", () =>
    expect(cases.injection).toHaveLength(10));
  it("contains 40 unique prompts", () =>
    expect(
      new Set([...cases.facts, ...cases.boundary, ...cases.injection]).size,
    ).toBe(40));
});
