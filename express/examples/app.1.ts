import express from "express";

const PORT = 5000;

const app = express();

app.use((req, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      message: `Server listened to the request at path '${req.path}' sent within method '${req.method}'`,
    }),
  );
});

app.listen(PORT, () =>
  console.log(`Server running locally at http://localhost:${PORT}`),
);
