import express from "express";
import path from "node:path";

const PORT = 5000;

const app = express();

app.use("/static", express.static(path.join(__dirname, "static-files")));

app.listen(PORT, () =>
  console.log(`Server running locally at http://localhost:${PORT}`),
);
