import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { Link } from "./link/Link.schema";
import app from "./main";
import prisma from "./prisma/prisma";
import {
  loginUserInput,
  User,
  UserInput,
  userSchema,
} from "./user/User.schema";

const mockUserInput: UserInput = {
  name: "Test Test",
  email: "test@email.com",
  username: "test_username",
  password: "testPassword@123",
};

const mockUserCreation = () => {
  return request(app)
    .post("/api/v1/user/auth")
    .set("Content-Type", "application/json")
    .send(mockUserInput);
};

const mockLinksCreation = async () => {
  if (
    (await prisma.user.findUnique({
      where: { username: mockUserInput.username },
    })) === null
  ) {
    throw new Error(
      "Mocking link creation expects a previously mocked user creation",
    );
  }

  await prisma.link.createMany({
    data: [
      {
        title: "Public Link",
        visibility: "PUBLIC",
        ref: "https://example.com",
        authorUsername: mockUserInput.username,
      },
      {
        title: "Private Link",
        visibility: "PRIVATE",
        ref: "https://example.com/private",
        authorUsername: mockUserInput.username,
      },
    ],
  });
};

beforeEach(async () => {
  await prisma.user.deleteMany();
  await prisma.link.deleteMany();
});

describe("POST /user/auth", () => {
  const endpoint = "/api/v1/user/auth";

  it("should create user record in database, assign the authentication token to a cookie and respond with the created user object when the mutation succeeds", async () => {
    const response = await request(app)
      .post(endpoint)
      .set("Content-Type", "application/json")
      .send(mockUserInput);

    expect(response.status).toBe(201);
    expect(response.get("Set-Cookie")).toBeDefined();
    expect(
      userSchema.omit({ password: true }).safeParse(response.body).success,
    ).toBeTruthy();

    const record = await prisma.user.findUnique({
      where: { username: mockUserInput.username },
      select: { id: true },
    });

    expect(record).not.toBeNull();
    expect(record!.id).toMatchObject(response.body.id);
  });

  it("should throw 415 when content type is not application/json", async () => {
    const response = await request(app)
      .post(endpoint)
      .set("Content-Type", "text/html");

    expect(response.status).toBe(415);
    expect(response.body.code).toBe("INVALID_CONTENT_TYPE");
  });

  it("should throw 400 when the payload does not match the expected structure", async () => {
    const response = await request(app)
      .post(endpoint)
      .set("Content-Type", "application/json")
      .send({
        unknownField: "unknown_value",
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_REQUEST_BODY");
  });

  it("should throw 409 when attempt to create an user containing duplicate details", async () => {
    await prisma.user.create({
      data: mockUserInput,
    });

    const response = await request(app)
      .post(endpoint)
      .set("Content-Type", "application/json")
      .send(mockUserInput);

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("USER_CREATION_CONFLICT");
  });
});

describe("POST /user/auth/login", () => {
  const endpoint = "/api/v1/user/auth/login";

  it("should assign an authorization token to a cookie and respond with the authenticated user object when authentication succeeds", async () => {
    await mockUserCreation();

    const response = await request(app)
      .post(endpoint)
      .set("Content-Type", "application/json")
      .send({
        username: mockUserInput.username,
        password: mockUserInput.password,
      } satisfies loginUserInput);

    expect(response.get("Set-Cookie")).toBeDefined();
    expect(
      userSchema.omit({ password: true }).safeParse(response.body).success,
    ).toBeTruthy();
  });

  it("should throw 401 when username matches no user", async () => {
    await mockUserCreation();

    const response = await request(app)
      .post(endpoint)
      .set("Content-Type", "application/json")
      .send({
        username: "non-existent-user",
        password: mockUserInput.password,
      } satisfies loginUserInput);

    expect(response.get("Set-Cookie")).not.toBeDefined();
    expect(response.status).toBe(401);
    expect(response.body.code).toBe("USER_LOGIN_INVALID_CREDENTIALS");
  });

  it("should throw 401 when password is incorrect", async () => {
    await mockUserCreation();

    const response = await request(app)
      .post(endpoint)
      .set("Content-Type", "application/json")
      .send({
        username: mockUserInput.username,
        password: "wrongPassword@123",
      } satisfies loginUserInput);

    expect(response.get("Set-Cookie")).not.toBeDefined();
    expect(response.status).toBe(401);
    expect(response.body.code).toBe("USER_LOGIN_INVALID_CREDENTIALS");
  });

  it("should throw 415 when content type is not application/json", async () => {
    const response = await request(app)
      .post(endpoint)
      .set("Content-Type", "text/html");

    expect(response.status).toBe(415);
    expect(response.body.code).toBe("INVALID_CONTENT_TYPE");
  });

  it("should throw 400 when the payload does not match the expected structure", async () => {
    const response = await request(app)
      .post(endpoint)
      .set("Content-Type", "application/json")
      .send({
        unknownField: "unknown_value",
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_REQUEST_BODY");
  });
});

describe("POST /user/auth/logout", () => {
  const endpoint = "/api/v1/user/auth/logout";

  it("should send a remotion cookie", async () => {
    const response = await request(app).post(endpoint);
    const cookies = response.get("Set-Cookie");

    expect(response.status).toBe(200);
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Expires=Thu, 01 Jan 1970 00:00:00 GMT"),
      ]),
    );
  });
});

describe("GET /user/auth/profile", () => {
  const endpoint = "/api/v1/user/auth/profile";

  it("should return the authenticated user profile including private links", async () => {
    const creationResponse = await mockUserCreation();

    expect(creationResponse.status).toBe(201);

    await mockLinksCreation();

    const { links: _, ...expectedUser } = creationResponse.body as User;
    const cookies = creationResponse.get("Set-Cookie");
    const response = await request(app).get(endpoint).set("Cookie", cookies!);

    const profileLinks: Link[] = response.body.links;

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject(expectedUser);
    expect(
      profileLinks.some(({ visibility }) => visibility === "PRIVATE"),
    ).toBeTruthy();
  });
});

describe("GET /user/:username", () => {
  const endpoint = `/api/v1/user/${mockUserInput.username}`;

  it("should return the public user profile without the password or private links", async () => {
    const creationResponse = await mockUserCreation();
    const createdUser: User = creationResponse.body;

    expect(creationResponse.status).toBe(201);
    await mockLinksCreation();

    const response = await request(app).get(endpoint);
    const publicLinks: Link[] = response.body.links;
    const isLink = userSchema
      .omit({ password: true })
      .safeParse(response.body).success;

    expect(response.status).toBe(200);
    expect(isLink).toBeTruthy();
    expect(response.body.id).toBe(createdUser.id);
    expect(response.body).not.toHaveProperty("password");
    expect(
      publicLinks.every(({ visibility }) => visibility === "PUBLIC"),
    ).toBeTruthy();
  });

  it("should throw 404 when no user exists with the requested username", async () => {
    const response = await request(app).get("/api/v1/user/non-existent-user");

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("USER_NOT_FOUND");
  });
});

describe("PATCH /user/auth", () => {
  const endpoint = "/api/v1/user/auth";

  it("should update the authenticated user, persist the changes and issue an authentication cookie", async () => {
    const creationResponse = await mockUserCreation();
    const cookies = creationResponse.get("Set-Cookie");

    expect(creationResponse.status).toBe(201);

    const response = await request(app)
      .patch(endpoint)
      .set("Cookie", cookies!)
      .set("Content-Type", "application/json")
      .send({
        name: "Updated Test",
        currentPassword: mockUserInput.password,
      });

    expect(response.status).toBe(200);
    expect(response.get("Set-Cookie")).toBeDefined();
    expect(response.body).toMatchObject({
      id: creationResponse.body.id,
      name: "Updated Test",
      username: mockUserInput.username,
    });

    const record = await prisma.user.findUnique({
      where: { username: mockUserInput.username },
      select: { name: true },
    });

    expect(record?.name).toBe("Updated Test");
  });

  it("should throw 401 when the authentication cookie is missing", async () => {
    const response = await request(app)
      .patch(endpoint)
      .set("Content-Type", "application/json")
      .send({
        name: "Updated Test",
        currentPassword: mockUserInput.password,
      });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("AUTH_TOKEN_REQUIRED");
  });

  it("should throw 415 when content type is not application/json", async () => {
    const creationResponse = await mockUserCreation();

    const response = await request(app)
      .patch(endpoint)
      .set("Cookie", creationResponse.get("Set-Cookie")!)
      .set("Content-Type", "text/html");

    expect(response.status).toBe(415);
    expect(response.body.code).toBe("INVALID_CONTENT_TYPE");
  });

  it("should throw 400 when the payload does not match the expected structure", async () => {
    const creationResponse = await mockUserCreation();

    const response = await request(app)
      .patch(endpoint)
      .set("Cookie", creationResponse.get("Set-Cookie")!)
      .set("Content-Type", "application/json")
      .send({ unknownField: "unknown_value" });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_REQUEST_BODY");
  });

  it("should throw 404 when the user is not found for update", async () => {
    const creationResponse = await mockUserCreation();

    expect(creationResponse.status).toBe(201);

    await prisma.user.delete({
      where: { username: creationResponse.body.username },
    });

    const response = await request(app)
      .patch(endpoint)
      .set("Cookie", creationResponse.get("Set-Cookie")!)
      .set("Content-Type", "application/json")
      .send({
        name: "Updated Test",
        currentPassword: "wrongPassword@123",
      });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("USER_NOT_FOUND_FOR_UPDATE");
  });

  it("should throw 403 when the current password is incorrect", async () => {
    const creationResponse = await mockUserCreation();

    const response = await request(app)
      .patch(endpoint)
      .set("Cookie", creationResponse.get("Set-Cookie")!)
      .set("Content-Type", "application/json")
      .send({
        name: "Updated Test",
        currentPassword: "wrongPassword@123",
      });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("USER_UPDATE_FORBIDDEN");
  });
});

describe("DELETE /user/auth", () => {
  const endpoint = "/api/v1/user/auth";

  it("should delete the authenticated user and their links, then clear the authentication cookie", async () => {
    const creationResponse = await mockUserCreation();

    expect(creationResponse.status).toBe(201);
    await mockLinksCreation();

    const response = await request(app)
      .delete(endpoint)
      .set("Cookie", creationResponse.get("Set-Cookie")!)
      .set("Content-Type", "application/json")
      .send({ password: mockUserInput.password });

    expect(response.status).toBe(200);
    expect(response.body.code).toBe("USER_DELETION_SUCCESS");
    expect(response.get("Set-Cookie")).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Expires=Thu, 01 Jan 1970 00:00:00 GMT"),
      ]),
    );
    expect(
      await prisma.user.findUnique({
        where: { username: mockUserInput.username },
      }),
    ).toBeNull();
    expect(
      await prisma.link.findMany({
        where: { authorUsername: mockUserInput.username },
      }),
    ).toHaveLength(0);
  });

  it("should throw 401 when the authentication cookie is missing", async () => {
    const response = await request(app)
      .delete(endpoint)
      .set("Content-Type", "application/json")
      .send({ password: mockUserInput.password });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("AUTH_TOKEN_REQUIRED");
  });

  it("should throw 400 when the payload does not match the expected structure", async () => {
    const creationResponse = await mockUserCreation();

    const response = await request(app)
      .delete(endpoint)
      .set("Cookie", creationResponse.get("Set-Cookie")!)
      .set("Content-Type", "application/json")
      .send({ unknownField: "unknown_value" });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_REQUEST_BODY");
  });

  it("should throw 403 and keep the user when the password is incorrect", async () => {
    const creationResponse = await mockUserCreation();

    const response = await request(app)
      .delete(endpoint)
      .set("Cookie", creationResponse.get("Set-Cookie")!)
      .set("Content-Type", "application/json")
      .send({ password: "wrongPassword@123" });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("USER_DELETION_FORBIDDEN");
    expect(
      await prisma.user.findUnique({
        where: { username: mockUserInput.username },
      }),
    ).not.toBeNull();
  });
});
