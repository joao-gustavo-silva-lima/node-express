import express from "express";
import path from "node:path";

const PORT = 5000;
const app = express();

app.get("/user/:id{/:property}", (req, res) => {
  res.send(req.params);
});

app.get("/files/*path", (req, res) => {
  res.send(req.params);
});

app.get(/\/.*fly/, (req, res) => {
  res.send("Certainly this path ends with 'fly'");
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
