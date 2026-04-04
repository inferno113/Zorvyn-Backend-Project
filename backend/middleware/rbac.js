const allowedRoles = ["viewer", "analyst", "admin"];

const attachRoleFromHeader = (req, res, next) => {
  const headerRole = req.headers["x-user-role"];
  const headerUserId = req.headers["x-user-id"];

  if (!headerRole) {
    req.userRole = "viewer";
    return next();
  }

  const normalizedRole = String(headerRole).toLowerCase();

  if (!allowedRoles.includes(normalizedRole)) {
    return res.status(400).json({
      error: "Invalid role header. Use viewer, analyst, or admin",
    });
  }

  req.userRole = normalizedRole;
  req.userId = headerUserId ? String(headerUserId) : null;
  next();
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }

    next();
  };
};

module.exports = { attachRoleFromHeader, authorizeRoles };
