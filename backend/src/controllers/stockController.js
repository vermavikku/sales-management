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
    // Do not normalize date to start of day if it causes timezone issues
    // The frontend sends YYYY-MM-DD, which should be treated as UTC to avoid local timezone shifts
    // If the date is sent as "YYYY-MM-DD", new Date(date) will parse it as UTC midnight
    // If the date is sent with time, setHours(0,0,0,0) would be appropriate for normalizing to start of day in local time.
    // Given the frontend sends "YYYY-MM-DD", we want to preserve that specific date.

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

// @desc    Get all stocks with filters and pagination
// @route   GET /api/stock
// @access  Private (can be adjusted based on auth needs)
exports.getAllStocks = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      productCode,
      productName,
      page = 1,
      limit = 10,
    } = req.query;

    let query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (productCode) {
      const product = await Product.findOne({ code: productCode });
      if (product) {
        query.product_code = product._id;
      } else {
        return res.status(404).json({ message: "Product not found" });
      }
    }

    let productIds = [];
    if (productName) {
      const products = await Product.find({
        name: { $regex: productName, $options: "i" },
      });
      productIds = products.map((p) => p._id);
      if (productIds.length > 0) {
        query.product_code = { $in: productIds };
      } else {
        return res.status(200).json({
          stocks: [],
          currentPage: 1,
          totalPages: 1,
        });
      }
    }

    const totalStocks = await Stock.countDocuments(query);
    const totalPages = Math.ceil(totalStocks / limit);

    const stocks = await Stock.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("product_code", "name code"); // Populate product details

    const formattedStocks = stocks.map((stock) => ({
      _id: stock._id,
      date: stock.date,
      product_code: stock.product_code.code,
      product_name: stock.product_code.name,
      totalStock: stock.totalStock,
      remainStock: stock.remainStock,
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt,
    }));

    res.status(200).json({
      stocks: formattedStocks,
      currentPage: parseInt(page),
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error fetching all stocks:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update stock by ID
// @route   PUT /api/stock/:id
// @access  Private (can be adjusted based on auth needs)
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalStock, remainStock, date } = req.body;

    const stock = await Stock.findById(id);

    if (!stock) {
      return res.status(404).json({ message: "Stock entry not found" });
    }

    stock.totalStock = totalStock;
    stock.remainStock = remainStock;
    stock.date = date ? new Date(date) : stock.date;

    await stock.save();
    res.status(200).json(stock);
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete stock by ID
// @route   DELETE /api/stock/:id
// @access  Private (can be adjusted based on auth needs)
exports.deleteStock = async (req, res) => {
  try {
    const { id } = req.params;

    const stock = await Stock.findById(id);

    if (!stock) {
      return res.status(404).json({ message: "Stock entry not found" });
    }

    await stock.deleteOne();
    res.status(200).json({ message: "Stock entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting stock:", error);
    res.status(500).json({ message: error.message });
  }
};
