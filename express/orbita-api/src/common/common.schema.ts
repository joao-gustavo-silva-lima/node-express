import * as z from "zod";

export const usernameSchema = z
  .string({
    error: "USERNAME_REQUIRED",
  })
  .trim()
  .toLowerCase()
  .min(3, {
    error: "USERNAME_TOO_SHORT",
  })
  .max(30, {
    error: "USERNAME_TOO_LONG",
  })
  .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, {
    error: "USERNAME_INVALID_FORMAT",
  });

export const timestampSchema = z.iso.datetime({
  offset: true,
  error: "INVALID_TIMESTAMP",
});
