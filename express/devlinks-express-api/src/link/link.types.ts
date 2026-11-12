import { z } from "zod";

const idSchema = z.uuid();
const titleSchema = z.string();
const urlSchema = z.url();
const categorySchema = z.string();
const tagsSchema = z.array(z.string()).default([]);
const clicksSchema = z.number().int();
const createdAtSchema = z.iso.datetime();

export const linkSchema = z.object({
  id: idSchema,
  title: titleSchema,
  url: urlSchema,
  category: categorySchema,
  tags: tagsSchema,
  clicks: clicksSchema,
  createdAt: createdAtSchema,
});

export const createLinkSchema = linkSchema.pick({
  title: true,
  url: true,
  category: true,
  tags: true,
});

export type Link = z.infer<typeof linkSchema>;

export const protoLinkSchema = linkSchema
  .omit({
    id: true,
    clicks: true,
    createdAt: true,
  })
  .partial({
    category: true,
    tags: true,
  });

export const querySchema = linkSchema
  .pick({
    title: true,
    category: true,
  })
  .extend({
    tags: z
      .union([z.string(), z.array(z.string())])
      .transform((input) => (typeof input === "string" ? [input] : input)),
  })
  .partial();

export type ProtoLink = z.infer<typeof protoLinkSchema>;
export type ProtoLinkKeys = keyof ProtoLink;

export type Query = z.infer<typeof querySchema>;
