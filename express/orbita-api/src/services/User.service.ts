import { hash } from "bcrypt";
import { type UserInput } from "../schemas/User.schema";
import prisma from "../lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import HttpError from "../common/classes/HttpError";

export async function createUser(userInput: UserInput) {
  try {
    const passwordHash = await hash(userInput.password, 10);

    const { password, ...user } = await prisma.user.create({
      data: {
        ...userInput,
        password: passwordHash,
      },
    });

    return user;
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
