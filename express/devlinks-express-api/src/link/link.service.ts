import { randomUUID } from "node:crypto";
import { Link, LinkInput, Query } from "./link.types.js";
import { StatefulError } from "../common/utils/stateful-error.utils.js";
import linksRepository from "./link.repository.js";

export function list(query: Query) {
  const links = [...linksRepository.values()].map((obj) => ({ ...obj }));

  return links.filter((link) => linkSatisfiesQuery(link, query));
}

export function getByID(id: string): Link {
  if (!linksRepository.has(id)) {
    throw new StatefulError(404, `Link within ID '${id}' not found`);
  }

  return { ...linksRepository.get(id)! };
}

export function register(linkInput: LinkInput) {
  validateLinkUniqueness(linkInput);

  const newID = randomUUID();

  if (linksRepository.has(newID)) {
    throw new StatefulError(
      500,
      `Server Internal Error: The server-side generated ID '${newID}' collided a pre-existent one`,
    );
  }

  const newLink: Link = {
    id: newID,
    title: linkInput.title,
    url: linkInput.url,
    category: linkInput.category ?? "",
    tags: linkInput.tags ?? [],
    clicks: 0,
    createdAt: new Date().toISOString(),
  };

  linksRepository.set(newLink.id, newLink);

  return { ...newLink };
}

export function updateByID(id: string, linkInput: LinkInput) {
  validateLinkUniqueness(linkInput, id);

  const updatingLink = {
    ...getByID(id),
    ...linkInput,
  } as Link;

  linksRepository.set(id, updatingLink);

  return { ...updatingLink };
}

export function deleteByID(id: string) {
  getByID(id);
  linksRepository.delete(id);
}

export function redirectByID(id: string): string {
  const link = getByID(id);

  linksRepository.set(id, {
    ...link,
    clicks: link.clicks + 1,
  });

  return link.url;
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

function validateLinkUniqueness(
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
