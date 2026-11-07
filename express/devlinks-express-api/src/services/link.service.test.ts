import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { LinkService } from "./link.service.js";
import {
  Link,
  LinkID,
  linkSchema,
  ProtoLink,
  Query,
} from "../types/link.types.js";
import z from "zod";
import { StatefulError } from "../utils/stateful-error.utils.js";

const linkPrototype: ProtoLink = {
  title: "Google",
  url: "https://www.google.com",
  category: "search",
  tags: ["search", "web"],
};

function getThrownError(fn: () => void) {
  try {
    fn();
  } catch (error) {
    return error;
  }

  throw "The test expected the tested function to throw, but nothing was thrown.";
}

beforeEach(() => {
  LinkService._clearRepositoryForTests();
});

describe("read all links", () => {
  beforeEach(() => {
    LinkService._mockRepositoryInitialDataForTests();
  });

  test("retrieves a link array", () => {
    const query: Query = {};

    const data = LinkService.list(query);
    const { success: isLinkArray } = z.array(linkSchema).safeParse(data);

    expect(Array.isArray(data)).toBeTruthy();
    expect(isLinkArray).toBeTruthy();
  });

  test("protects the repository from mutating a returned link", () => {
    const query: Query = {};
    const data = LinkService.list(query);

    data[0]!.title = "Externally Altered Title";

    expect(LinkService.list(query)[0]!.title).toBe("Google");
  });
});

describe("read unique link by id", () => {
  beforeEach(() => {
    LinkService._mockRepositoryInitialDataForTests();
  });

  test("retrieves the link for the matching id", () => {
    const id: LinkID = "00000000-0000-0000-0000-000000000001";

    const data = LinkService.getByID(id);
    const { success: isLink } = linkSchema.safeParse(data);

    expect(isLink).toBeTruthy();
    expect(data).toHaveProperty("id", id);
  });

  test("throws 404 for not-matching ids", () => {
    const id = "not-matching-id";

    const error = getThrownError(() =>
      LinkService.getByID(id),
    ) as StatefulError;

    expect(error).toBeInstanceOf(StatefulError);
    expect(error.status).toBe(404);
    expect(error.message).toMatch(/not found/i);
  });

  test("protects the repository from mutating a returned link", () => {
    const id: LinkID = "00000000-0000-0000-0000-000000000001";
    const data = LinkService.getByID(id);

    data.title = "Externally Altered Title";

    expect(LinkService.getByID(id).title).toBe("Google");
  });
});

describe("register link", () => {
  test("saves new link object to repository and retrieves the link data", () => {
    const link = LinkService.register(linkPrototype);
    const linkInRepository = LinkService.getByID(link.id);
    const { success: isLink } = linkSchema.safeParse(link);
    const { success: isRepositoryLink } =
      linkSchema.safeParse(linkInRepository);

    expect(isLink).toBeTruthy();
    expect(isRepositoryLink).toBeTruthy();
    expect(link).toStrictEqual(linkInRepository);
  });

  test("protects the repository from mutating the returned new link", () => {
    const link = LinkService.register(linkPrototype);
    const linkInRepository = LinkService.getByID(link.id);

    link.title = "Externally Altered Title";

    expect(link.title).not.toBe(linkInRepository.title);
  });

  test("throws 409 when register link contains duplicate property against a link in repository", () => {
    const query: Query = {};
    LinkService.register(linkPrototype);

    const error = getThrownError(() =>
      LinkService.register(linkPrototype),
    ) as StatefulError;
    const links = LinkService.list(query);

    expect(error).toBeInstanceOf(StatefulError);
    expect(error.status).toBe(409);
    expect(error.message).toMatch(/conflict/i);
    expect(links).toHaveLength(1);
  });
});

