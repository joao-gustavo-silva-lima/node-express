import { hash } from "bcrypt";
import { type UserInput } from "../schemas/User.schema";
import prisma from "../lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import HttpError from "../common/classes/HttpError";
import jwt from "jsonwebtoken";

export async function createUser(userInput: UserInput) {
  try {
    const passwordHash = await hash(userInput.password, 10);

    const { password, ...user } = await prisma.user.create({
      data: {
        ...userInput,
        password: passwordHash,
      },
    });

    const token = jwt.sign(
      { authUsername: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: "1Day" },
    );

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
        `A user was not found for the username '${username}'`,
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
