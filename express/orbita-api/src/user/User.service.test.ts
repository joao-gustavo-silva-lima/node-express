import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { configDotenv } from "dotenv";
import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "../prisma/prisma";
import type { loginUserInput, User, UserInput } from "./User.schema";
import * as userService from "./User.service";
import { generateAuthenticationToken, hashPassword } from "./User.utils";

configDotenv({ path: "config/.env.development", quiet: true });

const mockUserInput: UserInput = {
  name: "João Silva",
  email: "joao.silva@example.com",
  username: "joaosilva",
  password: "passwordExample@123",
};
const mockUser: User = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: mockUserInput.name,
  email: mockUserInput.email,
  username: mockUserInput.username,
  password: await hashPassword(mockUserInput.password),
  links: [],
  createdAt: "2026-11-19T14:00:00.000Z",
  lastEdition: "2026-11-19T14:00:00.000Z",
};

vi.mock("../prisma/prisma", () => ({
  default: {
    user: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createUser", () => {
  it("should create an user record in database and return the user and it's authentication token", async () => {
    const { password: hash, ...resultUser } = mockUser;

    vi.mocked(prisma.user.create).mockResolvedValue(mockUser as never);

    const result = await userService.createUser(mockUserInput);

    expect(vi.mocked(prisma.user.create)).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        data: {
          ...mockUserInput,
          password: hash,
        },
      }),
    );

    expect(result).toStrictEqual({
      user: resultUser,
      token: generateAuthenticationToken(mockUser.username),
    });
  });

  it("should throw 409 while attempting to create duplicate user record", async () => {
    vi.mocked(prisma.user.create).mockRejectedValue(
      new PrismaClientKnownRequestError("unique constraint violation", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    await expect(userService.createUser(mockUserInput)).rejects.toMatchObject({
      status: 409,
      code: "USER_CREATION_CONFLICT",
    });
  });

  it("should log and rethrow error when caught is unhandled", async () => {
    const consoleErrorFn = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const expectedError = new Error("Unknown Error");

    vi.mocked(prisma.user.create).mockRejectedValue(expectedError);

    await expect(userService.createUser(mockUserInput)).rejects.toBe(
      expectedError,
    );

    expect(consoleErrorFn).toHaveBeenCalledExactlyOnceWith(
      expect.stringMatching(/unknown error/i),
      expectedError,
    );
  });
});

describe("loginUser", () => {
  it("should return user and their authentication token", async () => {
    const credentials: loginUserInput = {
      username: mockUserInput.username,
      password: mockUserInput.password,
    };

    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as never);

    const result = await userService.loginUser(credentials);

    expect(prisma.user.findFirst).toHaveBeenCalledExactlyOnceWith({
      where: {
        OR: [{ username: mockUser.username }],
      },
      include: { links: true },
    });

    expect(result).toStrictEqual({
      user: mockUser,
      token: generateAuthenticationToken(mockUser.username),
    });
  });

  it("should throw 401 when no user is found and skip password comparison", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    await expect(
      userService.loginUser({
        username: mockUser.username,
        password: "passwordExample@123",
      }),
    ).rejects.toMatchObject({
      status: 401,
      code: "USER_LOGIN_INVALID_CREDENTIALS",
    });
  });

  it("should throw 401 when the password does not match", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as never);

    await expect(
      userService.loginUser({
        username: mockUser.username,
        password: "wrong-password",
      }),
    ).rejects.toMatchObject({
      status: 401,
      code: "USER_LOGIN_INVALID_CREDENTIALS",
    });
  });

  it("should throw 503 for unexpected Prisma errors", async () => {
    const databaseError = new Error("Database unavailable");
    vi.mocked(prisma.user.findFirst).mockRejectedValue(databaseError);

    await expect(
      userService.loginUser({
        username: mockUser.username,
        password: "passwordExample@123",
      }),
    ).rejects.toMatchObject({
      status: 503,
      code: "UNEXPECTED_DATABASE_ERROR",
      rawError: databaseError,
    });
  });
});
