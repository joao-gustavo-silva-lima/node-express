import { compare, hash } from "bcrypt";
import {
  type loginUserInput,
  type updateUserInput,
  type UserInput,
} from "../schemas/User.schema";
import prisma from "../lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import HttpError from "../common/classes/HttpError";
import generateToken from "../common/utils/generateToken";

export async function createUser(userInput: UserInput) {
  try {
    const passwordHash = await hash(userInput.password, 10);

    const { password, ...user } = await prisma.user.create({
      data: {
        ...userInput,
        password: passwordHash,
      },
    });

    const token = generateToken(user.username);

    return { user, token };
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const constraintName =
          (error as any).meta?.driverAdapterError?.cause?.constraint?.index ||
          "";
        const duplicateField = constraintName.includes("username")
          ? "USERNAME"
          : "EMAIL";

        throw new HttpError(
          409,
          `USER_${duplicateField}_CONFLICT`,
          `The ${duplicateField.toLowerCase()} is already in use.`,
        );
      }
    }

    console.error("Unknown error during user creation:", error);

    throw error;
  }
}

export async function loginUser(credentials: loginUserInput) {
  try {
    const query = await prisma.user.findFirst({
      where: {
        OR: [
          ...(credentials.username !== undefined
            ? [{ username: credentials.username }]
            : []),
          ...(credentials.email !== undefined
            ? [{ email: credentials.email }]
            : []),
        ],
      },
      select: {
        username: true,
        password: true,
      },
    });

    if (query === null) {
      throw new HttpError(
        401,
        "INVALID_LOGIN_CREDENTIALS",
        "The username/email or password is incorrect.",
      );
    }

    const { password: passwordHash, username } = query;
    const hasMatchingPasswords = await compare(
      credentials.password,
      passwordHash,
    );

    if (!hasMatchingPasswords) {
      throw new HttpError(
        401,
        "INVALID_LOGIN_CREDENTIALS",
        "The username/email or password is incorrect.",
      );
    }

    const token = generateToken(username);

    return token;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(
      503,
      "UNEXPECTED_DATABASE_ERROR",
      "An unexpected database error has ocurred. Try again later.",
      error as Error,
    );
  }
}

export async function fetchUser(
  username: string,
  authenticatedUsername: string | null,
) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        username,
      },
      omit: {
        password: true,
      },
    });

    if (user === null) {
      throw new HttpError(
        404,
        "USER_NOT_FOUND",
        `A user was not found with the username '${username}'`,
      );
    }

    const fetchPrivateLinks = authenticatedUsername === user.username;

    const links = await prisma.link.findMany({
      where: {
        authorId: user.id,
        ...(!fetchPrivateLinks && { visibility: "PUBLIC" }),
      },
    });

    return { ...user, links };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(
      503,
      "UNEXPECTED_DATABASE_ERROR",
      "An unexpected database error has ocurred. Try again later.",
      error as Error,
    );
  }
}

export async function updateUser(
  targetUsername: string,
  userInput: updateUserInput,
) {
  try {
    const query = await prisma.user.findUnique({
      where: { username: targetUsername },
      select: {
        createdAt: true,
        lastEdition: true,
      },
    });

    if (query === null) {
      throw new HttpError(
        404,
        "USER_NOT_FOUND_FOR_UPDATE",
        `The user update failed: a user with the username '${targetUsername}' was not found`,
      );
    }

    const hasBeenUpdated =
      query.createdAt.getTime() !== query.lastEdition.getTime();

    if (hasBeenUpdated) {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      if (query.lastEdition > threeDaysAgo) {
        throw new HttpError(
          403,
          "USER_UPDATE_TOO_RECENT",
          "The user can only be updated once every three days.",
        );
      }
    }

    const { name, username, email, password } = userInput;

    if (username !== undefined || email !== undefined) {
      const duplicateUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(username !== undefined ? [{ username: username }] : []),
            ...(email !== undefined ? [{ email }] : []),
          ],
          NOT: { username: targetUsername },
        },
        select: {
          id: true,
        },
      });

      if (duplicateUser !== null) {
        throw new HttpError(
          409,
          "USER_UPDATE_CONFLICT",
          "One or more user details are already in use.",
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { username: targetUsername },
      data: {
        ...(name !== undefined && { name }),
        ...(username !== undefined && { username }),
        ...(email !== undefined && { email }),
        ...(password !== undefined && { password }),
      },
      omit: {
        password: true,
      },
    });

    const token = generateToken(updatedUser.username);

    return { updatedUser, token };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new HttpError(
        409,
        "USER_UPDATE_CONFLICT",
        "One or more user details are already in use.",
      );
    }

    throw new HttpError(
      503,
      "UNEXPECTED_DATABASE_ERROR",
      "An unexpected database error has ocurred. Try again later.",
      error as Error,
    );
  }
}

export async function deleteUser(username: string, password: string) {
  try {
    const query = await prisma.user.findUnique({
      where: { username },
      select: {
        password: true,
      },
    });

    if (query === null) {
      throw new HttpError(
        404,
        "USER_NOT_FOUND_FOR_DELETION",
        `The user deletion failed: a user with the username '${username}' may have been already deleted`,
      );
    }

    const { password: passwordHash } = query;
    const hasMatchingPasswords = await compare(password, passwordHash);

    if (!hasMatchingPasswords) {
      throw new HttpError(
        403,
        "FORBIDDEN_USER_DELETION_ATTEMPT",
        `Passwords do not match. User deletion could not proceed.`,
      );
    }

    await prisma.user.delete({
      where: { username },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(
      503,
      "UNEXPECTED_DATABASE_ERROR",
      "An unexpected database error has ocurred. Try again later.",
      error as Error,
    );
  }
}
