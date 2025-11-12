const Product = require("../models/Product");
const Stock = require("../models/Stock"); // Import Stock model

// @route   GET api/products
// @desc    Get all products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route   POST api/products
// @desc    Add new product
// @access  Public
exports.addProduct = async (req, res) => {
  const { name, code } = req.body;

  try {
    let product = await Product.findOne({ code });

    if (product) {
      return res.status(400).json({ msg: "Product code already exists" });
    }

    product = new Product({
      name,
      code,
    });

    await product.save();
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route   PUT api/products/:id
// @desc    Update a product
// @access  Public
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, code } = req.body;

  try {
    let product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    // Check if the new code already exists for another product
    const existingProductWithCode = await Product.findOne({
      code,
      _id: { $ne: id },
    });
    if (existingProductWithCode) {
      return res
        .status(400)
        .json({ msg: "Product code already exists for another product" });
    }

    product.name = name;
    product.code = code;

    await product.save();
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Public
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    await product.deleteOne();
    res.json({ msg: "Product removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route   GET api/products/in-stock-today
// @desc    Get products with available stock for today
// @access  Public
exports.getProductsInStockToday = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stocks = await Stock.find({
      date: today,
      remainStock: { $gt: 0 },
    }).populate("product_code"); // Populate product details

    const productsInStock = stocks.map((stock) => ({
      _id: stock.product_code._id,
      name: stock.product_code.name,
      code: stock.product_code.code,
      remainStock: stock.remainStock, // Include remaining stock for display if needed
    }));

    // Remove duplicates if a product has multiple stock entries for today (though schema has unique index)
    const uniqueProducts = Array.from(
      new Map(
        productsInStock.map((product) => [product._id.toString(), product])
      ).values()
    );

    res.json(uniqueProducts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
