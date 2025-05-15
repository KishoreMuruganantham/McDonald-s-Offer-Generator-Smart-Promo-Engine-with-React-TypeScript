// src/routes/offers.js
const express = require("express");
const router = express.Router();
const offersController = require("../controllers/offers");
const authMiddleware = require("../middleware/auth");

// Get all offers
router.get("/", authMiddleware.verifyToken, offersController.getAllOffers);

// Get a single offer by ID
router.get("/:id", authMiddleware.verifyToken, offersController.getOfferById);

// Create a new offer
router.post(
  "/",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "Marketer"]),
  offersController.createOffer
);

// Update an offer
router.put(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "Marketer"]),
  offersController.updateOffer
);

// Delete an offer
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin"]),
  offersController.deleteOffer
);

// Check for conflicting offers
router.post(
  "/check-conflicts",
  authMiddleware.verifyToken,
  offersController.checkOfferConflicts
);

module.exports = router;
