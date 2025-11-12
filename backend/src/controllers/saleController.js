const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Stock = require("../models/Stock"); // Import Stock model


// @route   GET api/sales
// @desc    Get all sales with filters and pagination
// @access  Public
exports.getSales = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      customerName,
      paymentMode,
      paymentStatus,
      productCode,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (customerName) {
      query.customerName = {
        $regex: customerName,
        $options: "i",
      }; // Case-insensitive search
    }

    if (paymentMode) {
      query.paymentMode = paymentMode;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (productCode) {
      query.productCode = productCode;
    }

    const sales = await Sale.find(query)
      .populate("product", ["name", "code"])
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({
        date: -1,
      });

    const count = await Sale.countDocuments(query);
    const totalQuantityKg =
      (
        await Sale.aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: "$quantityKg" } } },
        ])
      )[0]?.total || 0;
    const totalValue =
      (
        await Sale.aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: "$totalValue" } } },
        ])
      )[0]?.total || 0;

    res.json({
      sales,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalQuantityKg,
      totalValue,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route   GET api/sales/download-pdf
// @desc    Download sales data as PDF with filters
// @access  Public
exports.downloadSalesPdf = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      customerName,
      paymentMode,
      paymentStatus,
      productCode,
    } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (customerName) {
      query.customerName = { $regex: customerName, $options: "i" };
    }

    if (paymentMode) query.paymentMode = paymentMode;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (productCode) query.productCode = productCode;

    const sales = await Sale.find(query)
      .populate("product", ["name", "code"])
      .sort({ date: -1 });

    const aggs = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalQty: { $sum: "$quantityKg" },
          totalValue: { $sum: "$totalValue" },
        },
      },
    ]);

    const totalQuantityKg = aggs[0]?.totalQty || 0;
    const totalValue = aggs[0]?.totalValue || 0;

    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales_report.pdf"
    );

    doc.pipe(res);

    /* ---------------- TITLE ---------------- */
    doc.fontSize(22).text("Sales Report", { align: "center" });
    doc.moveDown(1);

    /* ---------------- FILTERS ---------------- */
    if (Object.keys(query).length > 0) {
      doc.fontSize(13).text("Filters Applied", { underline: true });
      doc.moveDown(0.3);

      if (startDate && endDate) {
        doc
          .fontSize(10)
          .text(
            `Date: ${new Date(startDate).toLocaleDateString()} → ${new Date(
              endDate
            ).toLocaleDateString()}`
          );
      }
      if (customerName) doc.fontSize(10).text(`Customer: ${customerName}`);
      if (paymentMode) doc.fontSize(10).text(`Mode: ${paymentMode}`);
      if (paymentStatus) doc.fontSize(10).text(`Status: ${paymentStatus}`);
      if (productCode) doc.fontSize(10).text(`Product Code: ${productCode}`);

      doc.moveDown(1);
    }

    /* ---------------- SUMMARY FIRST ---------------- */
    doc.fontSize(14).text("Summary Report", { underline: true });
    doc.moveDown(0.7);

    doc.fontSize(11).text(`Total Sold: ${sales.length} transactions`);
    doc.fontSize(11).text(`Total Quantity (Kg): ${totalQuantityKg.toFixed(2)}`);
    doc.fontSize(11).text(`Total Value: ${totalValue.toFixed(2)}`);

    doc.moveDown(2);

    /* ---------------- SALES TABLE BELOW SUMMARY ---------------- */
    doc.fontSize(14).text("Sales Data", { underline: true });
    doc.moveDown(0.7);

    const headers = [
      "Date",
      "Customer",
      "Product",
      "Qty (Kg)",
      "Price/Kg",
      "Total",
      "Mode",
      "Status",
    ];

    // Widened columns for non-wrapping
    const widths = [70, 100, 90, 60, 60, 70, 60, 60];

    /* ---------------- DRAW HEADER ---------------- */
    const drawHeader = () => {
      const headerY = doc.y;

      doc.font("Helvetica-Bold").fontSize(10);

      let x = 40;

      headers.forEach((h, i) => {
        doc.text(h, x, headerY, {
          width: widths[i],
          lineBreak: false, // ✅ prevent wrapping
        });
        x += widths[i];
      });

      doc.y = headerY + 16; // ✅ go to next row
      doc.font("Helvetica").fontSize(9);
    };

    drawHeader();

    /* ---------------- DRAW ROWS ---------------- */
    sales.forEach((sale) => {
      if (doc.y > doc.page.height - 80) {
        doc.addPage();
        drawHeader();
      }

      const rowY = doc.y;

      const row = [
        new Date(sale.date).toLocaleDateString(),
        sale.customerName,
        sale.product?.name || "-",
        sale.quantityKg.toFixed(2),
        sale.pricePerKg.toFixed(2),
        sale.totalValue.toFixed(2),
        sale.paymentMode,
        sale.paymentStatus,
      ];

      let x = 40;

      row.forEach((cell, i) => {
        doc.text(cell, x, rowY, {
          width: widths[i],
          lineBreak: false, // ✅ DO NOT WRAP
        });
        x += widths[i];
      });

      doc.y = rowY + 16; // ✅ fixed row height
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};


// @route   GET api/sales/download-report
// @desc    Download sales data as PDF with filters using Puppeteer
// @access  Public
exports.downloadSalesPdfPuppeteer = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      customerName,
      paymentMode,
      paymentStatus,
      productCode,
    } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (customerName) {
      query.customerName = { $regex: customerName, $options: "i" };
    }

    if (paymentMode) query.paymentMode = paymentMode;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (productCode) query.productCode = productCode;

    const sales = await Sale.find(query)
      .populate("product", ["name", "code"])
      .sort({ date: -1 });

    const aggs = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalQty: { $sum: "$quantityKg" },
          totalValue: { $sum: "$totalValue" },
          totalPaidValue: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalValue", 0],
            },
          },
          totalUnpaidValue: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "unpaid"] }, "$totalValue", 0],
            },
          },
          totalCashValue: {
            $sum: {
              $cond: [{ $eq: ["$paymentMode", "cash"] }, "$totalValue", 0],
            },
          },
          totalOnlineValue: {
            $sum: {
              $cond: [{ $eq: ["$paymentMode", "online"] }, "$totalValue", 0],
            },
          },
        },
      },
    ]);

    const totalQuantityKg = aggs[0]?.totalQty || 0;
    const totalValue = aggs[0]?.totalValue || 0;
    const totalPaidValue = aggs[0]?.totalPaidValue || 0;
    const totalUnpaidValue = aggs[0]?.totalUnpaidValue || 0;
    const totalCashValue = aggs[0]?.totalCashValue || 0;
    const totalOnlineValue = aggs[0]?.totalOnlineValue || 0;

    // Aggregate product-wise data for the table in the image
    const productAggregates = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$productCode",
          productName: { $first: "$productName" },
          totalSoldKg: { $sum: "$quantityKg" },
          totalProductValue: { $sum: "$totalValue" },
          avgPricePerKg: { $avg: "$pricePerKg" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fetch product stock from the Stock collection
    const productCodesInSales = [...new Set(sales.map((s) => s.productCode))];
    const productStockMap = {};

    for (const productCode of productCodesInSales) {
      const product = await Product.findOne({ code: productCode });
      if (product) {
        const latestStock = await Stock.findOne({ product_code: product._id })
          .sort({ date: -1 })
          .select("remainStock");
        productStockMap[productCode] = latestStock
          ? latestStock.remainStock
          : 0;
      }
    }

    const reportData = {
      filters: req.query,
      sales,
      totalQuantityKg,
      totalValue,
      totalPaidValue,
      totalUnpaidValue,
      totalCashValue,
      totalOnlineValue,
      productAggregates: productAggregates.map((pa) => ({
        ...pa,
        stockKg: productStockMap[pa._id] || 0, // Add stock information from Stock collection
      })),
    };

    res.json(reportData);
  } catch (err) {
    console.error("Error fetching sales report data:", err);
    res.status(500).send("Server Error");
  }
};

