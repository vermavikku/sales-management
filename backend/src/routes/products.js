const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// @route   GET api/products
// @desc    Get all products
// @access  Public
router.get("/", productController.getProducts);

// @route   POST api/products
// @desc    Add new product
// @access  Public
router.post("/", productController.addProduct);

// @route   PUT api/products/:id
// @desc    Update a product
// @access  Public
router.put("/:id", productController.updateProduct);

// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Public
router.delete("/:id", productController.deleteProduct);

// @route   GET api/products/in-stock-today
// @desc    Get products with available stock for today
// @access  Public
router.get("/in-stock-today", productController.getProductsInStockToday);

module.exports = router;
