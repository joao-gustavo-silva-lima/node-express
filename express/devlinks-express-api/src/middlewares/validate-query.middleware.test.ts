import { beforeEach, describe, expect, test, vi } from "vitest";
import { NextFunction, Request, Response } from "express";
import { Query } from "../types/link.types.js";
import { validateQueryMiddleware } from "./validate-query.middleware.js";

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
});
