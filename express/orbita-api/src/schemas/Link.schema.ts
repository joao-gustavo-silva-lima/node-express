import * as z from "zod";

import { timestampSchema, usernameSchema } from "./common.schema.js";

const titleSchema = z
  .string({
    error: "TITLE_REQUIRED",
  })
  .trim()
  .min(1, {
    error: "TITLE_REQUIRED",
  })
  .max(255, {
    error: "TITLE_TOO_LONG",
  });

const refSchema = z
  .string({
    error: "REFERENCE_REQUIRED",
  })
  .trim()
  .min(1, {
    error: "REFERENCE_REQUIRED",
  })
  .max(255, {
    error: "REFERENCE_TOO_LONG",
  });

const visibilitySchema = z
  .string({
    error: "VISIBILITY_REQUIRED",
  })
  .pipe(z.enum(["PUBLIC", "PRIVATE"], { error: "INVALID_VISIBILITY" }));

export const linkSchema = z.object({
  id: z.number().int().positive(),
  authorUsername: usernameSchema,

  ref: refSchema,
  title: titleSchema,
  visibility: visibilitySchema,

  createdAt: timestampSchema,
  lastEdition: timestampSchema,
});

export const createLinkSchema = linkSchema.omit({
  id: true,
  authorUsername: true,
  createdAt: true,
  lastEdition: true,
});

export const updateLinkSchema = createLinkSchema.partial();
export const linkIdSchema = z.coerce.number().int().positive();

export type Link = z.infer<typeof linkSchema>;
export type LinkInput = z.infer<typeof createLinkSchema>;
export type LinkUpdateInput = z.infer<typeof updateLinkSchema>;
