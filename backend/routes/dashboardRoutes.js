const express = require("express");
const { getDashboardSummary } = require("../controllers/dashboardController");
const { authorizeRoles } = require("../middleware/rbac");

const router = express.Router();

router.get("/summary", authorizeRoles("analyst", "admin"), getDashboardSummary);

module.exports = router;
