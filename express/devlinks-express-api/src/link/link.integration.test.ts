import request from "supertest";
import { beforeEach, describe, expect, test } from "vitest";
import { app } from "../app";
import { LinkService } from "./link.service";
import { Link, Query } from "./link.types";
import { stringfyQuery } from "../common/utils/.test.utils";
import { ParsedUrlQuery } from "querystring";
import { link } from "fs";

describe("GET /", () => {
  beforeEach(() => {
    LinkService._clearRepositoryForTests();
    LinkService._mockRepositoryInitialDataForTests();
  });

  test.for([
    {},
    { title: "Google" },
    { category: "development" },
    { tags: ["reference", "search"] },
    { category: "search", tags: ["web"] },
  ] as Query[])("retrieves filtered links list", async (query) => {
    const response = await request(app).get(
      `/api/v1/links?${stringfyQuery(query)}`,
    );
    const links: Link[] = response.body;

    expect(response.status).toBe(200);
    expect(Array.isArray(links)).toBeTruthy();
    expect(
      links.every((link) => LinkService.linkSatisfiesQuery(link, query)),
    ).toBeTruthy();
  });

  test.for([
    { title: ["Google", "GitHub"] },
    { category: ["search", "development"] },
    { title: ["Google"], tags: "search" },
  ] as ParsedUrlQuery[])("throws 400 for invalid queries", async (query) => {
    const response = await request(app).get(
      `/api/v1/links?${stringfyQuery(query)}`,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/invalid query/i);
  });
});
