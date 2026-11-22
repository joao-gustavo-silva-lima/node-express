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
});
