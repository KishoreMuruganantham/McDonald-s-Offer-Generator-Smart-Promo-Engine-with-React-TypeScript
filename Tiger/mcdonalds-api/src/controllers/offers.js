// src/controllers/offers.js
const { db } = require("../config/firebase");

// Helper functions to convert between Firebase Timestamps and JS Dates
const fromFirebaseTimestamp = (timestamp) => timestamp.toDate();
const toFirebaseTimestamp = (date) => new Date(date);

// Get all offers
const getAllOffers = async (req, res, next) => {
  try {
    const offersSnapshot = await db.collection("offers").get();
    const offers = [];

    offersSnapshot.forEach((doc) => {
      const data = doc.data();
      offers.push({
        ...data,
        id: doc.id,
        startDate: data.startDate
          ? fromFirebaseTimestamp(data.startDate)
          : null,
        endDate: data.endDate ? fromFirebaseTimestamp(data.endDate) : null,
        createdAt: data.createdAt
          ? fromFirebaseTimestamp(data.createdAt)
          : null,
        updatedAt: data.updatedAt
          ? fromFirebaseTimestamp(data.updatedAt)
          : null,
      });
    });

    return res.status(200).json({ offers });
  } catch (error) {
    console.error("Error getting offers:", error);
    next(error);
  }
};

// Get offer by ID
const getOfferById = async (req, res, next) => {
  try {
    const offerId = req.params.id;
    const offerDoc = await db.collection("offers").doc(offerId).get();

    if (!offerDoc.exists) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Offer not found",
        },
      });
    }

    const data = offerDoc.data();
    const offer = {
      ...data,
      id: offerDoc.id,
      startDate: data.startDate ? fromFirebaseTimestamp(data.startDate) : null,
      endDate: data.endDate ? fromFirebaseTimestamp(data.endDate) : null,
      createdAt: data.createdAt ? fromFirebaseTimestamp(data.createdAt) : null,
      updatedAt: data.updatedAt ? fromFirebaseTimestamp(data.updatedAt) : null,
    };

    return res.status(200).json({ offer });
  } catch (error) {
    console.error(`Error getting offer by ID (${req.params.id}):`, error);
    next(error);
  }
};

// Create a new offer
const createOffer = async (req, res, next) => {
  try {
    const { body } = req;

    // Validate required fields
    if (
      !body.name ||
      !body.type ||
      !body.startDate ||
      !body.endDate ||
      !body.targetAudience
    ) {
      return res.status(400).json({
        error: {
          code: "INVALID_ARGUMENT",
          message: "Missing required fields",
        },
      });
    }

    const offerData = {
      ...body,
      startDate: toFirebaseTimestamp(body.startDate),
      endDate: toFirebaseTimestamp(body.endDate),
      createdBy: req.user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: body.status || "Inactive",
    };

    const newOfferRef = await db.collection("offers").add(offerData);

    return res.status(201).json({
      offer: {
        id: newOfferRef.id,
        ...offerData,
        startDate: body.startDate,
        endDate: body.endDate,
      },
    });
  } catch (error) {
    console.error("Error creating offer:", error);
    next(error);
  }
};

// Update an offer
const updateOffer = async (req, res, next) => {
  try {
    const offerId = req.params.id;
    const { body } = req;

    // Verify offer exists
    const offerDoc = await db.collection("offers").doc(offerId).get();
    if (!offerDoc.exists) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Offer not found",
        },
      });
    }

    // Process dates if they exist
    const updates = { ...body, updatedAt: new Date() };
    if (updates.startDate) {
      updates.startDate = toFirebaseTimestamp(updates.startDate);
    }
    if (updates.endDate) {
      updates.endDate = toFirebaseTimestamp(updates.endDate);
    }

    await db.collection("offers").doc(offerId).update(updates);

    // Get the updated document
    const updatedOfferDoc = await db.collection("offers").doc(offerId).get();
    const updatedData = updatedOfferDoc.data();

    const offer = {
      ...updatedData,
      id: offerId,
      startDate: updatedData.startDate
        ? fromFirebaseTimestamp(updatedData.startDate)
        : null,
      endDate: updatedData.endDate
        ? fromFirebaseTimestamp(updatedData.endDate)
        : null,
      createdAt: updatedData.createdAt
        ? fromFirebaseTimestamp(updatedData.createdAt)
        : null,
      updatedAt: updatedData.updatedAt
        ? fromFirebaseTimestamp(updatedData.updatedAt)
        : null,
    };

    return res.status(200).json({ offer });
  } catch (error) {
    console.error(`Error updating offer (${req.params.id}):`, error);
    next(error);
  }
};

// Delete an offer
const deleteOffer = async (req, res, next) => {
  try {
    const offerId = req.params.id;

    // Verify offer exists
    const offerDoc = await db.collection("offers").doc(offerId).get();
    if (!offerDoc.exists) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Offer not found",
        },
      });
    }

    // Check if there are analytics associated with this offer
    const analyticsQuery = await db
      .collection("analytics")
      .where("offerId", "==", offerId)
      .get();

    if (!analyticsQuery.empty) {
      // Delete associated analytics
      const batch = db.batch();
      analyticsQuery.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    // Delete the offer
    await db.collection("offers").doc(offerId).delete();

    return res.status(200).json({
      success: true,
      message: "Offer deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting offer (${req.params.id}):`, error);
    next(error);
  }
};

// Check for conflicting offers
const checkOfferConflicts = async (req, res, next) => {
  try {
    const { body: offer } = req;

    // Basic validation
    if (!offer.startDate || !offer.endDate || !offer.products) {
      return res.status(400).json({
        error: {
          code: "INVALID_ARGUMENT",
          message: "Missing required fields for conflict check",
        },
      });
    }

    const startDate = toFirebaseTimestamp(offer.startDate);
    const endDate = toFirebaseTimestamp(offer.endDate);

    // Query offers that might conflict
    const offersSnapshot = await db.collection("offers").get();

    const conflicts = [];

    offersSnapshot.forEach((doc) => {
      // Skip the same offer when checking for conflicts (for updates)
      if (offer.id && doc.id === offer.id) {
        return;
      }

      const data = doc.data();

      // Check date overlap
      const docStartDate = data.startDate.toDate();
      const docEndDate = data.endDate.toDate();

      const dateOverlap = !(
        docEndDate < new Date(offer.startDate) ||
        docStartDate > new Date(offer.endDate)
      );

      if (!dateOverlap) {
        return;
      }

      // Check product overlap
      const productOverlap = data.products.some((product) =>
        offer.products.includes(product)
      );

      // Check segment overlap for personalized offers
      let segmentOverlap = false;
      if (
        offer.targetAudience === "Personalized" &&
        data.targetAudience === "Personalized"
      ) {
        if (offer.segments && data.segments) {
          segmentOverlap = data.segments.some((segment) =>
            offer.segments.includes(segment)
          );
        }
      }

      if (productOverlap || segmentOverlap) {
        conflicts.push({
          ...data,
          id: doc.id,
          startDate: fromFirebaseTimestamp(data.startDate),
          endDate: fromFirebaseTimestamp(data.endDate),
          createdAt: data.createdAt
            ? fromFirebaseTimestamp(data.createdAt)
            : null,
          updatedAt: data.updatedAt
            ? fromFirebaseTimestamp(data.updatedAt)
            : null,
        });
      }
    });

    return res.status(200).json({ conflicts });
  } catch (error) {
    console.error("Error checking for offer conflicts:", error);
    next(error);
  }
};

module.exports = {
  getAllOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  checkOfferConflicts,
};
