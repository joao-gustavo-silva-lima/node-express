import { ParsedUrlQuery } from "querystring";
import request from "supertest";
import { beforeEach, describe, expect, test } from "vitest";
import { app } from "../app";
import { stringfyQuery } from "../common/utils/.test.utils";
import * as LinkService from "./link.service";
import { Link, linkSchema, LinkInput, Query } from "./link.types";

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
      category: "example",
    },
  ] as LinkInput[])(
    "creates a link and returns its persisted data",
    async (linklinkInput) => {
      const response = await request(app)
        .post("/api/v1/links")
        .send(linklinkInput);
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
    const linklinkInput: LinkInput = {
      title: "Example",
      url: "https://example.com",
      category: "example",
    };

    const initialResponse = await request(app)
      .post("/api/v1/links")
      .send(linklinkInput);
    const duplicateResponse = await request(app)
      .post("/api/v1/links")
      .send(linklinkInput);

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

describe("PUT /:id", () => {
  beforeEach(() => {
    LinkService._mockRepositoryInitialDataForTests();
  });

  test.for([
    {
      title: "Updated Google",
      url: "https://updated-google.example",
      category: "updated",
      tags: ["updated", "search"],
    },
    {
      title: "Google Search",
      url: "https://www.google.com",
      category: "search",
      tags: ["search", "web"],
    },
  ] as LinkInput[])(
    "updates the link and returns its persisted data",
    async (modifyinglinkInput) => {
      const id = "123e4567-e89b-12d3-a456-426614174001";
      const originalLink = LinkService.getByID(id);
      const expectedUpdatedLink = {
        ...originalLink,
        ...modifyinglinkInput,
      };

      const response = await request(app)
        .put(`/api/v1/links/${id}`)
        .send(modifyinglinkInput);
      const updatedLink = response.body as Link;
      const { success: isLink } = linkSchema.safeParse(updatedLink);
      const retrievalResponse = await request(app).get(`/api/v1/links/${id}`);
      const retrievedUpdatedLink = retrievalResponse.body as Link;

      expect(response.status).toBe(200);
      expect(isLink).toBeTruthy();
      expect(updatedLink).toMatchObject(expectedUpdatedLink);
      expect(retrievedUpdatedLink).toStrictEqual(updatedLink);
    },
  );

  test.for(["", "image/PNG", "text/plain"])(
    "throws 400 when the content type is not JSON",
    async (contentType) => {
      const response = await request(app)
        .put("/api/v1/links/123e4567-e89b-12d3-a456-426614174001")
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
    const response = await request(app)
      .put("/api/v1/links/123e4567-e89b-12d3-a456-426614174001")
      .send(invalidLink);

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/invalidly formatted object/i);
  });

  test("throws 404 when the link does not exist", async () => {
    const response = await request(app)
      .put("/api/v1/links/no-match-id")
      .send({
        title: "Example",
        url: "https://example.com",
        category: "example",
      } as LinkInput);

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/i);
  });

  test("throws 409 when the URL already belongs to another link", async () => {
    const response = await request(app)
      .put("/api/v1/links/123e4567-e89b-12d3-a456-426614174001")
      .send({
        title: "Google",
        url: "https://github.com",
        category: "example",
      } as LinkInput);

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/conflict/i);
  });
});

describe("GET /:id/redirect", () => {
  beforeEach(() => {
    LinkService._mockRepositoryInitialDataForTests();
  });

  test("returns the link URL and increments its click count", async () => {
    const id = "123e4567-e89b-12d3-a456-426614174001";
    const originalLink = LinkService.getByID(id);
    const expectedBody = {
      redirectURL: originalLink.url,
    };

    const response = await request(app).get(`/api/v1/links/${id}/redirect`);
    const retrievalResponse = await request(app).get(`/api/v1/links/${id}`);
    const retrievedLink = retrievalResponse.body as Link;

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject(expectedBody);
    expect(retrievalResponse.status).toBe(200);
    expect(retrievedLink.clicks).toBe(originalLink.clicks + 1);
  });

  test("throws 404 when the link does not exist", async () => {
    const notMatchingId = "no-match-id";

    const response = await request(app).get(
      `/api/v1/links/${notMatchingId}/redirect`,
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/i);
  });
});
