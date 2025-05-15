// src/config/firebase.js
const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin with credentials
// For local development, use a service account key file
// In production, use environment variables or cloud provider's secret manager
function initializeFirebaseAdmin() {
  // Check if app is already initialized
  if (admin.apps.length === 0) {
    try {
      // For development: use service account JSON file
      const serviceAccountPath = path.resolve(
        __dirname,
        "./keys/service-account-key.json"
      );

      // Check if file exists, otherwise use environment variables
      try {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL:
            process.env.FIREBASE_DATABASE_URL ||
            `https://${serviceAccount.project_id}.firebaseio.com`,
        });
      } catch (fileError) {
        // Fall back to environment variables
        console.log(
          "Service account file not found, using environment variables"
        );
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId:
              process.env.FIREBASE_PROJECT_ID || "mcdonald-s-offer-generator",
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Replace newlines in the private key if using environment variables
            privateKey: process.env.FIREBASE_PRIVATE_KEY
              ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
              : undefined,
          }),
          databaseURL: process.env.FIREBASE_DATABASE_URL,
        });
      }
      console.log("Firebase Admin SDK initialized successfully");
    } catch (error) {
      console.error("Error initializing Firebase Admin SDK:", error);
      throw error;
    }
  }

  return admin;
}

// Export the initialized Firebase Admin SDK
module.exports = {
  admin,
  db: initializeFirebaseAdmin().firestore(),
  auth: initializeFirebaseAdmin().auth(),
};
