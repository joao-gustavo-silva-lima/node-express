import { UUID } from "node:crypto";

export const LINK = {
  id: "" as string | UUID,
  title: "",
  url: "",
  category: "",
  tags: [""],
  clicks: -1,
  createdAt: "" as string | Date,
};

export type Link = typeof LINK;
export type Query = Partial<Link>;
export type LinkID = typeof LINK.id;
export type LinkProperty = keyof typeof LINK;
