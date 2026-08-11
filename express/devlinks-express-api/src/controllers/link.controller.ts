import { LinkService } from "../services/link.service.js";
import { Controller } from "../types/link.types.js";
import { Request, Response } from "express";

export const LinkController: Controller = {
  list: (req: Request, res: Response) => {
    res.json(LinkService.list(req.query));
  },
};
