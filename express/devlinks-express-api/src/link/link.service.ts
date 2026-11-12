import { randomUUID } from "node:crypto";
import { Link, LinkInput, Query } from "./link.types.js";
import { StatefulError } from "../common/utils/stateful-error.utils.js";

const linksRepository = new Map<string, Link>();

export function list(query: Query) {
  const links = [...linksRepository.values()].map((obj) => ({ ...obj }));

  return links.filter((link) => linkSatisfiesQuery(link, query));
}

export function linkSatisfiesQuery(link: Link, query: Query) {
  const matchesTitle =
    !query.title ||
    query.title === "" ||
    link.title.toLowerCase().includes(query.title.toLowerCase());

  const matchesTags =
    !query.tags || query.tags.some((tag) => link.tags.includes(tag));

  const matchesCategory =
    !query.category ||
    query.category === "" ||
    link.category.toLowerCase() === query.category.toLowerCase();

  return matchesTitle && matchesTags && matchesCategory;
}

export function getByID(id: string): Link {
  return { ..._getByID(id) };
}

function _getByID(id: string): Link {
  if (!linksRepository.has(id)) {
    throw new StatefulError(404, `Link within ID '${id}' not found`);
  }

  return linksRepository.get(id)!;
}

export function register(linkPrototype: LinkInput) {
  validatePrototypeUniqueness(linkPrototype);

  const newID = randomUUID();

  if (linksRepository.has(newID)) {
    throw new StatefulError(
      500,
      `Server Internal Error: The server-side generated ID '${newID}' collided a pre-existent one`,
    );
  }

  const newLink: Link = {
    id: newID,
    title: linkPrototype.title,
    url: linkPrototype.url,
    category: linkPrototype.category ?? "",
    tags: linkPrototype.tags ?? [],
    clicks: 0,
    createdAt: new Date().toISOString(),
  };

  linksRepository.set(newLink.id, newLink);

  return { ...newLink };
}

function validatePrototypeUniqueness(
  parsingLink: LinkInput,
  exceptiveOwnId?: string,
) {
  for (const link of linksRepository.values()) {
    if (
      link.url !== parsingLink.url ||
      (exceptiveOwnId ? link.id === exceptiveOwnId : false)
    ) {
      continue;
    }

    throw new StatefulError(
      409,
      `Write Conflict: A link within URL '${parsingLink.url}' already exists`,
    );
  }
}

export function deleteByID(id: string) {
  _getByID(id);
  linksRepository.delete(id);
}

export function updateByID(id: string, modifyingPrototype: LinkInput) {
  validatePrototypeUniqueness(modifyingPrototype, id);

  const updatingLink = {
    ...getByID(id),
    ...modifyingPrototype,
  } as Link;

  linksRepository.set(id, updatingLink);

  return { ...updatingLink };
}

export function redirectByID(id: string): string {
  const link = _getByID(id);

  link.clicks++;

  return link.url;
}

export function _clearRepositoryForTests() {
  linksRepository.clear();
}

export function _mockRepositoryInitialDataForTests() {
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
