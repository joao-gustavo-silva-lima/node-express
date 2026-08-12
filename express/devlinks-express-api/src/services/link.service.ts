import { randomUUID } from "node:crypto";
import {
  EMPTY_LINK,
  Link,
  LinkID,
  LinkKeys,
  ProtoLink,
  Query,
} from "../types/link.types.js";
import { StatefulError } from "../utils/stateful-error.utils.js";

export class LinkService {
  private static readonly linksRepository = new Map<LinkID, Link>();

  public static list(query: Query) {
    const links = [...this.linksRepository.values()].map((obj) => ({ ...obj }));

    if (Object.keys(query).length === 0) {
      return links;
    }

    const queryEntries = Object.entries(query) as [LinkKeys, unknown][];

    return links.filter((link) =>
      queryEntries.every(([key, value]) => link[key].toString() === value),
    );
  }

  private static validatePrototypeUniqueness(
    parsingLink: ProtoLink,
    exceptiveOwnId?: LinkID,
  ) {
    for (const link of this.linksRepository.values()) {
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

  public static register(linkPrototype: ProtoLink) {
    this.validatePrototypeUniqueness(linkPrototype);

    const newID = randomUUID();

    if (this.linksRepository.has(newID)) {
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
      createdAt: new Date(),
    };

    this.linksRepository.set(newLink.id, newLink);

    return { ...newLink };
  }

  private static _getByID(id: LinkID): Link {
    if (!this.linksRepository.has(id)) {
      throw new StatefulError(404, `Link within ID '${id}' not found`);
    }

    return this.linksRepository.get(id)!;
  }

  public static getByID(id: LinkID): Link {
    return { ...this._getByID(id) };
  }

  public static deleteByID(id: LinkID) {
    this._getByID(id);
    this.linksRepository.delete(id);
  }

  public static updateByID(id: LinkID, modifyingPrototype: ProtoLink) {
    this.validatePrototypeUniqueness(modifyingPrototype, id);

    const updatingLink = {
      ...this.getByID(id),
      ...Object.fromEntries(
        Object.entries(modifyingPrototype).map(([key, value]) => [
          key,
          value ?? EMPTY_LINK[key as LinkKeys],
        ]),
      ),
    };

    this.linksRepository.set(id, updatingLink);

    return { ...updatingLink };
  }

  public static redirectByID(id: LinkID): string {
    const link = this._getByID(id);

    link.clicks++;

    return link.url;
  }
}
