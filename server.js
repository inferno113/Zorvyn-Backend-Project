const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./backend/config/db");
const userRoutes = require("./backend/routes/userRoutes");
const financialRecordRoutes = require("./backend/routes/financialRecordRoutes");
const dashboardRoutes = require("./backend/routes/dashboardRoutes");
const { attachRoleFromHeader } = require("./backend/middleware/rbac");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(attachRoleFromHeader);
app.use("/api/users", userRoutes);
app.use("/api/records", financialRecordRoutes);
app.use("/api/dashboard", dashboardRoutes);

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
