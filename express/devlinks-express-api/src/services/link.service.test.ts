import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { LinkService } from "./link.service.js";
import { linkSchema, Query } from "../types/link.types.js";
import z from "zod";

describe("read all links", () => {
  beforeEach(() => {
    LinkService._mockRepositoryInitialDataForTests();
  });

  afterEach(() => {
    LinkService._clearRepositoryForTests();
  });

  test("retrieves a link array", () => {
    const query: Query = {};

    const data = LinkService.list(query);
    const { success: isLinkArray } = z.array(linkSchema).safeParse(data);

    expect(Array.isArray(data)).toBeTruthy();
    expect(isLinkArray).toBeTruthy();
  });
});
