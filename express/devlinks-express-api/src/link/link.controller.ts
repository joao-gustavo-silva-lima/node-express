import * as LinkService from "./link.service.js";
import { Request, Response } from "express";

export function list(req: Request, res: Response) {
  res.json(LinkService.list(req.validQuery));
}

export function register(req: Request, res: Response) {
  res.status(201).json(LinkService.register(req.body));
}

export function getByID(req: Request, res: Response) {
  res.json(LinkService.getByID(req.params.id as string));
}

export function deleteByID(req: Request, res: Response) {
  LinkService.deleteByID(req.params.id as string);

  res.json({
    message: `The link within ID '${req.params.id}' was deleted successfully`,
  });
}

export function updateByID(req: Request, res: Response) {
  res.json(LinkService.updateByID(req.params.id as string, req.body));
}

export function redirectByID(req: Request, res: Response) {
  res.json({
    redirectURL: LinkService.redirectByID(req.params.id as string),
  });
}
