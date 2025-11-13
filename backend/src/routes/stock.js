const express = require("express");
const router = express.Router();
const {
  getAllStocks,
  getStockByProductCode,
  addStock,
  updateStock,
  deleteStock,
} = require("../controllers/stockController");

router.get("/", getAllStocks); // New route to get all stocks with filters
router.get("/:productCode", getStockByProductCode);
router.post("/", addStock);
router.put("/:id", updateStock); // New route to update stock by ID
router.delete("/:id", deleteStock); // New route to delete stock by ID

module.exports = router;