// @route   POST api/sales
// @desc    Add new sale
// @access  Public
exports.addSale = async (req, res) => {
  const {
    customerName,
    productCode,
    quantityKg,
    pricePerKg,
    paymentMode,
    paymentStatus,
    date,
  } = req.body;

  try {
    const product = await Product.findOne({
      code: productCode,
    });

    if (!product) {
      return res.status(404).json({
        msg: "Product not found",
      });
    }

    const totalValue = quantityKg * pricePerKg; // Calculate totalValue

    const newSale = new Sale({
      product: product._id,
      productCode: product.code,
      productName: product.name,
      quantityKg,
      pricePerKg, // Add pricePerKg
      totalValue, // Add totalValue
      customerName,
      paymentMode,
      paymentStatus,
      date: date || Date.now(),
    });

    const saleDate = date ? new Date(date) : new Date();
    saleDate.setHours(0, 0, 0, 0); // Normalize date to start of day

    let stock = await Stock.findOne({
      product_code: product._id,
      date: saleDate,
    });

    if (!stock) {
      return res
        .status(400)
        .json({ msg: "No stock found for this product on the selected date." });
    }

    if (stock.remainStock < quantityKg) {
      return res.status(400).json({
        msg: `Insufficient stock. Only ${stock.remainStock} Kg remaining.`,
      });
    }

    // Deduct stock
    stock.remainStock -= quantityKg;
    await stock.save();

    const sale = await newSale.save();
    res.json(sale);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route   PUT api/sales/:id
// @desc    Update a sale
// @access  Public
exports.updateSale = async (req, res) => {
  const { id } = req.params;
  const {
    customerName,
    productCode,
    quantityKg,
    pricePerKg,
    paymentMode,
    paymentStatus,
    date,
  } = req.body;

  try {
    const product = await Product.findOne({ code: productCode });

    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    const totalValue = quantityKg * pricePerKg;

    const updatedSale = await Sale.findByIdAndUpdate(
      id,
      {
        product: product._id,
        productCode: product.code,
        productName: product.name,
        quantityKg,
        pricePerKg,
        totalValue,
        customerName,
        paymentMode,
        paymentStatus,
        date: date || Date.now(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedSale) {
      return res.status(404).json({ msg: "Sale not found" });
    }

    res.json(updatedSale);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route   DELETE api/sales/:id
// @desc    Delete a sale
// @access  Public
exports.deleteSale = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedSale = await Sale.findByIdAndDelete(id);

    if (!deletedSale) {
      return res.status(404).json({ msg: "Sale not found" });
    }

    res.json({ msg: "Sale removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
