import { RequestHandler } from "express";
import { UUID } from "node:crypto";

export type Controller = {
  [name: string]: RequestHandler;
};

export type LinkID = string | UUID;

export interface Link {
  id: LinkID;
  title: string;
  url: string;
  category: string;
  tags: string[];
  clicks: number;
  createdAt: Date | string;
}

export interface Query {
  [name: string]: string;
}
