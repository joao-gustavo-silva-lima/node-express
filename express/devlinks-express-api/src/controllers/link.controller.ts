import { LinkService } from "../services/link.service.js";
import { Request, Response } from "express";
import { LinkID } from "../types/link.types.js";

export class LinkController {
  public static list(req: Request, res: Response) {
    res.json(LinkService.list(req.query));
  }

  public static register(req: Request, res: Response) {
    res.json({
      message: `The link was created successfully`,
      link: LinkService.register(req.body),
    });
  }

  public static getByID(req: Request, res: Response) {
    res.json(LinkService.getByID(req.params.id as LinkID));
  }

  public static deleteByID(req: Request, res: Response) {
    LinkService.deleteByID(req.params.id as LinkID);

    res.json({
      message: `The link within ID '${req.params.id}' was deleted successfully`,
    });
  }

  public static redirectByID(req: Request, res: Response) {
    res.redirect(LinkService.redirectByID(req.params.id as LinkID));
  }
}
