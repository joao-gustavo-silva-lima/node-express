import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "./main";
import { UserInput, userSchema } from "./user/User.schema";
import prisma from "./prisma/prisma";

beforeEach(async () => {
  await prisma.user.deleteMany();
});

describe("POST /user/auth", () => {
  it("should create user record in database, assign the authentication token to a cookie and respond with the created user object", async () => {
    const response = await request(app)
      .post("/api/v1/user/auth")
      .set("Content-Type", "application/json")
      .send({
        name: "Test Test",
        email: "test@email.com",
        username: "test_username",
        password: "testPassword@123",
      } satisfies UserInput);

    expect(response.status).toBe(201);
    expect(response.get("Set-Cookie")).toBeDefined();
    expect(
      userSchema.omit({ password: true }).safeParse(response.body).success,
    ).toBeTruthy();

    const record = await prisma.user.findUnique({
      where: { username: "test_username" },
      select: { id: true },
    });

    expect(record).not.toBeNull();
    expect(record!.id).toMatchObject(response.body.id);
  });

  it("should throw 415 when content type is not application/json", async () => {
    const response = await request(app)
      .post("/api/v1/user/auth")
      .set("Content-Type", "text/html");

    expect(response.status).toBe(415);
    expect(response.body.code).toBe("INVALID_CONTENT_TYPE");
  });

  it("should throw 400 when the payload does not match the expected structure", async () => {
    const response = await request(app)
      .post("/api/v1/user/auth")
      .set("Content-Type", "application/json")
      .send({
        unknownField: "unknown_value",
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_REQUEST_BODY");
  });

  it("should throw 409 when attempt to create an user containing duplicate details", async () => {
    const userInput: UserInput = {
      name: "Test Test",
      email: "test@email.com",
      username: "test_username",
      password: "testPassword@123",
    };

    await prisma.user.create({
      data: userInput,
    });

    const response = await request(app)
      .post("/api/v1/user/auth")
      .set("Content-Type", "application/json")
      .send(userInput);

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("USER_CREATION_CONFLICT");
  });
});
