import { DatabaseError } from "pg";
import bcrypt from "bcrypt";
import { pool } from "../database/database.db.js";
import type { AuthUser, User, UserDB } from "../types/User.types.js";
import HttpError from "../utils/HttpError.utils.js";

export async function registerUserService(userDTO: User) {
  try {
    const query = `
      INSERT INTO users (id, name, email, created_at, password) 
      VALUES ($1,$2,$3,$4,$5)
    `;
    const passwordHash = await bcrypt.hash(userDTO.password, 10);

    await pool.query(query, [
      userDTO.id,
      userDTO.name,
      userDTO.email,
      userDTO.createdAt,
      passwordHash,
    ]);
  } catch (error: unknown) {
    if (error instanceof DatabaseError) {
      //Handle Database Errors Here
      console.log(error);
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
        "The credentials don't match an existent user record.",
      );
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      //Handle Database Errors Here
      console.log(error);
    }

    throw error;
  }
}
