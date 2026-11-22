import { configDotenv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client.js";

const envFile =
  ".env." + (process.env.NODE_ENV === "test" ? "test" : "development");

configDotenv({
  quiet: true,
  path: `config/${envFile}`,
});

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export default prisma;
