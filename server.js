const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./backend/config/db");
const userRoutes = require("./backend/routes/userRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ message: "API is running" });
});

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
