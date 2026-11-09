import request from "supertest";
import { describe, expect, test } from "vitest";
import { app } from "../app";

describe("GET /", () => {
  test.for([{ invalid: "query" }, { unexpected: "parameter" }] as Record<
    string,
    string
  >[])("throws 400 for invalid queries", async (query) => {
    const URLQueryString = new URLSearchParams(query).toString();
    const response = await request(app).get(`/api/v1/links?${URLQueryString}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/invalid query/i);
  });
});
