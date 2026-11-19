import { describe, expect, it, vi } from "vitest";
import prisma from "../prisma/prisma";
import type { UserInput } from "./User.schema";
import * as UserService from "./User.service";

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

describe("createUser", () => {
  it("should call prisma create for the User model and return and user and an authentication token", async () => {
    const mockUserInput: UserInput = {
      name: mockUser.name,
      email: mockUser.email,
      username: mockUser.username,
      password: "non-hashed-password",
    };
    const { password, ...expectedUser } = mockUser;

    const { user, token } = await UserService.createUser(mockUserInput);

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
});
