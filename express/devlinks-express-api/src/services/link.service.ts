import { ILink, LinkID, Query } from "../types/link.types.js";

const linksRepository = new Map<LinkID, ILink>([
  [
    "lnk_9f8a2b1c4e",
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
    const links = linksRepository.values();

    if (Object.keys(query).length === 0) {
      return [...links];
    }

    //Validate Query [WIP]
  },
};
