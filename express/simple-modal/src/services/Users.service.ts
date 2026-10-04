import { DatabaseError } from "pg";
import bcrypt from "bcrypt";
import { pool } from "../database/database.db.js";
import type { AuthUser, User, UserDB } from "../types/User.types.js";
import HttpError from "../utils/HttpError.utils.js";

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

export async function authenticateUserService(authUserDTO: AuthUser) {
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
  } catch (error) {
    throw error;
  }
}
