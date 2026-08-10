import express from "express";

const PORT = 5000;
const app = express();

app.use((req, res) => {
  if (Math.random() >= 0.5) {
    throw new Error("Something is wrong");
    //Intend to use Express's Built-in Error Handler Middleware
  }

  res.send("Hello World!");
});

app.listen(PORT, () =>
  console.log(`Server running locally at http://localhost:${PORT}`),
);
