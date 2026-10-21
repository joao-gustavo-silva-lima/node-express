import { configDotenv } from "dotenv";
import prisma from "./lib/prisma";
import app from "./main";

configDotenv({ path: "config/.env.development", quiet: true });

async function bootstrap() {
  try {
    const missingEnvVars = ["PORT", "DATABASE_URL"].filter(
      (envVar) => process.env[envVar] === undefined,
    );

    if (missingEnvVars.length > 0) {
      throw (new Error(
        `The server bootstrap requires the following environment variables: ${missingEnvVars}`,
      ).name = "KNOWN_ERROR");
    }

    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connection established successfully.");

    app.listen(process.env.PORT!, () =>
      console.log(
        `Server running locally at http://localhost:${process.env.PORT!}`,
      ),
    );
  } catch (error: any) {
    if (error.name === "KNOW_ERROR") {
      console.error(error);
    } else if (typeof error === "object" && "clientVersion" in error) {
      console.error(
        "Prisma client initialization/Database connection establishment failed.",
      );
    } else {
      console.error("Bootstrap unknown error:", error);
    }

    console.log("The application process is terminated.");
    process.exit(1);
  }
}

bootstrap();