describe("update link by id", () => {
  test("updates link in repository and retrieves updated link data", () => {
    const link = LinkService.register(linkPrototype);
    const modifyingPrototype: ProtoLink = {
      title: "Updated Title",
      url: link.url,
    };
    const expectedUpdatedLink = {
      ...link,
      ...modifyingPrototype,
    } as Link;

    const updatedLink = LinkService.updateByID(link.id, modifyingPrototype);
    const repositoryUpdatedLink = LinkService.getByID(link.id);
    const { success: isLink } = linkSchema.safeParse(updatedLink);
    const { success: isRepositoryUpdatedLink } = linkSchema.safeParse(
      repositoryUpdatedLink,
    );

    expect(isLink).toBeTruthy();
    expect(isRepositoryUpdatedLink).toBeTruthy();
    expect(updatedLink).toStrictEqual(repositoryUpdatedLink);
    expect(updatedLink.id).toBe(link.id);
    expect(repositoryUpdatedLink).toStrictEqual(expectedUpdatedLink);
  });

  test("protects the repository from mutating the returned updated link", () => {
    const link = LinkService.register(linkPrototype);
    const updatedLink = LinkService.updateByID(link.id, {
      title: "Updated Title",
      url: link.url,
    });
    const repositoryUpdatedLink = LinkService.getByID(link.id);

    updatedLink.title = "Externally Altered Title";

    expect(repositoryUpdatedLink.title).not.toBe(updatedLink.title);
  });

  test("throws 404 when updating a link with a non-matching id", () => {
    const id: LinkID = "not-matching-id";
    const modifyingPrototype: ProtoLink = {
      title: "Updated Title",
      url: "https://updated.example.com",
    };

    const error = getThrownError(() =>
      LinkService.updateByID(id, modifyingPrototype),
    ) as StatefulError;

    expect(error).toBeInstanceOf(StatefulError);
    expect(error.status).toBe(404);
    expect(error.message).toMatch(/not found/i);
  });

  test("throws 409 when updating a link with duplicate property against the repository", () => {
    const firstLink = LinkService.register(linkPrototype);
    const secondLink = LinkService.register({
      ...linkPrototype,
      title: "GitHub",
      url: "https://github.com",
    });

    const error = getThrownError(() =>
      LinkService.updateByID(secondLink.id, {
        title: secondLink.title,
        url: firstLink.url,
      }),
    ) as StatefulError;

    expect(error).toBeInstanceOf(StatefulError);
    expect(error.status).toBe(409);
    expect(error.message).toMatch(/conflict/i);
  });
});

describe("delete link by id", () => {
  test("removes the link from the repository when the id matches an existing link", () => {
    const link = LinkService.register(linkPrototype);

    LinkService.deleteByID(link.id);
    const links = LinkService.list({});
    const error = getThrownError(() =>
      LinkService.getByID(link.id),
    ) as StatefulError;

    expect(error.status).toBe(404);
    expect(links).toHaveLength(0);
  });

  test("throws 404 when deleting a link with a non-matching id", () => {
    const id: LinkID = "not-matching-id";

    const error = getThrownError(() =>
      LinkService.deleteByID(id),
    ) as StatefulError;

    expect(error).toBeInstanceOf(StatefulError);
    expect(error.status).toBe(404);
    expect(error.message).toMatch(/not found/i);
  });
});

describe("redirect link by id", () => {
  test("returns the link URL and increments its click count for an existing link", () => {
    const link = LinkService.register(linkPrototype);

    const redirectURL = LinkService.redirectByID(link.id);
    const { clicks } = LinkService.getByID(link.id);

    expect(redirectURL).toBe(link.url);
    expect(clicks).toBe(1);
  });

  test("throws 404 when redirecting a link with a non-matching id", () => {
    const id: LinkID = "not-matching-id";

    const error = getThrownError(() =>
      LinkService.redirectByID(id),
    ) as StatefulError;

    expect(error).toBeInstanceOf(StatefulError);
    expect(error.status).toBe(404);
    expect(error.message).toMatch(/not found/i);
  });
});
