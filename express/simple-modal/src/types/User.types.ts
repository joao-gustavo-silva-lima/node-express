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
});

export type User = z.infer<typeof userSchema>;
