import express from "express";

const PORT = 5000;

const app = express();
/*const loggingRouter = express.Router();

loggingRouter.use((req, res, next) => {
  const startingTime = performance.now();

  res.on("finish", () => {
    const responseTime = (performance.now() - startingTime).toFixed(2);

    console.log(req.method, req.url, `${responseTime} ms`);
  });

  next();
});

app.use(loggingRouter);*/

app.use((req, res, next) => {
  const startingTime = performance.now();

  res.on("finish", () => {
    const responseTime = (performance.now() - startingTime).toFixed(2);

    console.log(req.method, req.url, `${responseTime} ms`);
  });

  next();
});

app.use((req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () =>
  console.log(`Server running locally at http://localhost:${PORT}`),
);
