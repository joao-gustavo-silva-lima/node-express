import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HttpError from "../common/classes/HttpError";
import prisma from "../prisma/prisma";
import type { UserInput } from "./User.schema";
import * as userService from "./User.service";

const { mockUser } = vi.hoisted(() => ({
  mockUser: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "João Silva",
    email: "joao.silva@example.com",
    username: "joaosilva",
    password: "$2b$10$hashedPasswordExample1234567890",
    links: [],
    createdAt: "2026-11-19T14:00:00.000Z",
    lastEdition: "2026-11-19T14:00:00.000Z",
  },
}));

vi.mock("../prisma/prisma", () => ({
  default: {
    user: {
      create: vi.fn().mockReturnValue(mockUser),
    },
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("authentication-token"),
  },
}));

vi.mock("bcrypt", () => ({
  hash: vi.fn().mockReturnValue(mockUser.password),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createUser", () => {
  it("should call prisma create for the User model and return and user and an authentication token", async () => {
    const mockUserInput: UserInput = {
      name: mockUser.name,
      email: mockUser.email,
      username: mockUser.username,
      password: "non-hashed-password",
    };
    const { password, ...expectedUser } = mockUser;

    const { user, token } = await userService.createUser(mockUserInput);

    expect(vi.mocked(prisma.user.create)).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        data: {
          ...mockUserInput,
          password: "$2b$10$hashedPasswordExample1234567890",
        },
      }),
    );

    expect(user).toStrictEqual(expectedUser);
    expect(token).toBe("authentication-token");
  });

  it("should throw 409 while attempting to create duplicate user (Prisma Error P2002)", async () => {
    vi.mocked(prisma.user.create).mockRejectedValue(
      new PrismaClientKnownRequestError("", {
        code: "P2002",
        clientVersion: "",
      }),
    );

    const error = (await userService
      .createUser({
        name: mockUser.name,
        email: mockUser.email,
        username: mockUser.username,
        password: mockUser.password,
      })
      .catch((e) => e)) as HttpError;

    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(409);
    expect(error.code).toMatch(/conflict/i);
  });
});
