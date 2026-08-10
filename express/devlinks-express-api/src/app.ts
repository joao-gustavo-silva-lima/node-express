import express from "express";

const PORT = 5000;

export const app = express();

app.listen(PORT, () =>
  console.log(`Server running locally at http://localhost:${PORT}`),
);
