import { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { StatefulError } from "../utils/stateful-error.utils.js";
import { errorMiddleware } from "./error.middleware.js";

const req = {} as Request;
const res = {
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
  on: vi.fn(),
} as Partial<Response>;
const next = (() => undefined) as NextFunction;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("error middleware", () => {
  test.for([
    [400, "Bad Request"],
    [403, "Forbidden"],
    [502, "Bad Gateway"],
  ] as [number, string][])(
    "responds with status and message for handled errors",
    ([status, message]) => {
      const error = new StatefulError(status, message);

      errorMiddleware(error, req, res as Response, next);

      expect(res.status).toHaveBeenCalledExactlyOnceWith(status);
      expect(res.json).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ message }),
      );
    },
  );
});
