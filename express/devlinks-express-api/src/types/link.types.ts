export const LINK = {
  id: "",
  title: "",
  url: "",
  category: "",
  tags: [""],
  clicks: -1,
  createdAt: "" as string | Date,
};

export type Link = typeof LINK;
export type Query = Partial<Link>;
export type LinkProperty = keyof typeof LINK;
