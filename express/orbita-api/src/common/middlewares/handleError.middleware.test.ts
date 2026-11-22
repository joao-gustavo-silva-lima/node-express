import { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HttpError from "../classes/HttpError.js";
import handleErrorMiddleware from "./handleError.middleware.js";

describe("handleErrorMiddleware", () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {} as Request;
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      on: vi.fn(),
    } as unknown as Response;
    next = vi.fn() as NextFunction;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should return the status, code and message from HttpError", () => {
    const error = new HttpError(404, "USER_NOT_FOUND", "User not found.");

    handleErrorMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      code: error.code,
      message: error.message,
    });
  });

  it("should return 400 when error is a SyntaxError with body property", () => {
    const error = Object.assign(new SyntaxError(), { body: "invalid json" });

    handleErrorMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "INVALID_JSON",
      }),
    );
    expect(res.on).not.toHaveBeenCalled();
  });

  it("should return 500 when error is not an HttpError or a SyntaxError with body property", () => {
    const error = new Error("Unexpected error");

    handleErrorMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "INTERNAL_SERVER_ERROR",
      }),
    );
  });

  it.for([500, 503, 508])(
    "should register an error logging callback when HttpError status is 500 or higher, like %s",
    (status) => {
      const error = new HttpError(
        status,
        "SERVER_SIDE_ERROR",
        "Server Side Error.",
      );

      handleErrorMiddleware(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(status);
      expect(res.on).toHaveBeenCalledExactlyOnceWith(
        "finish",
        expect.any(Function),
      );
    },
  );
});
