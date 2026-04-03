const express = require("express");
const {
	createUser,
	getUsers,
	updateUser,
	deleteUser,
} = require("../controllers/userController");
const { authorizeRoles } = require("../middleware/rbac");

const router = express.Router();

router.post("/", authorizeRoles("admin"), createUser);
router.get("/", authorizeRoles("admin"), getUsers);
router.put("/:id", authorizeRoles("admin"), updateUser);
router.delete("/:id", authorizeRoles("admin"), deleteUser);

module.exports = router;
