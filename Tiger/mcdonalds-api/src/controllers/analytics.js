// src/controllers/analytics.js
const { db } = require("../config/firebase");

// Helper functions to convert between Firebase Timestamps and JS Dates
const fromFirebaseTimestamp = (timestamp) => timestamp.toDate();
const toFirebaseTimestamp = (date) => new Date(date);

// Get analytics for all offers
const getAllOffersAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    let analyticsRef = db.collection("analytics");

    // No need to query by date range in this backend
    // as we'll process the data after retrieval

    const analyticsSnapshot = await analyticsRef.get();
    const analyticsData = [];

    analyticsSnapshot.forEach((doc) => {
      const data = doc.data();

      // Filter timeframes based on date range if provided
      let timeFrames = data.timeFrames || [];
      if (startDate && endDate) {
        timeFrames = timeFrames.filter((tf) => {
          const date = fromFirebaseTimestamp(tf.date);
          return date >= new Date(startDate) && date <= new Date(endDate);
        });
      }

      // Convert timestamps
      timeFrames = timeFrames.map((tf) => ({
        ...tf,
        date: fromFirebaseTimestamp(tf.date),
      }));

      analyticsData.push({
        ...data,
        id: doc.id,
        timeFrames,
      });
    });

    return res.status(200).json({ analytics: analyticsData });
  } catch (error) {
    console.error("Error getting analytics:", error);
    next(error);
  }
};

// Get analytics for a specific offer
const getOfferAnalytics = async (req, res, next) => {
  try {
    const offerId = req.params.id;
    const { startDate, endDate } = req.query;

    // Find analytics document for this offer
    const analyticsQuery = await db
      .collection("analytics")
      .where("offerId", "==", offerId)
      .get();

    if (analyticsQuery.empty) {
      // Return empty analytics if none found
      return res.status(200).json({
        analytics: {
          offerId,
          views: 0,
          activations: 0,
          conversions: 0,
          revenue: 0,
          timeFrames: [],
        },
      });
    }

    const data = analyticsQuery.docs[0].data();

    // Filter timeframes based on date range if provided
    let timeFrames = data.timeFrames || [];
    if (startDate && endDate) {
      timeFrames = timeFrames.filter((tf) => {
        const date = fromFirebaseTimestamp(tf.date);
        return date >= new Date(startDate) && date <= new Date(endDate);
      });
    }

    // Convert timestamps
    timeFrames = timeFrames.map((tf) => ({
      ...tf,
      date: fromFirebaseTimestamp(tf.date),
    }));

    const analytics = {
      ...data,
      id: analyticsQuery.docs[0].id,
      timeFrames,
    };

    return res.status(200).json({ analytics });
  } catch (error) {
    console.error(`Error getting offer analytics (${req.params.id}):`, error);
    next(error);
  }
};

// Update or create analytics for an offer
const updateOfferAnalytics = async (req, res, next) => {
  try {
    const offerId = req.params.id;
    const { body } = req;

    // Verify the offer exists
    const offerDoc = await db.collection("offers").doc(offerId).get();
    if (!offerDoc.exists) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Offer not found",
        },
      });
    }

    // Find existing analytics document for this offer
    const analyticsQuery = await db
      .collection("analytics")
      .where("offerId", "==", offerId)
      .get();

    let analyticsRef;

    if (analyticsQuery.empty) {
      // Create new analytics document
      analyticsRef = db.collection("analytics").doc();

      await analyticsRef.set({
        offerId,
        views: body.views || 0,
        activations: body.activations || 0,
        conversions: body.conversions || 0,
        revenue: body.revenue || 0,
        timeFrames: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      // Update existing document
      analyticsRef = analyticsQuery.docs[0].ref;

      // Only update the fields that are provided
      const updates = {};
      if (body.views !== undefined) updates.views = body.views;
      if (body.activations !== undefined)
        updates.activations = body.activations;
      if (body.conversions !== undefined)
        updates.conversions = body.conversions;
      if (body.revenue !== undefined) updates.revenue = body.revenue;
      updates.updatedAt = new Date();

      await analyticsRef.update(updates);
    }

    // Add new timeframe if provided
    if (body.timeFrame) {
      const timeFrame = {
        ...body.timeFrame,
        date: new Date(body.timeFrame.date),
      };

      await analyticsRef.update({
        timeFrames: admin.firestore.FieldValue.arrayUnion(timeFrame),
      });
    }

    // Get the updated document
    const updatedDoc = await analyticsRef.get();
    const updatedData = updatedDoc.data();

    // Convert timestamps in timeFrames
    const timeFrames = (updatedData.timeFrames || []).map((tf) => ({
      ...tf,
      date: fromFirebaseTimestamp(tf.date),
    }));

    const analytics = {
      ...updatedData,
      id: updatedDoc.id,
      timeFrames,
    };

    return res.status(200).json({ analytics });
  } catch (error) {
    console.error(`Error updating offer analytics (${req.params.id}):`, error);
    next(error);
  }
};

module.exports = {
  getAllOffersAnalytics,
  getOfferAnalytics,
  updateOfferAnalytics,
};
