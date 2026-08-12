import { z } from "zod";

const linkSchema = z.object({
  id: z.union([z.string(), z.uuid()]),
  title: z.string(),
  url: z.url(),
  category: z.string(),
  tags: z.array(z.string()),
  clicks: z.number().int(),
  createdAt: z.union([z.string(), z.date()]),
});

export const LINK_KEYS = new Set(
  Object.keys(linkSchema.shape),
) as Set<LinkProperty>;

export type Link = z.infer<typeof linkSchema>;
export type LinkProperty = keyof Link;
export type LinkID = Link["id"];

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

export type ProtoLink = z.infer<typeof protoLinkSchema>;

export type Query = Partial<Link>;
