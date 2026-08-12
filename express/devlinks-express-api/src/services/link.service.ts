import { Link, LinkProperty, Query } from "../types/link.types.js";
import { StatefulError } from "../utils/stateful-error.utils.js";

export class LinkService {
  private static readonly linksRepository = new Map<number, Link>([
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

  public static list(query: Query) {
    const links = [...this.linksRepository.values()];

    if (Object.keys(query).length === 0) {
      return links;
    }

    const queryEntries = Object.entries(query) as [LinkProperty, unknown][];

    return links.filter((link) =>
      queryEntries.every(([key, value]) => link[key].toString() === value),
    );
  }

  private static _getByID(id: number): Link {
    if (!this.linksRepository.has(id)) {
      throw new StatefulError(404, `Link within ID '${id}' not found`);
    }

    return this.linksRepository.get(id)!;
  }

  public static getByID(id: number) {
    return { ...this._getByID(id) };
  }

  public static deleteByID(id: number) {
    this._getByID(id);
    return this.linksRepository.delete(id);
  }

  public static redirectByID(id: number) {
    const link = this._getByID(id);

    link.clicks++;

    return link.url;
  }
}
