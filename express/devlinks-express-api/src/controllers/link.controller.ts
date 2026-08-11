import { LinkService } from "../services/link.service.js";
import { Controller } from "../types/link.types.js";
import { Request, Response } from "express";

export const LinkController: Controller = {
  list: (req: Request, res: Response) => {
    res.json(LinkService.list(req.query));
  },
  getByID: (req: Request, res: Response) => {
    const { id } = req.params;
    const result = LinkService.getByID(id as string);

    if (result !== undefined) {
      return res.json(result);
    }

    res.status(404).json({ message: `Link within ID '${id}' not found` });
  },
};
