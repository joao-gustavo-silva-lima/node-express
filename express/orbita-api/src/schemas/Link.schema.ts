import * as z from "zod";

import { timestampSchema, uuidSchema } from "./common.schema";

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

export const linkSchema = z.object({
  id: z.number().int().positive().optional(),

  authorId: uuidSchema,

  title: titleSchema,

  ref: refSchema,

  createdAt: timestampSchema.optional(),

  lastEdition: timestampSchema.optional(),
});

export type LinkInput = z.infer<typeof linkSchema>;
export type Link = Required<LinkInput>;
