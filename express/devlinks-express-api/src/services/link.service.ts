import { Link, LinkID, Query } from "../types/link.types.js";

const linksRepository = new Map<LinkID, Link>();

export const LinkService = {
  list: (query: Query) => {
    throw new Error("[WIP]");
  },
};
