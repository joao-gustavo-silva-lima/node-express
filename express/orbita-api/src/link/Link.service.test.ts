import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "../prisma/prisma";
import type { Link, LinkInput, LinkUpdateInput } from "./Link.schema";
import * as linkService from "./Link.service";

const mockLinkInput: LinkInput = {
  ref: "typescript-guide",
  title: "TypeScript Guide",
  visibility: "PUBLIC",
};
const mockLink: Link = {
  id: 1,
  authorUsername: "joaosilva",
  ...mockLinkInput,
  createdAt: "2026-11-19T14:00:00.000Z",
  lastEdition: "2026-11-19T14:00:00.000Z",
};

vi.mock("../prisma/prisma", () => ({
  default: {
    link: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createLink", () => {
  const authorUsername = mockLink.authorUsername;

  it("should create a link with its author and return the created record", async () => {
    vi.mocked(prisma.link.count).mockResolvedValue(2);
    vi.mocked(prisma.link.create).mockResolvedValue(mockLink as never);

    const result = await linkService.createLink(authorUsername, mockLinkInput);

    expect(prisma.link.count).toHaveBeenCalledExactlyOnceWith({
      where: { authorUsername },
    });
    expect(prisma.link.create).toHaveBeenCalledExactlyOnceWith({
      data: { ...mockLinkInput, authorUsername },
    });
    expect(result).toStrictEqual(mockLink);
  });

  it("should throw 403 and skip creation when the author reached the quota", async () => {
    vi.mocked(prisma.link.count).mockResolvedValue(10);

    await expect(
      linkService.createLink(authorUsername, mockLinkInput),
    ).rejects.toMatchObject({
      status: 403,
      code: "LINK_CREATION_QUOTA_EXCEEDED",
    });
    expect(prisma.link.create).not.toHaveBeenCalled();
  });

  it("should convert a Prisma P2002 error into a 409 HttpError", async () => {
    vi.mocked(prisma.link.count).mockResolvedValue(0);
    vi.mocked(prisma.link.create).mockRejectedValue(
      new PrismaClientKnownRequestError("unique constraint violation", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    await expect(
      linkService.createLink(authorUsername, mockLinkInput),
    ).rejects.toMatchObject({
      status: 409,
      code: "LINK_CONFLICT",
    });
  });

  it("should convert unexpected Prisma errors into a 503 HttpError", async () => {
    const databaseError = new Error("Database unavailable");
    vi.mocked(prisma.link.count).mockRejectedValue(databaseError);

    await expect(
      linkService.createLink(authorUsername, mockLinkInput),
    ).rejects.toMatchObject({
      status: 503,
      code: "UNEXPECTED_DATABASE_ERROR",
      rawError: databaseError,
    });
    expect(prisma.link.create).not.toHaveBeenCalled();
  });
});

describe("fetchLink", () => {
  const authenticatedUsername = "joaosilva";

  it("should find a link accessible to its owner or to the public", async () => {
    vi.mocked(prisma.link.findFirst).mockResolvedValue(mockLink as never);

    const result = await linkService.fetchLink(
      mockLink.id,
      authenticatedUsername,
    );

    expect(prisma.link.findFirst).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: mockLink.id,
        OR: [
          { authorUsername: authenticatedUsername },
          { visibility: "PUBLIC" },
        ],
      },
    });
    expect(result).toStrictEqual(mockLink);
  });

  it("should throw 404 when no accessible link is found", async () => {
    vi.mocked(prisma.link.findFirst).mockResolvedValue(null);

    await expect(
      linkService.fetchLink(mockLink.id, authenticatedUsername),
    ).rejects.toMatchObject({
      status: 404,
      code: "LINK_NOT_FOUND",
    });
  });

  it("should convert unexpected Prisma errors into a 503 HttpError", async () => {
    const databaseError = new Error("Database unavailable");
    vi.mocked(prisma.link.findFirst).mockRejectedValue(databaseError);

    await expect(
      linkService.fetchLink(mockLink.id, authenticatedUsername),
    ).rejects.toMatchObject({
      status: 503,
      code: "UNEXPECTED_DATABASE_ERROR",
      rawError: databaseError,
    });
  });
});

describe("fetchLinks", () => {
  it("should fetch all links belonging to the requested author", async () => {
    vi.mocked(prisma.link.findMany).mockResolvedValue([mockLink] as never);

    const result = await linkService.fetchLinks(mockLink.authorUsername);

    expect(prisma.link.findMany).toHaveBeenCalledExactlyOnceWith({
      where: { authorUsername: mockLink.authorUsername },
    });
    expect(result).toStrictEqual([mockLink]);
  });

  it("should convert unexpected Prisma errors into a 503 HttpError", async () => {
    const databaseError = new Error("Database unavailable");
    vi.mocked(prisma.link.findMany).mockRejectedValue(databaseError);

    await expect(
      linkService.fetchLinks(mockLink.authorUsername),
    ).rejects.toMatchObject({
      status: 503,
      code: "UNEXPECTED_DATABASE_ERROR",
      rawError: databaseError,
    });
  });
});

describe("updateLink", () => {
  const id = mockLink.id;
  const authorUsername = mockLink.authorUsername;

  it("should update only provided fields after confirming link ownership", async () => {
    const updateData: LinkUpdateInput = {
      title: "Updated title",
    };
    const updatedLink = { ...mockLink, ...updateData };
    vi.mocked(prisma.link.findFirst).mockResolvedValue({ id } as never);
    vi.mocked(prisma.link.update).mockResolvedValue(updatedLink as never);

    const result = await linkService.updateLink(id, authorUsername, updateData);

    expect(prisma.link.findFirst).toHaveBeenCalledExactlyOnceWith({
      where: { id, authorUsername },
      select: { id: true },
    });
    expect(prisma.link.update).toHaveBeenCalledExactlyOnceWith({
      where: { id },
      data: { title: updateData.title },
    });
    expect(result).toStrictEqual(updatedLink);
  });

  it("should pass each provided field to Prisma", async () => {
    const updateData: LinkUpdateInput = {
      title: "Updated title",
      ref: "updated-reference",
      visibility: "PRIVATE",
    };
    vi.mocked(prisma.link.findFirst).mockResolvedValue({ id } as never);
    vi.mocked(prisma.link.update).mockResolvedValue({
      ...mockLink,
      ...updateData,
    } as never);

    await linkService.updateLink(id, authorUsername, updateData);

    expect(prisma.link.update).toHaveBeenCalledExactlyOnceWith({
      where: { id },
      data: updateData,
    });
  });

  it("should throw 404 and skip update when the link is not owned by the author", async () => {
    vi.mocked(prisma.link.findFirst).mockResolvedValue(null);

    await expect(
      linkService.updateLink(id, authorUsername, { title: "Updated title" }),
    ).rejects.toMatchObject({
      status: 404,
      code: "LINK_NOT_FOUND_FOR_UPDATE",
    });
    expect(prisma.link.update).not.toHaveBeenCalled();
  });

  it("should convert a Prisma P2002 update error into a 409 HttpError", async () => {
    vi.mocked(prisma.link.findFirst).mockResolvedValue({ id } as never);
    vi.mocked(prisma.link.update).mockRejectedValue(
      new PrismaClientKnownRequestError("unique constraint violation", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    await expect(
      linkService.updateLink(id, authorUsername, { title: "Duplicate title" }),
    ).rejects.toMatchObject({
      status: 409,
      code: "LINK_CONFLICT",
    });
  });

  it("should convert a Prisma P2025 update error into a 404 HttpError", async () => {
    vi.mocked(prisma.link.findFirst).mockResolvedValue({ id } as never);
    vi.mocked(prisma.link.update).mockRejectedValue(
      new PrismaClientKnownRequestError("record not found", {
        code: "P2025",
        clientVersion: "test",
      }),
    );

    await expect(
      linkService.updateLink(id, authorUsername, { title: "Updated title" }),
    ).rejects.toMatchObject({
      status: 404,
      code: "LINK_NOT_FOUND_FOR_UPDATE",
    });
  });

  it("should convert unexpected Prisma errors into a 503 HttpError", async () => {
    const databaseError = new Error("Database unavailable");
    vi.mocked(prisma.link.findFirst).mockResolvedValue({ id } as never);
    vi.mocked(prisma.link.update).mockRejectedValue(databaseError);

    await expect(
      linkService.updateLink(id, authorUsername, { title: "Updated title" }),
    ).rejects.toMatchObject({
      status: 503,
      code: "UNEXPECTED_DATABASE_ERROR",
      rawError: databaseError,
    });
  });
});

describe("deleteLink", () => {
  const id = mockLink.id;
  const authorUsername = mockLink.authorUsername;

  it("should delete only the link belonging to the author", async () => {
    vi.mocked(prisma.link.deleteMany).mockResolvedValue({ count: 1 });

    await expect(
      linkService.deleteLink(id, authorUsername),
    ).resolves.toBeUndefined();

    expect(prisma.link.deleteMany).toHaveBeenCalledExactlyOnceWith({
      where: { id, authorUsername },
    });
  });

  it("should throw 404 when no link was deleted", async () => {
    vi.mocked(prisma.link.deleteMany).mockResolvedValue({ count: 0 });

    await expect(
      linkService.deleteLink(id, authorUsername),
    ).rejects.toMatchObject({
      status: 404,
      code: "LINK_NOT_FOUND_FOR_DELETION",
    });
    expect(prisma.link.deleteMany).toHaveBeenCalledExactlyOnceWith({
      where: { id, authorUsername },
    });
  });

  it("should convert unexpected Prisma errors into a 503 HttpError", async () => {
    const databaseError = new Error("Database unavailable");
    vi.mocked(prisma.link.deleteMany).mockRejectedValue(databaseError);

    await expect(
      linkService.deleteLink(id, authorUsername),
    ).rejects.toMatchObject({
      status: 503,
      code: "UNEXPECTED_DATABASE_ERROR",
      rawError: databaseError,
    });
  });
});
