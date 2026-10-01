import type { NextFunction, Request, Response } from "express";
import type { ZodObject } from "zod";

export default function payloadValidationMiddleware(schema: ZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.headers["content-type"] !== "application/json") {
      res.status(400).json({ code: "INVALID_CONTENT_TYPE" });
      return;
    }

    const { success, data, error } = schema.safeParse(req.body);

    if (!success) {
      res.status(400).json({
        code: "INVALID_PAYLOAD_FORMAT",
        zodIssues: error.issues.reduce(
          (acc, issue, i) => ({
            ...acc,
            [issue.path.join(".") || `issue_${i}`]: issue.message,
          }),
          {},
        ),
      });
      return;
    }

    req.body = data;

    next();
  };
}
