import linksRepository from "../../link/link.repository";
import { Link, Query } from "../../link/link.types";

export function getThrownError(fn: () => void) {
  try {
    fn();
  } catch (error) {
    return error;
  }

  throw "The test expected the tested function to throw, but nothing was thrown.";
}

export function stringfyQuery(query: Query) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === "string") {
      params.append(key, value);
      return;
    }

    value.forEach((str) => params.append(key, str));
  });

  return params.toString();
}

export function mockRepositoryInitialDataForTests() {
  linksRepository.clear();

  const initialLinks: Link[] = [
    {
      id: "123e4567-e89b-12d3-a456-426614174001",
      title: "Google",
      url: "https://www.google.com",
      category: "search",
      tags: ["search", "web"],
      clicks: 0,
      createdAt: new Date("2024-01-01T00:00:00.000Z").toISOString(),
    },
    {
      id: "123e4567-e89b-12d3-a456-426614174002",
      title: "GitHub",
      url: "https://github.com",
      category: "development",
      tags: ["code", "git"],
      clicks: 0,
      createdAt: new Date("2024-01-02T00:00:00.000Z").toISOString(),
    },
    {
      id: "123e4567-e89b-12d3-a456-426614174003",
      title: "MDN Web Docs",
      url: "https://developer.mozilla.org",
      category: "documentation",
      tags: ["web", "reference"],
      clicks: 0,
      createdAt: new Date("2024-01-03T00:00:00.000Z").toISOString(),
    },
  ];

  for (const link of initialLinks) {
    linksRepository.set(link.id, link);
  }
}
