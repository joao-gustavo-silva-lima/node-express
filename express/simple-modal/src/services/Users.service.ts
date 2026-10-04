import type { AuthUser, User, UserDB } from "../types/User.types.js";
import HttpError from "../utils/HttpError.utils.js";
import { pool } from "../database/database.db.js";
import { DatabaseError } from "pg";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export async function registerUserService(userDTO: User) {
  try {
    const query = `
      INSERT INTO users (id, name, email, password, created_at) 
      VALUES ($1,$2,$3,$4,$5)
    `;
    const passwordHash = await bcrypt.hash(userDTO.password, 10);

    await pool.query(query, [
      userDTO.id,
      userDTO.name,
      userDTO.email,
      passwordHash,
      userDTO.createdAt,
    ]);
  } catch (error: unknown) {
    if (error instanceof DatabaseError) {
      if (error.code === "23505") {
        throw new HttpError(
          409,
          "REGISTER_DATA_CONFLICT",
          "The user email is already in use.",
        );
      }

      if (error.code === "23502") {
        throw new HttpError(
          400,
          "MISSING_REGISTER_DATA",
          "No enough user data was provided to succeed the registration.",
        );
      }
    }

    throw error;
  }
}

export async function loginUserService(authUserDTO: AuthUser) {
  try {
    const query = `
      SELECT * FROM users
      WHERE email = $1;
    `;
    const result = await pool.query(query, [authUserDTO.email]);

    const user: UserDB | undefined = result.rows[0];
    const isUnauthorized =
      user === undefined ||
      !(await bcrypt.compare(authUserDTO.password, user.password));

    if (isUnauthorized) {
      throw new HttpError(
        401,
        "INVALID_CREDENTIALS",
        "The credentials could not authenticate.",
      );
    }

    if (process.env.JWT_SECRET === undefined) {
      throw new HttpError(
        505,
        "NO_JWT_SECRECT_PROVIDED",
        "Json Web Token secret was not provided by the host.",
      );
    }

    return jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
  } catch (error) {
    throw error;
  }
}

export async function fetchByIdUserService(id: string) {
  try {
    const query = `
      SELECT *
      FROM users
      WHERE id = $1;
    `;
    const result = await pool.query(query, [id]);
    const user: UserDB | undefined = result.rows[0];

    if (user === undefined) {
      throw new HttpError(
        404,
        "USER_NOT_FOUND",
        `A user with id "${id}" was not found.`,
      );
    }

    const { password, ...data } = user;

    return data;
  } catch (error) {
    throw error;
  }
}
