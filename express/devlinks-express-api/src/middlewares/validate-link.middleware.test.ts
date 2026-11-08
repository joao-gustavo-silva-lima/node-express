import { beforeEach, describe, expect, test, vi } from "vitest";
import { ProtoLink } from "../types/link.types.js";
import { NextFunction, Request, Response } from "express";
import { validateLinkMiddleware } from "./validate-link.middleware.js";
import { StatefulError } from "../utils/stateful-error.utils.js";
import { getThrownError } from "../utils/test.utils.js";

const req = {} as Request;
const res = {} as Response;
const next = vi.fn() as NextFunction;

beforeEach(() => {
  req.headers = {
    "content-type": "application/json",
  };
  req.body = {
    title: "Google",
    url: "https://www.google.com",
    category: "search",
    tags: ["search", "web"],
  } satisfies ProtoLink;
  vi.clearAllMocks();
});

describe("validate link middleware", () => {
  test('calls "next()" for valid link payload', () => {
    validateLinkMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  test('throws a 400 error and "next()" is not called for invalid link payload', () => {
    req.body = {
      url: "not-a-url",
    };

    const error = getThrownError(() =>
      validateLinkMiddleware(req, res, next),
    ) as StatefulError;

    expect(error).toBeInstanceOf(StatefulError);
    expect(error.status).toBe(400);
    expect(error.message).toMatch(/invalidly formatted/i);
    expect(next).not.toHaveBeenCalled();
  });

  test.for([undefined, "text/plain", "image/png"])(
    'throws a 400 error and "next()" is not called when content-type header is "%s" instead of "application/json"',
    (contentType) => {
      req.headers = {
        "content-type": contentType,
      };

      const error = getThrownError(() =>
        validateLinkMiddleware(req, res, next),
      ) as StatefulError;

      expect(error).toBeInstanceOf(StatefulError);
      expect(error.status).toBe(400);
      expect(error.message).toMatch(/invalid content-type/i);
      expect(next).not.toHaveBeenCalled();
    },
  );
});
