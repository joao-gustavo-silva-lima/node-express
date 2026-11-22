import { configDotenv } from "dotenv";
import { defineConfig } from "prisma/config";

const envFile =
  ".env." + (process.env.NODE_ENV === "test" ? "test" : "development");

configDotenv({
  quiet: true,
  path: `config/${envFile}`,
});

export default defineConfig({
  schema: "src/prisma/schema.prisma",
  migrations: {
    path: "src/prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"]!,
  },
});
