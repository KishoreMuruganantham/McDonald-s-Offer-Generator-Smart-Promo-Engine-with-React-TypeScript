// src/routes/analytics.js
const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics");
const authMiddleware = require("../middleware/auth");

// Get analytics for all offers
router.get(
  "/",
  authMiddleware.verifyToken,
  analyticsController.getAllOffersAnalytics
);

// Get analytics for a specific offer
router.get(
  "/offer/:id",
  authMiddleware.verifyToken,
  analyticsController.getOfferAnalytics
);

// Update analytics for an offer
router.post(
  "/offer/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "Marketer"]),
  analyticsController.updateOfferAnalytics
);

module.exports = router;
