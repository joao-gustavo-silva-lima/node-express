import { LinkService } from "../services/link.service.js";
import { Controller, Query } from "../types/link.types.js";
import { Request, Response } from "express";

export const LinkController: Controller = {
  list: (req: Request, res: Response) => {
    const result = LinkService.list(req.query as Query);

    res.json(result);
  },
};
