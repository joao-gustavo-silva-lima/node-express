import { LinkService } from "./link.service.js";
import { Request, Response } from "express";

export class LinkController {
  public static list(req: Request, res: Response) {
    res.json(LinkService.list(req.validQuery));
  }

  public static register(req: Request, res: Response) {
    res.status(201).json(LinkService.register(req.body));
  }

  public static getByID(req: Request, res: Response) {
    res.json(LinkService.getByID(req.params.id as string));
  }

  public static deleteByID(req: Request, res: Response) {
    LinkService.deleteByID(req.params.id as string);

    res.json({
      message: `The link within ID '${req.params.id}' was deleted successfully`,
    });
  }

  public static updateByID(req: Request, res: Response) {
    res.json(LinkService.updateByID(req.params.id as string, req.body));
  }

  public static redirectByID(req: Request, res: Response) {
    res.json({
      redirectURL: LinkService.redirectByID(req.params.id as string),
    });
  }
}
