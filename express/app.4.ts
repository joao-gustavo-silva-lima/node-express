import express from "express";

interface User {
  name: string;
  age: number;
  role: string;
}

const USERS: { [index: string]: User } = {
  "0": {
    name: "paulo",
    age: 27,
    role: "Full Stack Developer",
  },
  "1": {
    name: "jairo",
    age: 32,
    role: "Back End Developer",
  },
  "2": {
    name: "mario",
    age: 23,
    role: "Front End Developer",
  },
};

const PORT = 5000;
const app = express();

app.use(express.json());

app
  .route("/user/:id")
  .get((req, res) => {
    const { id } = req.params;

    const user = USERS[id];

    if (user === undefined) {
      res.status(404).json({ message: `User '${id}' not found` });
      return;
    }

    res.json(user);
  })
  .put(async (req, res) => {
    const { id } = req.params;

    const user = USERS[id];

    if (user === undefined) {
      res.status(404).json({ message: `User '${id}' not found` });
      return;
    }

    const { name, age, role } = req.body ?? {};

    if (!name || !age || !role) {
      res.status(404).json({ message: `Missing properties` });
      return;
    }

    user.name = name;
    user.age = age;
    user.role = role;

    res.json(user);
  });

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
