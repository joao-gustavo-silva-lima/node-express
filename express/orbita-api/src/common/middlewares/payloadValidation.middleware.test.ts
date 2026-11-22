import { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createUserSchema,
  UserInput,
  userSchema,
} from "../../user/User.schema.js";
import payloadValidationMiddleware from "./payloadValidation.middleware.js";

describe("payloadValidationMiddleware", () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
      body: {},
    } as Request;
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    next = vi.fn() as NextFunction;
  });

  it("should return 415 when request Content-Type is not application/json", () => {
    req.headers["content-type"] = "text/plain";

    payloadValidationMiddleware(userSchema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(415);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "INVALID_CONTENT_TYPE",
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 400 when request body validation fails", () => {
    req.headers["content-type"] = "application/json";
    req.body = {
      username: 123,
    };

    payloadValidationMiddleware(userSchema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "INVALID_REQUEST_BODY",
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should assign the parsed data to req.body and call 'next()' when request body is valid", () => {
    const payload = {
      name: "Test Test",
      email: "test@email.com",
      username: "test_username",
      password: "testPassword@123",
    } satisfies UserInput;

    req.headers["content-type"] = "application/json";
    req.body = payload;

    payloadValidationMiddleware(createUserSchema)(req, res, next);

    expect(req.body).toStrictEqual(payload);
    expect(next).toHaveBeenCalledOnce();
  });
});
