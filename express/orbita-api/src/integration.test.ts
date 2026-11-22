import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "./main";
import { loginUserInput, UserInput, userSchema } from "./user/User.schema";
import prisma from "./prisma/prisma";

const mockUserInput: UserInput = {
  name: "Test Test",
  email: "test@email.com",
  username: "test_username",
  password: "testPassword@123",
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

  const mockSeedData = () => {
    return request(app)
      .post("/api/v1/user/auth")
      .set("Content-Type", "application/json")
      .send(mockUserInput);
  };

  it("should assign an authorization token to a cookie and respond with the authenticated user object when authentication succeeds", async () => {
    await mockSeedData();

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
    await mockSeedData();

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
    await mockSeedData();

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
