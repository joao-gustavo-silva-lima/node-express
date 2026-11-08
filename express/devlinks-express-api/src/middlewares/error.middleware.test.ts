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

  test.for([
    ["Database connection failed"],
    ["Internal Unhandled Error", { status: 500 }],
    ["HINT: Sensitive Information", { status: 21505 }],
  ] as [string, Record<string, unknown>][])(
    "responds with a default 500 Internal Server Error and logs error for unhandled errors",
    ([message, errorProps]) => {
      const error = {
        ...new Error(message),
        ...(errorProps ?? {}),
      };

      errorMiddleware(error as StatefulError, req, res as Response, next);

      expect(res.status).toHaveBeenCalledExactlyOnceWith(500);
      expect(res.json).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          message: expect.stringMatching(/internal server error/i),
        }),
      );
      expect(res.on).toHaveBeenCalledExactlyOnceWith(
        "finish",
        expect.any(Function),
      );
    },
  );

  test("responds with 400 for SyntaxError", () => {
    const syntaxError = new SyntaxError();

    errorMiddleware(syntaxError, req, res as Response, next);

    expect(res.status).toHaveBeenCalledExactlyOnceWith(400);
    expect(res.json).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        message: expect.stringMatching(/invalid JSON/i),
      }),
    );
  });
});
