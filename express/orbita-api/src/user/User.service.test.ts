import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { configDotenv } from "dotenv";
import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "../prisma/prisma";
import type {
  loginUserInput,
  updateUserInput,
  User,
  UserInput,
} from "./User.schema";
import * as userService from "./User.service";
import { generateAuthenticationToken, hashPassword } from "./User.utils";

configDotenv({ path: "config/.env.development", quiet: true });

const mockUserInput: UserInput = {
  name: "João Silva",
  email: "joao.silva@example.com",
  username: "joaosilva",
  password: "passwordExample@123",
};
const mockPublicLink: User["links"][number] = {
  id: 1,
  authorUsername: mockUserInput.username,
  ref: "public-link",
  title: "Public link",
  visibility: "PUBLIC",
  createdAt: "2026-11-19T14:00:00.000Z",
  lastEdition: "2026-11-19T14:00:00.000Z",
};
const mockPrivateLink: User["links"][number] = {
  id: 2,
  authorUsername: mockUserInput.username,
  ref: "private-link",
  title: "Private link",
  visibility: "PRIVATE",
  createdAt: "2026-11-19T14:00:00.000Z",
  lastEdition: "2026-11-19T14:00:00.000Z",
};
const mockUser: User = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: mockUserInput.name,
  email: mockUserInput.email,
  username: mockUserInput.username,
  password: await hashPassword(mockUserInput.password),
  links: [mockPublicLink, mockPrivateLink],
  createdAt: "2026-11-19T14:00:00.000Z",
  lastEdition: "2026-11-19T14:00:00.000Z",
};

vi.mock("../prisma/prisma", () => ({
  default: {
    user: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

describe("fetchUser", () => {
  const publicUserData: User = {
    ...mockUser,
    links: mockUser.links.filter(({ visibility }) => visibility === "PUBLIC"),
  };
  const authenticatedUserData: User = {
    ...mockUser,
  };

  it("should fetch the user without password and only public links for unauthenticated visitors", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      publicUserData as never,
    );

    const result = await userService.fetchUser(mockUser.username, null);

    expect(prisma.user.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { username: mockUser.username },
      omit: { password: true },
      include: {
        links: {
          where: {
            authorUsername: mockUser.username,
            visibility: "PUBLIC",
          },
        },
      },
    });
    expect(result).toStrictEqual(publicUserData);
  });

  it("should fetch all links when the authenticated user is the profile owner", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      authenticatedUserData as never,
    );

    const result = await userService.fetchUser(
      mockUser.username,
      mockUser.username,
    );

    expect(prisma.user.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { username: mockUser.username },
      omit: { password: true },
      include: {
        links: {
          where: { authorUsername: mockUser.username },
        },
      },
    });
    expect(result).toStrictEqual(authenticatedUserData);
  });

  it("should only include public links when another user is authenticated", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      publicUserData as never,
    );

    const result = await userService.fetchUser(
      mockUser.username,
      "anotheruser",
    );

    expect(prisma.user.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { username: mockUser.username },
      omit: { password: true },
      include: {
        links: {
          where: {
            authorUsername: mockUser.username,
            visibility: "PUBLIC",
          },
        },
      },
    });
    expect(result).toStrictEqual(publicUserData);
  });

  it("should throw 404 when the user does not exist", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(
      userService.fetchUser(mockUser.username, null),
    ).rejects.toMatchObject({
      status: 404,
      code: "USER_NOT_FOUND",
    });
    expect(prisma.user.findUnique).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        where: { username: mockUser.username },
      }),
    );
  });

  it("should throw 503 for unexpected Prisma errors", async () => {
    const databaseError = new Error("Database unavailable");
    vi.mocked(prisma.user.findUnique).mockRejectedValue(databaseError);

    await expect(
      userService.fetchUser(mockUser.username, null),
    ).rejects.toMatchObject({
      status: 503,
      code: "UNEXPECTED_DATABASE_ERROR",
      rawError: databaseError,
    });
  });
});

