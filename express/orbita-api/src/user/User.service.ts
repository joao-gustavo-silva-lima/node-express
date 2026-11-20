import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import HttpError from "../common/classes/HttpError.js";
import prisma from "../prisma/prisma.js";
import {
  type loginUserInput,
  type updateUserInput,
  type UserInput,
} from "./User.schema.js";
import {
  generateAuthenticationToken,
  hashPassword,
  comparePasswords,
} from "./User.utils.js";

export async function createUser(userInput: UserInput) {
  try {
    const passwordHash = await hashPassword(userInput.password);

    const { password, ...user } = await prisma.user.create({
      data: {
        ...userInput,
        password: passwordHash,
      },
      include: { links: true },
    });

    const token = generateAuthenticationToken(user.username);

    return { user, token };
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new HttpError(
          409,
          `USER_CREATION_CONFLICT`,
          `The email/username is already in use.`,
        );
      }
    }

    console.error("Unknown error during user creation:", error);

    throw error;
  }
}

export async function loginUser(credentials: loginUserInput) {
  try {
    const user = await prisma.user.findFirst({
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
      include: {
        links: true,
      },
    });

    if (
      user === null ||
      !(await comparePasswords(credentials.password, user.password))
    ) {
      throw new HttpError(
        401,
        "USER_LOGIN_INVALID_CREDENTIALS",
        "The username/email or password is incorrect.",
      );
    }

    const token = generateAuthenticationToken(user.username);

    return { user, token };
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
      include: {
        links: {
          where: {
            authorUsername: username,
            ...(authenticatedUsername !== username && { visibility: "PUBLIC" }),
          },
        },
      },
    });

    if (user === null) {
      throw new HttpError(
        404,
        "USER_NOT_FOUND",
        `A user was not found with the username '${username}'`,
      );
    }

    return user;
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
        password: true,
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

    const hasMatchingPasswords = await comparePasswords(
      userInput.currentPassword,
      query.password,
    );

    if (!hasMatchingPasswords) {
      throw new HttpError(
        403,
        "USER_UPDATE_FORBIDDEN",
        `Passwords do not match. User update could not proceed.`,
      );
    }

    const hasBeenUpdated =
      query.createdAt.getTime() !== query.lastEdition.getTime();

    if (hasBeenUpdated) {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      if (query.lastEdition > threeDaysAgo) {
        throw new HttpError(
          403,
          "USER_UPDATE_NOT_ALLOWED_TOO_SOON",
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
          "USER_UPDATE_DETAILS_CONFLICT",
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
        ...(password !== undefined && {
          password: await hashPassword(password),
        }),
      },
      omit: {
        password: true,
      },
      include: { links: true },
    });

    const token = generateAuthenticationToken(updatedUser.username);

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
        "USER_UPDATE_DETAILS_CONFLICT",
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
    const hasMatchingPasswords = await comparePasswords(password, passwordHash);

    if (!hasMatchingPasswords) {
      throw new HttpError(
        403,
        "USER_DELETION_FORBIDDEN",
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
