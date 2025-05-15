// src/controllers/products.js
const { db } = require("../config/firebase");

// Get all products (menu items)
const getAllProducts = async (req, res, next) => {
  try {
    const productsSnapshot = await db.collection("menuItems").get();
    const products = [];

    productsSnapshot.forEach((doc) => {
      products.push({
        ...doc.data(),
        id: doc.id,
      });
    });

    return res.status(200).json({ products });
  } catch (error) {
    console.error("Error getting products:", error);
    next(error);
  }
};

// Get product by ID
const getProductById = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const productDoc = await db.collection("menuItems").doc(productId).get();

    if (!productDoc.exists) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Product not found",
        },
      });
    }

    const product = {
      ...productDoc.data(),
      id: productDoc.id,
    };

    return res.status(200).json({ product });
  } catch (error) {
    console.error(`Error getting product by ID (${req.params.id}):`, error);
    next(error);
  }
};

// Create a new product
const createProduct = async (req, res, next) => {
  try {
    const { body } = req;

    // Validate required fields
    if (!body.name || !body.category || !body.price) {
      return res.status(400).json({
        error: {
          code: "INVALID_ARGUMENT",
          message: "Missing required fields: name, category, or price",
        },
      });
    }

    const productData = {
      ...body,
      createdAt: new Date(),
    };

    const newProductRef = await db.collection("menuItems").add(productData);

    return res.status(201).json({
      product: {
        id: newProductRef.id,
        ...productData,
      },
    });
  } catch (error) {
    console.error("Error creating product:", error);
    next(error);
  }
};

// Update a product
const updateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { body } = req;

    // Verify product exists
    const productDoc = await db.collection("menuItems").doc(productId).get();
    if (!productDoc.exists) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Product not found",
        },
      });
    }

    const updates = { ...body, updatedAt: new Date() };
    await db.collection("menuItems").doc(productId).update(updates);

    // Get the updated document
    const updatedProductDoc = await db
      .collection("menuItems")
      .doc(productId)
      .get();
    const product = {
      ...updatedProductDoc.data(),
      id: productId,
    };

    return res.status(200).json({ product });
  } catch (error) {
    console.error(`Error updating product (${req.params.id}):`, error);
    next(error);
  }
};

// Delete a product
const deleteProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;

    // Verify product exists
    const productDoc = await db.collection("menuItems").doc(productId).get();
    if (!productDoc.exists) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Product not found",
        },
      });
    }

    // Check if product is used in any offers
    const offersWithProduct = await db
      .collection("offers")
      .where("products", "array-contains", productId)
      .get();

    if (!offersWithProduct.empty) {
      return res.status(400).json({
        error: {
          code: "FAILED_PRECONDITION",
          message: "Cannot delete product as it is used in active offers",
        },
      });
    }

    // Delete the product
    await db.collection("menuItems").doc(productId).delete();

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting product (${req.params.id}):`, error);
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
