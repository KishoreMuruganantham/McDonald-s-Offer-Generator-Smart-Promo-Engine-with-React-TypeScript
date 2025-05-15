// src/routes/products.js
const express = require("express");
const router = express.Router();
const productsController = require("../controllers/products");
const authMiddleware = require("../middleware/auth");

// Get all products
router.get("/", authMiddleware.verifyToken, productsController.getAllProducts);

// Get a single product by ID
router.get(
  "/:id",
  authMiddleware.verifyToken,
  productsController.getProductById
);

// Create a new product
router.post(
  "/",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin"]),
  productsController.createProduct
);

// Update a product
router.put(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin"]),
  productsController.updateProduct
);

// Delete a product
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin"]),
  productsController.deleteProduct
);

module.exports = router;
