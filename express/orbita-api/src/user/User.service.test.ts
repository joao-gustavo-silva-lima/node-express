import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HttpError from "../common/classes/HttpError";
import prisma from "../prisma/prisma";
import type { UserInput } from "./User.schema";
import * as userService from "./User.service";

const { mockUser, mockUserInput } = vi.hoisted(() => ({
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
  mockUserInput: {
    name: "João Silva",
    email: "joao.silva@example.com",
    username: "joaosilva",
    password: "passwordExample@123",
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
      .createUser(mockUserInput)
      .catch((e) => e)) as HttpError;

    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(409);
    expect(error.code).toMatch(/conflict/i);
  });

  it("should log and rethrow error when caught is unhandled", async () => {
    const consoleErrorFn = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const expectedError = new Error("Unknown Error");

    vi.mocked(prisma.user.create).mockRejectedValue(expectedError);

    const error = (await userService
      .createUser(mockUserInput)
      .catch((e) => e)) as Error;

    expect(consoleErrorFn).toHaveBeenCalledExactlyOnceWith(
      expect.stringMatching(/unknown error/i),
      error,
    );
    expect(error).toBe(expectedError);
  });
});
