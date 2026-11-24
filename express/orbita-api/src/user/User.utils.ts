import { compare, genSalt, hash } from "bcrypt";
import type { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";

const isProduction = process.env.NODE_ENV === "production";
const baseCookiesOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  partitioned: isProduction,
  sameSite: isProduction ? "none" : "lax",
};

const salt = await genSalt(10);

export function hashPassword(plain: string) {
  return hash(plain, salt);
}

export function comparePasswords(plain: string, hash: string) {
  return compare(plain, hash);
}
export function generateAuthenticationToken(username: string) {
  return jwt.sign({ authUsername: username }, process.env.JWT_SECRET!, {
    expiresIn: "1Day",
  });
}

export function assignAuthenticationCookie(res: Response, token: string) {
  res.cookie("orbitaAuthToken", token, {
    ...baseCookiesOptions,
    maxAge: 1000 * 60 * 60 * 24,
  });
}

export function clearAuthenticationCookie(res: Response) {
  res.clearCookie("orbitaAuthToken", baseCookiesOptions);
}
export function updatedTooRecently(createdAt: Date, updatedAt: Date) {
  return (
    createdAt.getTime() !== updatedAt.getTime() &&
    updatedAt > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  );
}
