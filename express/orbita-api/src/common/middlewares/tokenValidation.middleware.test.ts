import { beforeEach, describe, expect, it, vi } from "vitest";
import tokenValidationMiddleware from "./tokenValidation.middleware.js";
import { NextFunction, Request, Response } from "express";
import { generateAuthenticationToken } from "../../user/User.utils.js";
import { configDotenv } from "dotenv";

configDotenv({ path: "./config/.env.development", quiet: true });

describe("tokenValidationMiddleware", () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {} as Request;
    res = {} as Response;
    next = vi.fn() as NextFunction;
  });

  it("should assign req.authUsername and call 'next()' when authentication token is successfully verified.", () => {
    req.cookies = {
      orbitaAuthToken: generateAuthenticationToken("test"),
    };

    tokenValidationMiddleware(req, res, next);

    expect((req as any).authUsername).toBe("test");
    expect(next).toHaveBeenCalledOnce();
  });

  it("should throw 401 when authentication token is undefined", () => {
    expect(() => tokenValidationMiddleware(req, res, next)).toThrow(
      expect.objectContaining({
        status: 401,
        code: "AUTH_TOKEN_REQUIRED",
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should throw 403 when authentication token verification fails", () => {
    req.cookies = {
      orbitaAuthToken: "iNvAlIdToKeN",
    };

    expect(() => tokenValidationMiddleware(req, res, next)).toThrow(
      expect.objectContaining({
        status: 403,
        code: "INVALID_AUTH_TOKEN",
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });
});
