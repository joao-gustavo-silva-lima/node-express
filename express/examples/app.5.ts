import express from "express";

const PORT = 5000;
const app = express();

const myMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  console.log("Hey, I'm a middleware and I've been executed!");
  next();
};

const executeMiddleware = false;

app.get(
  /.*/,
  (req, res, next) => {
    if (executeMiddleware) {
      console.log("Middleware might be executed.");
      next();
    } else {
      console.log("No middlewares ahead.");
      next("route");
    }
  },
  myMiddleware,
  (req, res) => {
    console.log('This is the end of the road... I mean "[...] of the route".');
  },
);

app.listen(PORT);
