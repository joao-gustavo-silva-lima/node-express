import { NextFunction, Request, Response } from "express";
import { StatefulError } from "../utils/stateful-error.utils.js";

export default function errorHandlerMiddleware(
  error: StatefulError | Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (error instanceof StatefulError) {
    res.status(error.status).json({
      code: error.code,
      message: error.message,
      appendix: error.appendix,
    });
    return;
  }

  res.on("finish", () => console.error(error.stack ?? error.message));

  res
    .status(500)
    .json({ code: "INTERNAL_SERVER_ERROR", message: "Internal server error" });
}
