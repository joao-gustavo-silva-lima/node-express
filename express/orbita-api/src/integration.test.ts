import { beforeEach, describe, expect, it } from "vitest";
import request, { agent } from "supertest";
import app from "./main";
import {
  loginUserInput,
  User,
  UserInput,
  userSchema,
} from "./user/User.schema";
import prisma from "./prisma/prisma";
import { Link, LinkInput } from "./link/Link.schema";

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
