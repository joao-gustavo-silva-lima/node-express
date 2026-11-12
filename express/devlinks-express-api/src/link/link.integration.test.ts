import { ParsedUrlQuery } from "querystring";
import request from "supertest";
import { beforeEach, describe, expect, test } from "vitest";
import { app } from "../app";
import { stringfyQuery } from "../common/utils/.test.utils";
import { LinkService } from "./link.service";
import { Link, linkSchema, ProtoLink, Query } from "./link.types";

beforeEach(() => {
  LinkService._clearRepositoryForTests();
});

describe("GET /", () => {
  beforeEach(() => {
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
  ] as ParsedUrlQuery[])("throws 400 for invalid queries", async (query) => {
    const response = await request(app).get(
      `/api/v1/links?${stringfyQuery(query)}`,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/invalid query/i);
  });
});

describe("POST /", () => {
  test.for([
    {
      title: "Example",
      url: "https://example.com",
      category: "development",
      tags: ["docs", "web"],
    },
    {
      title: "Minimal",
      url: "https://minimal.example",
    },
  ] as ProtoLink[])(
    "creates a link and returns its persisted data",
    async (linkPrototype) => {
      const response = await request(app)
        .post("/api/v1/links")
        .send(linkPrototype);
      const createdLink = response.body as Link;
      const { success: isLink } = linkSchema.safeParse(createdLink);

      const retrievalResponse = await request(app).get(
        `/api/v1/links/${createdLink.id}`,
      );
      const retrievedLink = retrievalResponse.body as Link;

      expect(response.status).toBe(201);
      expect(isLink).toBeTruthy();

      expect(retrievalResponse.status).toBe(200);
      expect(createdLink).toStrictEqual(retrievedLink);
    },
  );

  test.for(["", "image/PNG", "text/plain"])(
    "throws 400 when the content type is not JSON",
    async (contentType) => {
      const response = await request(app)
        .post("/api/v1/links")
        .set("Content-Type", contentType);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/invalid content-type/i);
    },
  );

  test.for([
    { title: "Invalid URL", url: "not-a-url" },
    { title: 42, url: "https://example.com" },
    { url: "https://example.com" },
  ] as any[])("throws 400 for an invalid link", async (invalidLink) => {
    const response = await request(app).post("/api/v1/links").send(invalidLink);

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/invalidly formatted object/i);
  });

  test("throws 409 when the URL already exists", async () => {
    const linkPrototype: ProtoLink = {
      title: "Example",
      url: "https://example.com",
    };

    const initialResponse = await request(app)
      .post("/api/v1/links")
      .send(linkPrototype);
    const duplicateResponse = await request(app)
      .post("/api/v1/links")
      .send(linkPrototype);

    expect(initialResponse.status).toBe(201);
    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.message).toMatch(/conflict/i);
  });
});

describe("GET /:id", () => {
  beforeEach(() => {
    LinkService._mockRepositoryInitialDataForTests();
  });

  test("retrieves the link with the matching id", async () => {
    const id = "123e4567-e89b-12d3-a456-426614174001";

    const response = await request(app).get(`/api/v1/links/${id}`);
    const link = response.body as Link;
    const { success: isLink } = linkSchema.safeParse(link);

    expect(response.status).toBe(200);
    expect(isLink).toBeTruthy();
    expect(link.id).toBe(id);
  });

  test("throws 404 when the link does not exist", async () => {
    const notMatchingId = "no-match-id";
    const response = await request(app).get(`/api/v1/links/${notMatchingId}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/i);
  });
});

describe("DELETE /:id", () => {
  beforeEach(() => {
    LinkService._mockRepositoryInitialDataForTests();
  });

  test("deletes the link with the matching id", async () => {
    const id = "123e4567-e89b-12d3-a456-426614174001";

    const response = await request(app).delete(`/api/v1/links/${id}`);
    const retrievalResponse = await request(app).get(`/api/v1/links/${id}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/deleted successfully/i);
    expect(retrievalResponse.status).toBe(404);
    expect(retrievalResponse.body.message).toMatch(/not found/i);
  });

  test("throws 404 when the link does not exist", async () => {
    const notMatchingId = "no-match-id";

    const response = await request(app).delete(
      `/api/v1/links/${notMatchingId}`,
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/i);
  });
});
