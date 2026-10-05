import type { AuthUser, User, UserDB } from "../types/User.types.js";
import HttpError from "../utils/HttpError.utils.js";
import { pool } from "../database/database.db.js";
import { DatabaseError } from "pg";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export async function registerUserService(userDTO: User) {
  try {
    const passwordHash = await bcrypt.hash(userDTO.password, 10);

    const query = `
      INSERT INTO users (id, name, email, password, created_at) 
      VALUES ($1, $2, $3, $4, $5);
    `;
    const values = [
      userDTO.id,
      userDTO.name,
      userDTO.email,
      passwordHash,
      userDTO.createdAt,
    ];

    await pool.query(query, values);
  } catch (error: any) {
    if (error instanceof DatabaseError) {
      if (error.code === "23505") {
        throw new HttpError(
          409,
          "USER_ALREADY_EXISTS",
          "A user with this email already exists.",
        );
      }

      if (error.code === "23502") {
        throw new HttpError(
          400,
          "MISSING_REQUIRED_FIELDS",
          "All required user fields must be provided.",
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
        "The email or password is incorrect.",
      );
    }

    if (process.env.JWT_SECRET === undefined) {
      throw new HttpError(
        500,
        "JWT_SECRET_MISSING",
        "The JWT secret is not configured in the environment.",
      );
    }

    return jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
  } catch (error: any) {
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
        `No user was found with id "${id}".`,
      );
    }

    const { password, ...data } = user;

    return data;
  } catch (error) {
    throw error;
  }
}
