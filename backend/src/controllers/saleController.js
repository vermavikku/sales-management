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

const puppeteer = require("puppeteer");

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

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    const htmlContent = generateReportHtml(reportData); // Function to generate HTML

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "40px",
        right: "40px",
        bottom: "40px",
        left: "40px",
      },
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales_report_puppeteer.pdf"
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Puppeteer PDF generation error:", err);
    res.status(500).send("Server Error");
  }
};

// Helper function to generate HTML content for the report
const generateReportHtml = (data) => {
  const {
    filters,
    sales,
    totalQuantityKg,
    totalValue,
    totalPaidValue,
    totalUnpaidValue,
    totalCashValue,
    totalOnlineValue,
    productAggregates,
  } = data;

  const filterHtml =
    Object.keys(filters).length > 0
      ? `
    <div class="filters-section">
      <h3>Filters Applied</h3>
      ${
        filters.startDate && filters.endDate
          ? `<p><strong>Date:</strong> ${new Date(
              filters.startDate
            ).toLocaleDateString()} &rarr; ${new Date(
              filters.endDate
            ).toLocaleDateString()}</p>`
          : ""
      }
      ${
        filters.customerName
          ? `<p><strong>Customer:</strong> ${filters.customerName}</p>`
          : ""
      }
      ${
        filters.paymentMode
          ? `<p><strong>Mode:</strong> ${filters.paymentMode}</p>`
          : ""
      }
      ${
        filters.paymentStatus
          ? `<p><strong>Status:</strong> ${filters.paymentStatus}</p>`
          : ""
      }
      ${
        filters.productCode
          ? `<p><strong>Product Code:</strong> ${filters.productCode}</p>`
          : ""
      }
    </div>
  `
      : "";

  const productTableRows = productAggregates
    .map(
      (pa) => `
    <tr>
      <td>${pa.productName} - ${pa._id}</td>
      <td>${pa.stockKg.toFixed(2)}</td>
      <td>${pa.totalSoldKg.toFixed(2)}</td>
      <td>₹${pa.totalProductValue.toFixed(2)}</td>
      <td>₹${pa.avgPricePerKg.toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  const paidSales = sales.filter((sale) => sale.paymentStatus === "paid");
  const unpaidSales = sales.filter((sale) => sale.paymentStatus === "unpaid");

  const generateSalesTableRows = (salesArray) => {
    return salesArray
      .map(
        (sale, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${new Date(sale.date).toLocaleDateString()}</td>
        <td>${sale.customerName}</td>
        <td>${sale.productName} - ${sale.productCode}</td>
        <td>${sale.quantityKg.toFixed(2)}</td>
        <td>${sale.pricePerKg.toFixed(2)}</td>
        <td>${sale.totalValue.toFixed(2)}</td>
        <td>${sale.paymentMode}</td>
        <td>${sale.paymentStatus}</td>
      </tr>
    `
      )
      .join("");
  };

  const paidSalesTableRows = generateSalesTableRows(paidSales);
  const unpaidSalesTableRows = generateSalesTableRows(unpaidSales);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sales Report</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 0;
                color: #333;
                font-size: 12px;
            }
            .container {
                width: 100%;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            h1, h2, h3 {
                color: #2c3e50;
                text-align: center;
            }
            h1 {
                font-size: 24px;
                margin-bottom: 20px;
            }
            h2 {
                font-size: 18px;
                margin-top: 30px;
                margin-bottom: 15px;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
            }
            h3 {
                font-size: 14px;
                margin-top: 20px;
                margin-bottom: 10px;
            }
            .summary-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 30px;
            }
            .summary-card {
                background-color: #fff;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                display: flex;
                align-items: center;
            }
            .summary-card .icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                margin-right: 10px;
                font-size: 18px;
                color: #fff;
            }
            .summary-card.total-qty .icon { background-color: #007bff; }
            .summary-card.total-value .icon { background-color: #28a745; }
            .summary-card.paid .icon { background-color: #28a745; }
            .summary-card.unpaid .icon { background-color: #ffc107; }
            .summary-card.cash .icon { background-color: #6c757d; }
            .summary-card.online .icon { background-color: #17a2b8; }

            .summary-card .details p {
                margin: 0;
                color: #666;
                font-size: 11px;
            }
            .summary-card .details h4 {
                margin: 5px 0 0;
                font-size: 16px;
                font-weight: bold;
                color: #333;
            }
            .summary-card.total-value .details h4 { color: #28a745; }

            .filters-section {
                background-color: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 5px;
                padding: 15px;
                margin-bottom: 20px;
            }
            .filters-section h3 {
                text-align: left;
                margin-top: 0;
                margin-bottom: 10px;
                color: #495057;
                border-bottom: 1px dashed #ced4da;
                padding-bottom: 5px;
            }
            .filters-section p {
                margin: 5px 0;
                font-size: 11px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: #f2f2f2;
                font-weight: bold;
                color: #555;
            }
            .text-right {
                text-align: right;
            }
            .total-row {
                font-weight: bold;
                background-color: #e9ecef;
            }
            .icon-wrapper {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 30px;
                height: 30px;
                border-radius: 5px;
                margin-right: 8px;
            }
            .bg-primary-subtle { background-color: #cfe2ff; }
            .text-primary { color: #0d6efd; }
            .bg-success-subtle { background-color: #d1e7dd; }
            .text-success { color: #198754; }
            .bg-warning-subtle { background-color: #fff3cd; }
            .text-warning { color: #ffc107; }
            .bg-secondary-subtle { background-color: #e2e3e5; }
            .text-secondary { color: #6c757d; }
            .bg-info-subtle { background-color: #cff4fc; }
            .text-info { color: #0dcaf0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Sales Report</h1>

            ${filterHtml}

            <h2>Summary Overview</h2>
            <div class="summary-grid">
                <div class="summary-card total-qty">
                    <div class="icon bg-primary-subtle"><span class="text-primary">📦</span></div>
                    <div class="details">
                        <p>Total Quantity Sold</p>
                        <h4>${totalQuantityKg.toFixed(2)} Kg</h4>
                    </div>
                </div>
                <div class="summary-card total-value">
                    <div class="icon bg-success-subtle"><span class="text-success">₹</span></div>
                    <div class="details">
                        <p>Total Sales Value</p>
                        <h4>₹${totalValue.toFixed(2)}</h4>
                    </div>
                </div>
                <div class="summary-card paid">
                    <div class="icon bg-success-subtle"><span class="text-success">₹</span></div>
                    <div class="details">
                        <p>Paid Amount</p>
                        <h4>₹${totalPaidValue.toFixed(2)}</h4>
                    </div>
                </div>
                <div class="summary-card unpaid">
                    <div class="icon bg-warning-subtle"><span class="text-warning">₹</span></div>
                    <div class="details">
                        <p>Unpaid Amount</p>
                        <h4>₹${totalUnpaidValue.toFixed(2)}</h4>
                    </div>
                </div>
                <div class="summary-card cash">
                    <div class="icon bg-secondary-subtle"><span class="text-secondary">₹</span></div>
                    <div class="details">
                        <p>Cash Sales</p>
                        <h4>₹${totalCashValue.toFixed(2)}</h4>
                    </div>
                </div>
                <div class="summary-card online">
                    <div class="icon bg-info-subtle"><span class="text-info">₹</span></div>
                    <div class="details">
                        <p>Online Sales</p>
                        <h4>₹${totalOnlineValue.toFixed(2)}</h4>
                    </div>
                </div>
            </div>

            <h2>Product-wise Summary</h2>
            <table>
                <thead>
                    <tr>
                        <th>Product Name/Code</th>
                        <th>Stock (Kg)</th>
                        <th>Sold (Kg)</th>
                        <th>Remain Stock (Kg)</th>
                        <th>Total Value</th>
                        <th>Avg/Kg</th>
                    </tr>
                </thead>
                <tbody>
                    ${productAggregates
                      .map(
                        (pa) => `
                    <tr>
                      <td>${pa.productName} - ${pa._id}</td>
                      <td>${pa.stockKg.toFixed(2)}</td>
                      <td>${pa.totalSoldKg.toFixed(2)}</td>
                      <td>${(pa.stockKg - pa.totalSoldKg).toFixed(2)}</td>
                      <td>₹${pa.totalProductValue.toFixed(2)}</td>
                      <td>₹${pa.avgPricePerKg.toFixed(2)}</td>
                    </tr>
                  `
                      )
                      .join("")}
                </tbody>
            </table>

            <h2>Paid Sales Data</h2>
            <table>
                <thead>
                    <tr>
                        <th>Sr</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Product</th>
                        <th>Qty (Kg)</th>
                        <th>Price/Kg</th>
                        <th>Total</th>
                        <th>Mode</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${paidSalesTableRows}
                </tbody>
            </table>

            <h2>Unpaid Sales Data</h2>
            <table>
                <thead>
                    <tr>
                        <th>Sr</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Product</th>
                        <th>Qty (Kg)</th>
                        <th>Price/Kg</th>
                        <th>Total</th>
                        <th>Mode</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${unpaidSalesTableRows}
                </tbody>
            </table>
        </div>
    </body>
    </html>
  `;
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
