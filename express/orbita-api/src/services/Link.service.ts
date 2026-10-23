import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import HttpError from "../common/classes/HttpError";
import prisma from "../lib/prisma";
import type { LinkInput, LinkUpdateInput } from "../schemas/Link.schema";

export async function createLink(authorUsername: string, linkInput: LinkInput) {
  try {
    return await prisma.link.create({
      data: {
        ...linkInput,
        authorUsername,
      },
    });
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new HttpError(
        409,
        "LINK_CONFLICT",
        "A link with one or more of these details already exists.",
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

export async function fetchLink(id: number, authenticatedUsername: string) {
  try {
    const link = await prisma.link.findFirst({
      where: {
        id,
        OR: [
          { authorUsername: authenticatedUsername },
          { visibility: "PUBLIC" },
        ],
      },
    });

    if (link === null) {
      throw new HttpError(
        404,
        "LINK_NOT_FOUND",
        `A link was not found with the id '${id}'.`,
      );
    }

    return link;
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

export async function fetchLinks(authorUsername: string) {
  try {
    return await prisma.link.findMany({
      where: { authorUsername },
    });
  } catch (error) {
    throw new HttpError(
      503,
      "UNEXPECTED_DATABASE_ERROR",
      "An unexpected database error has ocurred. Try again later.",
      error as Error,
    );
  }
}

export async function updateLink(
  id: number,
  authorUsername: string,
  linkInput: LinkUpdateInput,
) {
  try {
    const link = await prisma.link.findFirst({
      where: {
        id,
        authorUsername,
      },
      select: {
        id: true,
      },
    });

    if (link === null) {
      throw new HttpError(
        404,
        "LINK_NOT_FOUND_FOR_UPDATE",
        `The link update failed: a link with the id '${id}' was not found.`,
      );
    }

    return await prisma.link.update({
      where: { id },
      data: {
        ...(linkInput.title !== undefined && { title: linkInput.title }),
        ...(linkInput.ref !== undefined && { ref: linkInput.ref }),
        ...(linkInput.visibility !== undefined && {
          visibility: linkInput.visibility,
        }),
      },
    });
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
        "LINK_CONFLICT",
        "A link with one or more of these details already exists.",
      );
    }

    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new HttpError(
        404,
        "LINK_NOT_FOUND_FOR_UPDATE",
        `The link update failed: a link with the id '${id}' was not found.`,
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

export async function deleteLink(id: number, authorUsername: string) {
  try {
    const result = await prisma.link.deleteMany({
      where: {
        id,
        authorUsername,
      },
    });

    if (result.count === 0) {
      throw new HttpError(
        404,
        "LINK_NOT_FOUND_FOR_DELETION",
        `The link deletion failed: a link with the id '${id}' was not found.`,
      );
    }
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
