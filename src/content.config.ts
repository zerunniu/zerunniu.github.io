import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

const link = z.object({ label: z.string(), url: z.url() });

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    shortTitle: z.string(),
    status: z.enum([
      "published",
      "under-review",
      "submitted",
      "active",
      "completed",
    ]),
    period: z.string(),
    summary: z.string(),
    role: z.string(),
    tags: z.array(z.string()),
    metrics: z
      .array(z.object({ value: z.string(), label: z.string() }))
      .default([]),
    links: z.array(link).default([]),
    featured: z.boolean().default(false),
    workstation: z
      .enum(["channel", "equilibrium", "evidence", "interface"])
      .optional(),
    accent: z.enum(["cyan", "indigo", "orange", "violet"]).default("cyan"),
    agentSummary: z.string(),
    order: z.number().default(99),
  }),
});

const publications = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/publications",
  }),
  schema: z.object({
    title: z.string(),
    year: z.number(),
    venue: z.string(),
    status: z.enum([
      "published",
      "accepted",
      "under-review",
      "submitted",
      "preprint",
    ]),
    authors: z.array(z.string()),
    abstract: z.string(),
    doi: z.string().optional(),
    arxiv: z.string().optional(),
    openreview: z.url().optional(),
    project: reference("projects").optional(),
    selected: z.boolean().default(false),
  }),
});

const experience = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/experience" }),
  schema: z.object({
    role: z.string(),
    organisation: z.string(),
    start: z.string(),
    end: z.string(),
    location: z.string(),
    summary: z.string(),
    evidence: z.array(z.string()),
    kind: z.enum(["research", "teaching", "education"]),
    order: z.number(),
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    tags: z.array(z.string()),
    draft: z.boolean().default(false),
  }),
});

const profile = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/profile" }),
  schema: z.object({
    name: z.string(),
    headline: z.string(),
    email: z.email(),
    location: z.string(),
    summary: z.string(),
    socials: z.array(link),
    researchInterests: z.array(z.string()),
    skillGroups: z.array(
      z.object({ category: z.string(), skills: z.array(z.string()) }),
    ),
  }),
});

export const collections = {
  projects,
  publications,
  experience,
  notes,
  profile,
};
