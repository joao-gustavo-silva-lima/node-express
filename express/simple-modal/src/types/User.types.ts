import { z } from "zod";

export const userSchema = z.object({
  id: z
    .string({ error: "INVALID_ID_TYPE" })
    .optional()
    .transform(() => crypto.randomUUID()),

  name: z
    .string({ error: "INVALID_NAME_TYPE" })
    .min(1, { error: "NAME_REQUIRED" }),

  email: z.email({ error: "INVALID_EMAIL_FORMAT" }),

  createdAt: z.iso
    .datetime({ error: "INVALID_ISO_DATE_FORMAT" })
    .optional()
    .transform(() => new Date().toISOString()),

  password: z
    .string({
      error: "PASSWORD_MUST_BE_STRING",
    })
    .min(8, { error: "PASSWORD_TOO_SHORT" })
    .max(100, { error: "PASSWORD_TOO_LONG" })
    .regex(/[A-Z]/, { error: "PASSWORD_MISSING_UPPERCASE" })
    .regex(/[a-z]/, { error: "PASSWORD_MISSING_LOWERCASE" })
    .regex(/[0-9]/, { error: "PASSWORD_MISSING_NUMBER" })
    .regex(/[^a-zA-Z0-9]/, { error: "PASSWORD_MISSING_SPECIAL_CHARACTER" }),
});

export type User = z.infer<typeof userSchema>;
