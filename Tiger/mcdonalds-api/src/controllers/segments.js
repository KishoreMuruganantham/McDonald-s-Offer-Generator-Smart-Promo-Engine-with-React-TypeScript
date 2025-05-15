// src/controllers/segments.js
const { db } = require("../config/firebase");

// Helper function to convert Firebase Timestamp to Date
const fromFirebaseTimestamp = (timestamp) => timestamp.toDate();

// Get all segments
const getAllSegments = async (req, res, next) => {
  try {
    const segmentsSnapshot = await db.collection("segments").get();
    const segments = [];

    segmentsSnapshot.forEach((doc) => {
      segments.push({
        ...doc.data(),
        id: doc.id,
      });
    });

    return res.status(200).json({ segments });
  } catch (error) {
    console.error("Error getting segments:", error);
    next(error);
  }
};

// Get segment by ID
const getSegmentById = async (req, res, next) => {
  try {
    const segmentId = req.params.id;
    const segmentDoc = await db.collection("segments").doc(segmentId).get();

    if (!segmentDoc.exists) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Segment not found",
        },
      });
    }

    const segment = {
      ...segmentDoc.data(),
      id: segmentDoc.id,
    };

    return res.status(200).json({ segment });
  } catch (error) {
    console.error(`Error getting segment by ID (${req.params.id}):`, error);
    next(error);
  }
};

// Create a new segment
const createSegment = async (req, res, next) => {
  try {
    const { body } = req;

    // Validate required fields
    if (!body.name || !body.criteria) {
      return res.status(400).json({
        error: {
          code: "INVALID_ARGUMENT",
          message: "Missing required fields",
        },
      });
    }

    const segmentData = {
      ...body,
      createdBy: req.user.uid,
      createdAt: new Date(),
    };

    const newSegmentRef = await db.collection("segments").add(segmentData);

    return res.status(201).json({
      segment: {
        id: newSegmentRef.id,
        ...segmentData,
      },
    });
  } catch (error) {
    console.error("Error creating segment:", error);
    next(error);
  }
};

// Update a segment
const updateSegment = async (req, res, next) => {
  try {
    const segmentId = req.params.id;
    const { body } = req;

    // Verify segment exists
    const segmentDoc = await db.collection("segments").doc(segmentId).get();
    if (!segmentDoc.exists) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Segment not found",
        },
      });
    }

    const updates = { ...body, updatedAt: new Date() };
    await db.collection("segments").doc(segmentId).update(updates);

    // Get the updated document
    const updatedSegmentDoc = await db
      .collection("segments")
      .doc(segmentId)
      .get();
    const segment = {
      ...updatedSegmentDoc.data(),
      id: segmentId,
    };

    return res.status(200).json({ segment });
  } catch (error) {
    console.error(`Error updating segment (${req.params.id}):`, error);
    next(error);
  }
};

// Delete a segment
const deleteSegment = async (req, res, next) => {
  try {
    const segmentId = req.params.id;

    // Verify segment exists
    const segmentDoc = await db.collection("segments").doc(segmentId).get();
    if (!segmentDoc.exists) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Segment not found",
        },
      });
    }

    // Check if segment is used in any offers
    const offersWithSegment = await db
      .collection("offers")
      .where("segments", "array-contains", segmentId)
      .get();

    if (!offersWithSegment.empty) {
      return res.status(400).json({
        error: {
          code: "FAILED_PRECONDITION",
          message: "Cannot delete segment as it is used in active offers",
        },
      });
    }

    // Delete the segment
    await db.collection("segments").doc(segmentId).delete();

    return res.status(200).json({
      success: true,
      message: "Segment deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting segment (${req.params.id}):`, error);
    next(error);
  }
};

module.exports = {
  getAllSegments,
  getSegmentById,
  createSegment,
  updateSegment,
  deleteSegment,
};
