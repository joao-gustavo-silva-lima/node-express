import { beforeEach, describe, expect, test, vi } from "vitest";
import { NextFunction, Request, Response } from "express";
import { Query } from "../types/link.types.js";
import { validateQueryMiddleware } from "./validate-query.middleware.js";
import { getThrownError } from "../utils/test.utils.js";
import { StatefulError } from "../utils/stateful-error.utils.js";

const req = {
  query: {} as Query,
} as Request;
const res = {} as Response;
const next = vi.fn() as NextFunction;

beforeEach(() => {
  req.query = {};
});

describe("validate query middleware", () => {
  test.for([
    {},
    {
      title: "Filter Links By This Title",
      category: "Filter Links By this Category",
    },
  ] as Query[])('calls "next()" when req.query is valid', (query) => {
    req.query = query;

    validateQueryMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  test('throws 400 and "next()" is not called when req.query is invalid', () => {
    req.query = {
      invalidQueryKey: "invalid-query-value",
    };

    const error = getThrownError(() =>
      validateQueryMiddleware(req, res, next),
    ) as StatefulError;

    expect(error).toBeInstanceOf(StatefulError);
    expect(error.status).toBe(400);
    expect(error.message).toMatch(/invalid query/i);

    expect(next).not.toHaveBeenCalled();
  });
});
