import { defineConfig } from "prisma/config";
import { configDotenv } from "dotenv";

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
