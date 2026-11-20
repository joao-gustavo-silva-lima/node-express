import { compare, genSalt, hash } from "bcrypt";
import jwt from "jsonwebtoken";

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
export function updatedTooRecently(createdAt: Date, updatedAt: Date) {
  return (
    createdAt.getTime() !== updatedAt.getTime() &&
    updatedAt > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  );
}
