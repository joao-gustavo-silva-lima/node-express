import { randomUUID } from "node:crypto";
import {
  Link,
  LinkID,
  LinkProperty,
  ProtoLink,
  Query,
} from "../types/link.types.js";
import { StatefulError } from "../utils/stateful-error.utils.js";

const MOCK_UUID = "d9b05985-ba18-498e-9a92-daf0a5e4c893";

export class LinkService {
  private static readonly linksRepository = new Map<LinkID, Link>([
    [
      MOCK_UUID,
      {
        id: MOCK_UUID,
        title: "TypeScript Official Documentation",
        url: "https://www.typescriptlang.org/docs/",
        category: "Development",
        tags: ["typescript", "javascript", "docs", "frontend"],
        clicks: 1420,
        createdAt: new Date("2026-01-15T10:30:00Z"),
      },
    ],
  ]);

  public static list(query: Query) {
    const links = [...this.linksRepository.values()].map((obj) => ({ ...obj }));

    if (Object.keys(query).length === 0) {
      return links;
    }

    const queryEntries = Object.entries(query) as [LinkProperty, unknown][];

    return links.filter((link) =>
      queryEntries.every(([key, value]) => link[key].toString() === value),
    );
  }

  public static register(linkPrototype: ProtoLink) {
    const newID = randomUUID();

    if (this.linksRepository.has(newID)) {
      throw new StatefulError(
        500,
        `Unlikely UUID collision occurred for ID '${newID}'`,
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

  public static redirectByID(id: LinkID): string {
    const link = this._getByID(id);

    link.clicks++;

    return link.url;
  }
}
