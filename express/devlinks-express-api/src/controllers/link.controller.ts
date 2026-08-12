import { LinkService } from "../services/link.service.js";
import { Request, Response } from "express";

export class LinkController {
  public static list(req: Request, res: Response) {
    res.json(LinkService.list(req.query));
  }

  public static getByID(req: Request, res: Response) {
    res.json(LinkService.getByID(Number(req.params.id)));
  }

  public static getByIDAndRedirect(req: Request, res: Response) {
    res.redirect(LinkService.getByIDAndRedirect(Number(req.params.id)));
  }
}
