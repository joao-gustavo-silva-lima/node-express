import { Link, LinkProperty, Query } from "../types/link.types.js";

const linksRepository = new Map<number, Link>([
  [
    0,
    {
      id: "lnk_9f8a2b1c4e",
      title: "TypeScript Official Documentation",
      url: "https://www.typescriptlang.org/docs/",
      category: "Development",
      tags: ["typescript", "javascript", "docs", "frontend"],
      clicks: 1420,
      createdAt: new Date("2026-01-15T10:30:00Z"),
    },
  ],
]);

export const LinkService = {
  list: (query: Query) => {
    const links = [...linksRepository.values()];

    if (Object.keys(query).length === 0) {
      return links;
    }

    const queryEntries = Object.entries(query) as [LinkProperty, unknown][];

    return links.filter((link) =>
      queryEntries.every(([key, value]) => link[key].toString() === value),
    );
  },
  getByID: (id: string) => {
    return linksRepository.get(Number(id));
  },
};
