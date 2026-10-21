import { defineConfig } from "@prisma/orm-postgres/config";
import { configDotenv } from "dotenv";
import { definePrismaConfig } from "prisma/config";

configDotenv({ path: "config/.env.development" });

export default definePrismaConfig({
  orm: defineConfig({
    contract: "src/prisma/contract.prisma",
    db: {
      connection: process.env["DATABASE_URL"],
    },
  }),
  skills: {
    check: false,
  },
});
