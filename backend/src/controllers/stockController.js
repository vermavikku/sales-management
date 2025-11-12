const Stock = require("../models/Stock");
const Product = require("../models/Product"); // Assuming Product model is needed to link product_code

// @desc    Get stock by product code
// @route   GET /api/stock/:productCode
// @access  Private (can be adjusted based on auth needs)
exports.getStockByProductCode = async (req, res) => {
  try {
    const { productCode } = req.params;

    // Find the product to get its _id
    const product = await Product.findOne({ code: productCode });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const stocks = await Stock.find({ product_code: product._id }).sort({
      date: -1,
    });

    res.status(200).json(stocks);
  } catch (error) {
    console.error("Error fetching stock:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new stock
// @route   POST /api/stock
// @access  Private (can be adjusted based on auth needs)
exports.addStock = async (req, res) => {
  try {
    const { productCode, totalStock, remainStock, date } = req.body;

    // Find the product to get its _id
    const product = await Product.findOne({ code: productCode });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const stockDate = date ? new Date(date) : new Date();
    stockDate.setHours(0, 0, 0, 0); // Normalize date to start of day for comparison

    let stock = await Stock.findOne({
      product_code: product._id,
      date: stockDate,
    });

    if (stock) {
      // If stock exists for the product and date, update it
      stock.totalStock = totalStock;
      stock.remainStock = remainStock;
      await stock.save();
      res.status(200).json(stock); // Return 200 for update
    } else {
      // If no stock exists, create a new one
      const newStock = new Stock({
        product_code: product._id,
        totalStock,
        remainStock,
        date: stockDate,
      });
      await newStock.save();
      res.status(201).json(newStock); // Return 201 for creation
    }
  } catch (error) {
    console.error("Error adding stock:", error);
    res.status(400).json({ message: error.message });
  }
};
