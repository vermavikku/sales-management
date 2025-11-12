const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/products");
const saleRoutes = require("./routes/sales");
const stockRoutes = require("./routes/stock");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/stock", stockRoutes);

module.exports = app;
