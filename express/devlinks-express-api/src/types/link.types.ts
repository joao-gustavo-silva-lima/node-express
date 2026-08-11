import { RequestHandler } from "express";

export type Controller = {
  [name: string]: RequestHandler;
};

export const LINK_DTO = {
  id: "",
  title: "",
  url: "",
  category: "",
  tags: [""],
  clicks: -1,
  createdAt: "" as string | Date,
};

export type LinkID = string;
export type Link = typeof LINK_DTO;
export type LinkProperty = keyof typeof LINK_DTO;
export type Query = Partial<Link>;
