import type { Request, Response } from "express";
import HttpError from "../common/classes/HttpError.js";
import * as linkService from "../services/Link.service.js";
import { linkIdSchema } from "../schemas/Link.schema.js";

function parseLinkId(id: string | undefined) {
  const result = linkIdSchema.safeParse(id);

  if (!result.success) {
    throw new HttpError(
      400,
      "INVALID_LINK_ID",
      "The link id must be a positive integer.",
    );
  }

  return result.data;
}

export async function createLink(req: Request, res: Response) {
  const link = await linkService.createLink(req.authUsername!, req.body);

  res.status(201).json(link);
}

export async function fetchLink(req: Request, res: Response) {
  const link = await linkService.fetchLink(
    parseLinkId(req.params.id as string),
    req.authUsername!,
  );

  res.json(link);
}

export async function fetchLinks(req: Request, res: Response) {
  const links = await linkService.fetchLinks(req.authUsername!);

  res.json(links);
}

export async function updateLink(req: Request, res: Response) {
  const link = await linkService.updateLink(
    parseLinkId(req.params.id as string),
    req.authUsername!,
    req.body,
  );

  res.json(link);
}

export async function deleteLink(req: Request, res: Response) {
  await linkService.deleteLink(
    parseLinkId(req.params.id as string),
    req.authUsername!,
  );

  res.json({
    code: "LINK_DELETED",
    message: "The link was deleted successfully.",
  });
}
