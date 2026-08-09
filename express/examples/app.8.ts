import express, { NextFunction, Request, Response } from "express";
import ejs from "ejs";

interface User {
  name: string;
  age: number;
  role: string;
}

const dataBase = new Map<number, User>();

const PORT = 5000;

const app = express();

app.set("view engine", "ejs");

app.use(express.json());

app.post(
  "/user",
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) {
      res.status(400);
      throw new Error("Missing user's data in request body.");
    }

    //Should also validate payload as User object after json parsing

    next();
  },
  (req: Request, res: Response, next: NextFunction) => {
    const userData: User = req.body;

    dataBase.set(dataBase.size, userData);

    res.json({ message: "User created successfully", user: userData });
  },
  (err: Error, req: Request, res: Response, next: NextFunction) => {
    res.json({ message: err.message });
  },
);

app.get("/user/:id", (req, res) => {
  const { id } = req.params;

  if (!/^-?\d+$/.test(id)) {
    res.status(404).json({ message: `ID is not valid` });
    return;
  }

  const user = dataBase.get(Number(id));

  if (user === undefined) {
    res.status(404).json({ message: `There are no users for ID '${id}'` });
    return;
  }

  res.render("view.1.ejs", { user: user });
});

app.listen(PORT, () =>
  console.log(`Server running locally at http://localhost:${PORT}`),
);
