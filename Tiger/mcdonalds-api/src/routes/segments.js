// src/routes/segments.js
const express = require("express");
const router = express.Router();
const segmentsController = require("../controllers/segments");
const authMiddleware = require("../middleware/auth");

// Get all segments
router.get("/", authMiddleware.verifyToken, segmentsController.getAllSegments);

// Get a single segment by ID
router.get(
  "/:id",
  authMiddleware.verifyToken,
  segmentsController.getSegmentById
);

// Create a new segment
router.post(
  "/",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "Marketer"]),
  segmentsController.createSegment
);

// Update a segment
router.put(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "Marketer"]),
  segmentsController.updateSegment
);

// Delete a segment
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin"]),
  segmentsController.deleteSegment
);

module.exports = router;
