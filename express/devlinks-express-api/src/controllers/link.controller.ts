import { LinkService } from "../services/link.service.js";
import { Request, Response } from "express";

export class LinkController {
  public static list(req: Request, res: Response) {
    res.json(LinkService.list(req.query));
  }

  public static getByID(req: Request, res: Response) {
    res.json(LinkService.getByID(Number(req.params.id)));
  }

  public static deleteByID(req: Request, res: Response) {
    LinkService.deleteByID(Number(req.params.id));

    res.json({
      message: `The link within ID '${req.params.id}' was deleted successfully`,
    });
  }

  public static redirectByID(req: Request, res: Response) {
    res.redirect(LinkService.redirectByID(Number(req.params.id)));
  }
}
