import { configDotenv } from "dotenv";
import { defineConfig } from "prisma/config";

configDotenv({ quiet: true, path: "config/.env.development" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"]!,
  },
});
