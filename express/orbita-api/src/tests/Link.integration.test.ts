import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { Link, linkSchema, LinkUpdateInput } from "../link/Link.schema";
import app from "../main";
import prisma from "../prisma/prisma";
import {
  mockLinkCreation,
  mockPrivateLinkInput,
  mockPublicLinkInput,
  mockUserCreation,
  mockUserInput,
  mockUserLinksCreation,
} from "./.test.utils";
import { updateUserInput } from "../user/User.schema";

beforeEach(async () => {
  await prisma.link.deleteMany();
  await prisma.user.deleteMany();
});

describe("POST /link", () => {
  const endpoint = "/api/v1/link";

  it("should create a link for the authenticated user and persist the record", async () => {
    const userResponse = await mockUserCreation();
    expect(userResponse.status).toBe(201);

    const response = await mockLinkCreation(userResponse.get("Set-Cookie")!);

    expect(response.status).toBe(201);
    expect(linkSchema.safeParse(response.body).success).toBeTruthy();
    expect(response.body).toMatchObject({
      ...mockPublicLinkInput,
      authorUsername: mockUserInput.username,
    });

    const record = await prisma.link.findUnique({
      where: { id: response.body.id },
    });

    expect(record).not.toBeNull();
    expect(record!.authorUsername).toBe(mockUserInput.username);
  });

  it("should throw 401 when the authentication cookie is missing", async () => {
    const response = await request(app)
      .post(endpoint)
      .set("Content-Type", "application/json")
      .send(mockPublicLinkInput);

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("AUTH_TOKEN_REQUIRED");
  });

  it("should throw 415 when content type is not application/json", async () => {
    const userResponse = await mockUserCreation();

    const response = await request(app)
      .post(endpoint)
      .set("Cookie", userResponse.get("Set-Cookie")!)
      .set("Content-Type", "text/html");

    expect(response.status).toBe(415);
    expect(response.body.code).toBe("INVALID_CONTENT_TYPE");
  });

  it("should throw 400 when the payload does not match the expected structure", async () => {
    const userResponse = await mockUserCreation();

    const response = await request(app)
      .post(endpoint)
      .set("Cookie", userResponse.get("Set-Cookie")!)
      .set("Content-Type", "application/json")
      .send({ title: "Missing reference and visibility" });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_REQUEST_BODY");
  });

  it("should throw 409 when a link title or reference is already in use", async () => {
    const userResponse = await mockUserCreation();
    const cookies = userResponse.get("Set-Cookie")!;

    const firstResponse = await mockLinkCreation(cookies);
    expect(firstResponse.status).toBe(201);

    const response = await mockLinkCreation(cookies);

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("LINK_CONFLICT");
  });

  it("should throw 403 when the user has reached the link creation quota", async () => {
    const userResponse = await mockUserCreation();

    await prisma.link.createMany({
      data: Array.from({ length: 10 }, (_, index) => ({
        visibility: "PUBLIC",
        title: `Integration Link ${index}`,
        ref: `https://example.com/${index}`,
        authorUsername: mockUserInput.username,
      })),
    });

    const response = await mockLinkCreation(userResponse.get("Set-Cookie")!);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("LINK_CREATION_QUOTA_EXCEEDED");
    expect(
      await prisma.link.count({
        where: { authorUsername: mockUserInput.username },
      }),
    ).toBe(10);
  });
});

describe("GET /link", () => {
  const endpoint = "/api/v1/link";

  it("should return all links belonging to the authenticated user", async () => {
    const userResponse = await mockUserCreation();
    const cookies = userResponse.get("Set-Cookie")!;

    await mockUserLinksCreation();

    const response = await request(app).get(endpoint).set("Cookie", cookies);
    const links: Link[] = response.body;

    expect(response.status).toBe(200);
    expect(links).toHaveLength(2);
    expect(
      links.every(
        ({ authorUsername }) => authorUsername === mockUserInput.username,
      ),
    ).toBeTruthy();
    expect(
      links.some(({ visibility }) => visibility === "PRIVATE"),
    ).toBeTruthy();
  });

  it("should throw 401 when the authentication cookie is missing", async () => {
    const response = await request(app).get(endpoint);

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("AUTH_TOKEN_REQUIRED");
  });
});

describe("GET /link/:id", () => {
  const endpoint = "/api/v1/link";

  it("should allow the owner to fetch a link", async () => {
    const userResponse = await mockUserCreation();
    const targetLink = (await mockUserLinksCreation())[0];

    const response = await request(app)
      .get(`${endpoint}/${targetLink.id}`)
      .set("Cookie", userResponse.get("Set-Cookie")!);

    expect(response.status).toBe(200);
    expect(linkSchema.safeParse(response.body).success).toBeTruthy();
    expect(response.body.authorUsername).toBe(userResponse.body.username);
  });

  it("should throw 400 when the link id is invalid", async () => {
    const userResponse = await mockUserCreation();

    const response = await request(app)
      .get(`${endpoint}/invalid-id`)
      .set("Cookie", userResponse.get("Set-Cookie")!);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_LINK_ID");
  });

  it("should throw 404 when no accessible link exists with the requested id", async () => {
    const userResponse = await mockUserCreation();

    const response = await request(app)
      .get(`${endpoint}/1`)
      .set("Cookie", userResponse.get("Set-Cookie")!);

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("LINK_NOT_FOUND");
  });
});

