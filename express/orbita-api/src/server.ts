import { configDotenv } from "dotenv";
import prisma from "./lib/prisma.js";
import app from "./main.js";
import HttpError from "./common/classes/HttpError.js";

configDotenv({ quiet: true });

async function bootstrap() {
  try {
    const missingEnvVars = [
      "PORT",
      "JWT_SECRET",
      "DATABASE_URL",
      "FRONT_END_URL",
    ].filter((envVar) => process.env[envVar] === undefined);

    if (missingEnvVars.length > 0) {
      throw new HttpError(
        500,
        "ENV_VARS_MISSING",
        `The server bootstrap requires the following environment variables: ${missingEnvVars}`,
      );
    }

    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connection established successfully.");

    app.listen(process.env.PORT!, () =>
      console.log(
        `Server running locally at http://localhost:${process.env.PORT!}`,
      ),
    );
  } catch (error: any) {
    if (error instanceof HttpError) {
      console.error(error.message);
    } else if (typeof error === "object" && "clientVersion" in error) {
      console.error(
        "Prisma client initialization/Database connection establishment failed:\n\n",
        error,
      );
    } else {
      console.error("Bootstrap unknown error:", error);
    }

    console.log("\n\nThe application process is terminated.");
    process.exit(1);
  }
}

bootstrap();
