import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { LinkService } from "./link.service.js";
import { LinkID, linkSchema, ProtoLink, Query } from "../types/link.types.js";
import z from "zod";
import { StatefulError } from "../utils/stateful-error.utils.js";

function getThrownError(fn: () => void) {
  try {
    fn();
  } catch (error) {
    return error;
  }

  throw "The test expected the tested function to throw, but nothing was thrown.";
}

describe("read all links", () => {
  beforeEach(() => {
    LinkService._clearRepositoryForTests();
    LinkService._mockRepositoryInitialDataForTests();
  });

  test("retrieves a link array", () => {
    const query: Query = {};

    const data = LinkService.list(query);
    const { success: isLinkArray } = z.array(linkSchema).safeParse(data);

    expect(Array.isArray(data)).toBeTruthy();
    expect(isLinkArray).toBeTruthy();
  });
});

describe("read unique link by id", () => {
  beforeEach(() => {
    LinkService._clearRepositoryForTests();
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
});

describe("register link", () => {
  beforeEach(() => {
    LinkService._clearRepositoryForTests();
  });

  test("saves new link object to repository and retrieves the link data", () => {
    const linkPrototype: ProtoLink = {
      title: "Google",
      url: "https://www.google.com",
      category: "search",
      tags: ["search", "web"],
    };

    const link = LinkService.register(linkPrototype);
    const linkInRepository = LinkService.getByID(link.id);
    const { success: isLink } = linkSchema.safeParse(link);
    const { success: isRepositoryLink } =
      linkSchema.safeParse(linkInRepository);

    expect(isLink).toBeTruthy();
    expect(isRepositoryLink).toBeTruthy();
    expect(link).toStrictEqual(linkInRepository);
  });
});
