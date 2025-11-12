const express = require("express");
const router = express.Router();
const {
  getStockByProductCode,
  addStock,
} = require("../controllers/stockController");

router.get("/:productCode", getStockByProductCode);
router.post("/", addStock);

module.exports = router;
