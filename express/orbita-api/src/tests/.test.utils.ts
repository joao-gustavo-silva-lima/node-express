import request from "supertest";
import app from "../main";
import prisma from "../prisma/prisma";
import { UserInput } from "../user/User.schema";
import { LinkInput } from "../link/Link.schema";

export const mockUserInput: UserInput = {
  name: "Test Test",
  email: "test@email.com",
  username: "test_username",
  password: "testPassword@123",
};

export const mockUserCreation = () => {
  return request(app)
    .post("/api/v1/user/auth")
    .set("Content-Type", "application/json")
    .send(mockUserInput);
};

export const mockPublicLinkInput: LinkInput = {
  title: "Public Link",
  visibility: "PUBLIC",
  ref: "https://example.com",
};

export const mockPrivateLinkInput: LinkInput = {
  title: "Private Link",
  visibility: "PRIVATE",
  ref: "https://example.com/private",
};

export const mockLinkCreation = (
  cookies: string[],
  linkInput: LinkInput = mockPublicLinkInput,
) => {
  return request(app)
    .post("/api/v1/link")
    .set("Cookie", cookies)
    .set("Content-Type", "application/json")
    .send(linkInput);
};

export const mockUserLinksCreation = async () => {
  if (
    (await prisma.user.findUnique({
      where: { username: mockUserInput.username },
    })) === null
  ) {
    throw new Error(
      "Mocking link creation expects a previously mocked user creation",
    );
  }

  return await prisma.link.createManyAndReturn({
    data: [
      {
        ...mockPublicLinkInput,
        authorUsername: mockUserInput.username,
      },
      {
        ...mockPrivateLinkInput,
        authorUsername: mockUserInput.username,
      },
    ],
  });
};
