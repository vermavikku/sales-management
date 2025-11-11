const express = require("express");
const router = express.Router();
const saleController = require("../controllers/saleController");

// @route   GET api/sales
// @desc    Get all sales with filters and pagination
// @access  Public
router.get("/", saleController.getSales);

// @route   GET api/sales/download-pdf
// @desc    Download sales data as PDF with filters
// @access  Public
router.get("/download-pdf", saleController.downloadSalesPdf);

// @route   POST api/sales
// @desc    Add new sale
// @access  Public
router.post("/", saleController.addSale);

// @route   PUT api/sales/:id
// @desc    Update a sale
// @access  Public
router.put("/:id", saleController.updateSale);

// @route   DELETE api/sales/:id
// @desc    Delete a sale
// @access  Public
router.delete("/:id", saleController.deleteSale);

module.exports = router;
