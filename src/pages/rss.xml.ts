import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context: { site?: URL }) {
  const notes = await getCollection("notes", ({ data }) => !data.draft);
  return rss({
    title: "Zerun Niu — Research Notes",
    description:
      "Notes on reliable AI, semantic communication, federated learning, and ML systems.",
    site: context.site ?? new URL("https://zerunniu.github.io"),
    items: notes.map((note) => ({
      title: note.data.title,
      description: note.data.summary,
      pubDate: note.data.date,
      link: `/notes/${note.id}/`,
    })),
  });
}
