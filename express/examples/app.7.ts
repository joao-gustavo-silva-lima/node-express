import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";

const PORT = 5000;

const app = express();

app.use((req, res, next) => {
  req.requestTime = new Date().toDateString();

  const requestTime = performance.now();

  res.on("finish", () => {
    const responseTime = performance.now() - requestTime;

    console.log(
      `\n[${req.requestTime}] ${req.method} ${req.path}  ${req.protocol} => ${req.protocol} ${res.statusCode} ${res.statusMessage} (${responseTime.toFixed(2)} ms)`,
    );
  });

  next();
});

app.use(
  (req: Request, res: Response, next: NextFunction) => {
    if (Math.random() >= 0.5) {
      throw new Error("Oops... An error ocurred!");
    }

    next();
  },
  (err: Error, req: Request, res: Response, next: NextFunction) => {
    res.status(500).json({
      message: "Something bad happened in the server. Try again later.",
    });

    res.on("finish", () => console.log(`\n\t${err.message}`));
  },
);

app.get("/", (req, res) => {
  res.send("Welcome to Home Page");
});

app.listen(PORT, () =>
  console.log(`Server running locally at http://localhost:${PORT}`),
);
