import * as z from "zod";

import { timestampSchema, uuidSchema } from "./common.schema";
import { linkSchema } from "./Link.schema";

const usernameSchema = z
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

const nameSchema = z
  .string({
    error: "NAME_REQUIRED",
  })
  .trim()
  .min(2, {
    error: "NAME_TOO_SHORT",
  })
  .max(255, {
    error: "NAME_TOO_LONG",
  })
  .refine((value) => /\p{L}/u.test(value), {
    error: "NAME_MUST_CONTAIN_LETTERS",
  });

const emailSchema = z
  .string({
    error: "EMAIL_REQUIRED",
  })
  .trim()
  .toLowerCase()
  .max(255, {
    error: "EMAIL_TOO_LONG",
  })
  .pipe(
    z.email({
      error: "EMAIL_INVALID_FORMAT",
    }),
  );

const passwordSchema = z
  .string({
    error: "PASSWORD_REQUIRED",
  })
  .min(12, {
    error: "PASSWORD_TOO_SHORT",
  })
  .max(72, {
    error: "PASSWORD_TOO_LONG",
  })
  .regex(/[a-z]/, {
    error: "PASSWORD_MISSING_LOWERCASE",
  })
  .regex(/[A-Z]/, {
    error: "PASSWORD_MISSING_UPPERCASE",
  })
  .regex(/[0-9]/, {
    error: "PASSWORD_MISSING_NUMBER",
  })
  .regex(/[^A-Za-z0-9]/, {
    error: "PASSWORD_MISSING_SPECIAL_CHARACTER",
  })
  .refine((value) => !/\s/.test(value), {
    error: "PASSWORD_CONTAINS_WHITESPACE",
  });

export const userSchema = z.object({
  id: uuidSchema,

  name: nameSchema,
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,

  links: z.array(linkSchema),

  createdAt: timestampSchema,
  lastEdition: timestampSchema,
});

export const loginUserSchema = z
  .object({
    username: z.string().optional(),
    email: z.string().optional(),
    password: z.string(),
  })
  .refine((data) => data.username || data.email, {
    error: "LOGIN_REQUIRES_USERNAME_OR_EMAIL",
    path: ["username"],
  });

export const createUserSchema = userSchema.omit({
  id: true,
  links: true,
  createdAt: true,
  lastEdition: true,
});

export const updateUserSchema = createUserSchema
  .omit({ password: true })
  .partial();

export const deleteUserSchema = z.object({
  password: z.string(),
});

export type User = z.infer<typeof userSchema>;
export type UserInput = z.infer<typeof createUserSchema>;
export type loginUserInput = z.infer<typeof loginUserSchema>;
export type updateUserInput = z.infer<typeof updateUserSchema>;