describe("PATCH /link/:id", () => {
  const endpoint = "/api/v1/link";

  it("should update and persist the provided fields of an owned link", async () => {
    const userResponse = await mockUserCreation();
    const cookies = userResponse.get("Set-Cookie")!;

    const linkResponse = await mockLinkCreation(cookies);
    expect(linkResponse.status).toBe(201);

    const response = await request(app)
      .patch(`${endpoint}/${linkResponse.body.id}`)
      .set("Cookie", cookies)
      .set("Content-Type", "application/json")
      .send({
        title: "Updated Integration Link",
        visibility: "PRIVATE",
      });

    expect(response.status).toBe(200);
    expect(linkSchema.safeParse(response.body).success).toBeTruthy();
    expect(response.body).toMatchObject({
      title: "Updated Integration Link",
      visibility: "PRIVATE",
    });

    const record = await prisma.link.findUnique({
      where: { id: linkResponse.body.id },
    });

    expect(record?.title).toBe("Updated Integration Link");
    expect(record?.visibility).toBe("PRIVATE");
  });

  it("should throw 400 when the link id is invalid", async () => {
    const userResponse = await mockUserCreation();

    const response = await request(app)
      .patch(`${endpoint}/invalid-id`)
      .set("Cookie", userResponse.get("Set-Cookie")!)
      .set("Content-Type", "application/json")
      .send({ title: "Updated title" });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_LINK_ID");
  });

  it("should throw 400 when the payload contains an invalid visibility", async () => {
    const userResponse = await mockUserCreation();

    const response = await request(app)
      .patch(`${endpoint}/1`)
      .set("Cookie", userResponse.get("Set-Cookie")!)
      .set("Content-Type", "application/json")
      .send({ visibility: "UNLISTED" });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_REQUEST_BODY");
  });

  it("should throw 404 when the owned link is not found", async () => {
    const userResponse = await mockUserCreation();

    expect(
      await prisma.link.findUnique({
        where: {
          id: 1,
          authorUsername: userResponse.body.username,
        },
      }),
    );

    const response = await request(app)
      .patch(`${endpoint}/1`)
      .set("Cookie", userResponse.get("Set-Cookie")!)
      .set("Content-Type", "application/json")
      .send({
        title: "Update Title",
      } satisfies LinkUpdateInput);

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("LINK_NOT_FOUND_FOR_UPDATE");
  });

  it("should throw 409 when an update conflicts with another link title or reference", async () => {
    const userResponse = await mockUserCreation();
    const cookies = userResponse.get("Set-Cookie")!;

    const firstLink = await mockLinkCreation(cookies);
    const secondLink = await mockLinkCreation(cookies, mockPrivateLinkInput);
    expect(firstLink.status).toBe(201);
    expect(secondLink.status).toBe(201);

    const response = await request(app)
      .patch(`${endpoint}/${firstLink.body.id}`)
      .set("Cookie", cookies)
      .set("Content-Type", "application/json")
      .send({ title: mockPrivateLinkInput.title });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("LINK_CONFLICT");
  });
});

describe("DELETE /link/:id", () => {
  const endpoint = "/api/v1/link";

  it("should delete an owned link and return the success response", async () => {
    const userResponse = await mockUserCreation();
    const cookies = userResponse.get("Set-Cookie")!;
    const linkResponse = await mockLinkCreation(cookies);
    expect(linkResponse.status).toBe(201);

    const response = await request(app)
      .delete(`${endpoint}/${linkResponse.body.id}`)
      .set("Cookie", cookies);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      code: "LINK_DELETED",
      message: "The link was deleted successfully.",
    });
    expect(
      await prisma.link.findUnique({
        where: { id: linkResponse.body.id },
      }),
    ).toBeNull();
  });

  it("should throw 400 when the link id is invalid", async () => {
    const userResponse = await mockUserCreation();

    const response = await request(app)
      .delete(`${endpoint}/invalid-id`)
      .set("Cookie", userResponse.get("Set-Cookie")!);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_LINK_ID");
  });

  it("should throw 404 when the owned link is not found for deletion", async () => {
    const userResponse = await mockUserCreation();

    const response = await request(app)
      .delete(`${endpoint}/1`)
      .set("Cookie", userResponse.get("Set-Cookie")!);

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("LINK_NOT_FOUND_FOR_DELETION");
  });
});