describe("updateUser", () => {
  const currentPassword = mockUserInput.password;
  const targetUsername = mockUser.username;
  const createdAt = new Date("2026-11-19T14:00:00.000Z");

  function mockExistingUser(lastEdition = createdAt) {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      password: mockUser.password,
      createdAt: createdAt,
      lastEdition,
    } as never);
  }

  it("should update only provided fields and return the user and token", async () => {
    mockExistingUser();
    const updatedUser = {
      ...mockUser,
      name: "João Atualizado",
    };
    vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as never);

    const result = await userService.updateUser(targetUsername, {
      currentPassword,
      name: updatedUser.name,
    });

    expect(prisma.user.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { username: targetUsername },
      select: {
        password: true,
        createdAt: true,
        lastEdition: true,
      },
    });
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledExactlyOnceWith({
      where: { username: targetUsername },
      data: { name: updatedUser.name },
      omit: { password: true },
      include: { links: true },
    });
    expect(result).toStrictEqual({
      updatedUser,
      token: generateAuthenticationToken(updatedUser.username),
    });
  });

  it("should check username and email conflicts before updating", async () => {
    mockExistingUser();
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as never);

    const userInput: updateUserInput = {
      currentPassword,
      username: "joaosilva-novo",
      email: "novo@example.com",
    };

    await userService.updateUser(targetUsername, userInput);

    expect(prisma.user.findFirst).toHaveBeenCalledExactlyOnceWith({
      where: {
        OR: [{ username: userInput.username }, { email: userInput.email }],
        NOT: { username: targetUsername },
      },
      select: { id: true },
    });
    expect(prisma.user.update).toHaveBeenCalledExactlyOnceWith({
      where: { username: targetUsername },
      data: {
        username: userInput.username,
        email: userInput.email,
      },
      omit: { password: true },
      include: { links: true },
    });
  });

  it("should hash a new password before sending it to Prisma", async () => {
    mockExistingUser();
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as never);
    const newPassword = "NewPassword@123";

    await userService.updateUser(targetUsername, {
      currentPassword,
      password: newPassword,
    });

    expect(prisma.user.update).toHaveBeenCalledExactlyOnceWith({
      where: { username: targetUsername },
      data: { password: await hashPassword(newPassword) },
      omit: { password: true },
      include: { links: true },
    });
  });

  it("should throw 404 when the target user does not exist", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(
      userService.updateUser(targetUsername, { currentPassword }),
    ).rejects.toMatchObject({
      status: 404,
      code: "USER_NOT_FOUND_FOR_UPDATE",
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("should throw 403 when the current password is incorrect", async () => {
    mockExistingUser();

    await expect(
      userService.updateUser(targetUsername, {
        currentPassword: "wrong-current-password",
        name: "João Atualizado",
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "USER_UPDATE_FORBIDDEN",
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("should throw 403 when the user was updated less than three days ago", async () => {
    mockExistingUser(new Date(Date.now() - 24 * 60 * 60 * 1000));

    await expect(
      userService.updateUser(targetUsername, {
        currentPassword,
        name: "João Atualizado",
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "USER_UPDATE_FORBIDDEN",
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("should throw 409 when a username or email is already in use", async () => {
    mockExistingUser();
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: "duplicate",
    } as never);

    await expect(
      userService.updateUser(targetUsername, {
        currentPassword,
        email: "already-used@example.com",
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "USER_UPDATE_DETAILS_CONFLICT",
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("should throw 409 while attempting to update user record within duplicate details", async () => {
    mockExistingUser();
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.update).mockRejectedValue(
      new PrismaClientKnownRequestError("unique constraint violation", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    await expect(
      userService.updateUser(targetUsername, {
        currentPassword,
        email: "new@example.com",
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "USER_UPDATE_DETAILS_CONFLICT",
    });
  });

  it("should throw 503 for unexpected Prisma errors", async () => {
    mockExistingUser();
    const databaseError = new Error("Database unavailable");
    vi.mocked(prisma.user.update).mockRejectedValue(databaseError);

    await expect(
      userService.updateUser(targetUsername, {
        currentPassword,
        name: "João Atualizado",
      }),
    ).rejects.toMatchObject({
      status: 503,
      code: "UNEXPECTED_DATABASE_ERROR",
      rawError: databaseError,
    });
  });
});

describe("deleteUser", () => {
  const username = mockUser.username;
  const password = mockUserInput.password;

  it("should delete the user after verifying the password", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      password: mockUser.password,
    } as never);
    vi.mocked(prisma.user.delete).mockResolvedValue(mockUser as never);

    await userService.deleteUser(username, password);

    expect(prisma.user.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { username },
      select: { password: true },
    });
    expect(prisma.user.delete).toHaveBeenCalledExactlyOnceWith({
      where: { username },
    });
  });

  it("should throw 404 and skip deletion when the user does not exist", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(
      userService.deleteUser(username, password),
    ).rejects.toMatchObject({
      status: 404,
      code: "USER_NOT_FOUND_FOR_DELETION",
    });
    expect(prisma.user.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { username },
      select: { password: true },
    });
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it("should throw 403 and skip deletion when the password does not match", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      password: mockUser.password,
    } as never);

    await expect(
      userService.deleteUser(username, "wrong-password"),
    ).rejects.toMatchObject({
      status: 403,
      code: "USER_DELETION_FORBIDDEN",
    });
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it("should throw 503 for unexpected Prisma errors", async () => {
    const databaseError = new Error("Database unavailable");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      password: mockUser.password,
    } as never);
    vi.mocked(prisma.user.delete).mockRejectedValue(databaseError);

    await expect(
      userService.deleteUser(username, password),
    ).rejects.toMatchObject({
      status: 503,
      code: "UNEXPECTED_DATABASE_ERROR",
      rawError: databaseError,
    });
    expect(prisma.user.delete).toHaveBeenCalledExactlyOnceWith({
      where: { username },
    });
  });
});
