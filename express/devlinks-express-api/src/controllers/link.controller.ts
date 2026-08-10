import { LinkService } from "../services/link.service.js";
import { Controller, Query } from "../types/link.types.js";
import { Request, Response } from "express";

export const LinkController: Controller = {
  list: async (req: Request, res: Response) => {
    const result = await LinkService.list(req.query as Query);

    res.json(result);
  },
};
