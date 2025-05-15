// src/middleware/auth.js
const { auth } = require("../config/firebase");

// Verify Firebase ID token
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid authorization token",
      },
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || "Viewer",
    };
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or expired authorization token",
      },
    });
  }
};

// Check if user has required role
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message: "Insufficient permissions",
      },
    });
  };
};

module.exports = {
  verifyToken,
  checkRole,
};
