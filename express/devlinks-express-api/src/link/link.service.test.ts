import { beforeEach, describe, expect, test } from "vitest";
import * as LinkService from "./link.service.js";
import { Link, linkSchema, LinkInput, Query } from "./link.types.js";
import z from "zod";
import { StatefulError } from "../common/utils/stateful-error.utils.js";
import {
  getThrownError,
  mockRepositoryInitialDataForTests,
} from "../common/utils/.test.utils.js";
import linksRepository from "./link.repository.js";

const linklinkInput: LinkInput = {
  title: "Google",
  url: "https://www.google.com",
  category: "search",
  tags: ["search", "web"],
};

beforeEach(() => {
  linksRepository.clear();
});

describe("read all links", () => {
  beforeEach(() => {
    mockRepositoryInitialDataForTests();
  });

  test("retrieves a link array", () => {
    const query: Query = {};

    const data = LinkService.list(query);
    const { success: isLinkArray, error } = z.array(linkSchema).safeParse(data);

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
    mockRepositoryInitialDataForTests();
  });

  test("retrieves the link for the matching id", () => {
    const id: string = "123e4567-e89b-12d3-a456-426614174001";

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
    const id: string = "123e4567-e89b-12d3-a456-426614174001";
    const data = LinkService.getByID(id);

    data.title = "Externally Altered Title";

    expect(LinkService.getByID(id).title).toBe("Google");
  });
});

describe("register link", () => {
  test("saves new link object to repository and retrieves the link data", () => {
    const link = LinkService.register(linklinkInput);
    const linkInRepository = LinkService.getByID(link.id);
    const { success: isLink } = linkSchema.safeParse(link);
    const { success: isRepositoryLink } =
      linkSchema.safeParse(linkInRepository);

    expect(isLink).toBeTruthy();
    expect(isRepositoryLink).toBeTruthy();
    expect(link).toStrictEqual(linkInRepository);
  });

  test("protects the repository from mutating the returned new link", () => {
    const link = LinkService.register(linklinkInput);
    const linkInRepository = LinkService.getByID(link.id);

    link.title = "Externally Altered Title";

    expect(link.title).not.toBe(linkInRepository.title);
  });

  test("throws 409 when register link contains duplicate property against a link in repository", () => {
    const query: Query = {};
    LinkService.register(linklinkInput);

    const error = getThrownError(() =>
      LinkService.register(linklinkInput),
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
    const link = LinkService.register(linklinkInput);
    const modifyinglinkInput: LinkInput = {
      title: "Updated Title",
      url: link.url,
      category: "example",
    };
    const expectedUpdatedLink = {
      ...link,
      ...modifyinglinkInput,
    } as Link;

    const updatedLink = LinkService.updateByID(link.id, modifyinglinkInput);
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
    const link = LinkService.register(linklinkInput);
    const updatedLink = LinkService.updateByID(link.id, {
      title: "Updated Title",
      url: link.url,
      category: "example",
    });
    const repositoryUpdatedLink = LinkService.getByID(link.id);

    updatedLink.title = "Externally Altered Title";

    expect(repositoryUpdatedLink.title).not.toBe(updatedLink.title);
  });

  test("throws 404 when updating a link with a non-matching id", () => {
    const id: string = "not-matching-id";
    const modifyinglinkInput: LinkInput = {
      title: "Updated Title",
      url: "https://updated.example.com",
      category: "example",
    };

    const error = getThrownError(() =>
      LinkService.updateByID(id, modifyinglinkInput),
    ) as StatefulError;

    expect(error).toBeInstanceOf(StatefulError);
    expect(error.status).toBe(404);
    expect(error.message).toMatch(/not found/i);
  });

  test("throws 409 when updating a link with duplicate property against the repository", () => {
    const firstLink = LinkService.register(linklinkInput);
    const secondLink = LinkService.register({
      ...linklinkInput,
      title: "GitHub",
      url: "https://github.com",
    });

    const error = getThrownError(() =>
      LinkService.updateByID(secondLink.id, {
        title: secondLink.title,
        url: firstLink.url,
        category: firstLink.category,
      }),
    ) as StatefulError;

    expect(error).toBeInstanceOf(StatefulError);
    expect(error.status).toBe(409);
    expect(error.message).toMatch(/conflict/i);
  });
});

describe("delete link by id", () => {
  test("removes the link from the repository when the id matches an existing link", () => {
    const link = LinkService.register(linklinkInput);

    LinkService.deleteByID(link.id);
    const links = LinkService.list({});
    const error = getThrownError(() =>
      LinkService.getByID(link.id),
    ) as StatefulError;

    expect(error.status).toBe(404);
    expect(links).toHaveLength(0);
  });

  test("throws 404 when deleting a link with a non-matching id", () => {
    const id: string = "not-matching-id";

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
    const link = LinkService.register(linklinkInput);

    const redirectURL = LinkService.redirectByID(link.id);
    const { clicks } = LinkService.getByID(link.id);

    expect(redirectURL).toBe(link.url);
    expect(clicks).toBe(1);
  });

  test("throws 404 when redirecting a link with a non-matching id", () => {
    const id: string = "not-matching-id";

    const error = getThrownError(() =>
      LinkService.redirectByID(id),
    ) as StatefulError;

    expect(error).toBeInstanceOf(StatefulError);
    expect(error.status).toBe(404);
    expect(error.message).toMatch(/not found/i);
  });
});
