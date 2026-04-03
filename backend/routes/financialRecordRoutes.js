const express = require("express");
const {
  createRecord,
  getRecords,
  updateRecord,
  deleteRecord,
} = require("../controllers/financialRecordController");
const { authorizeRoles } = require("../middleware/rbac");

const router = express.Router();

router.post("/", authorizeRoles("admin"), createRecord);
router.get("/", authorizeRoles("viewer", "analyst", "admin"), getRecords);
router.put("/:id", authorizeRoles("admin"), updateRecord);
router.delete("/:id", authorizeRoles("admin"), deleteRecord);

module.exports = router;
