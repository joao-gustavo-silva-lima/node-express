import { app } from "./app.js";

const PORT = process.env.PORT || 9876;

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`),
);
