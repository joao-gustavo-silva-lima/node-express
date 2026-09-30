import { Pool } from "pg";

export const pool = new Pool({
  port: 5432,
  user: "dev_user",
  host: "localhost",
  database: "dev_db",
  password: "dev_password",
});
