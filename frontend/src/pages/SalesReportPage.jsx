import React, { useState, useEffect } from "react";
import api from "../services/api";
import html2pdf from "html2pdf.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const SalesReportPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Date filter options
  const [dateFilter, setDateFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        dateFilter,
        startDate,
        endDate,
        paymentMode,
        paymentStatus,
      };
      const res = await api.get("/sales/download-report", params);
      setReportData(res);
    } catch (err) {
      console.error("Error fetching sales report:", err);
      setError("Failed to fetch sales report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const handleApplyFilters = () => {
    fetchReportData();
  };

  const handlePrint = () => {
    const element = document.querySelector(".sales-report-page");
    const opt = {
      margin: 0.5,
      filename: "sales_report.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  if (loading) return <div className="container mt-4 text-center">Loading report...</div>;
  if (error) return <div className="container mt-4 text-danger text-center">Error: {error}</div>;
  if (!reportData) return <div className="container mt-4 text-center">No report data available.</div>;

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
  } = reportData;

  const paidSales = sales.filter((s) => s.paymentStatus === "paid");
  const unpaidSales = sales.filter((s) => s.paymentStatus === "unpaid");

  return (
    <div className="sales-report-page container mt-4">
      {/* Hide filter UI in print */}
      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      {/* Header + Download Button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="fw-bold">Sales Report</h1>
        <button className="btn btn-success no-print" onClick={handlePrint}>
          <i className="bi bi-download me-1"></i> Download Report
        </button>
      </div>

      {/* Filters Card (hidden in print) */}
      <div className="card mb-4 shadow-sm no-print">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-end gap-3">
            {/* Date Filter */}
            <div>
              <label className="form-label fw-semibold">Date Range</label>
              <select
                className="form-select"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last30">Last 30 Days</option>
                <option value="all">All</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Show From/To when Custom selected */}
            {dateFilter === "custom" && (
              <>
                <div>
                  <label className="form-label fw-semibold">From</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label fw-semibold">To</label>
                  <input
                    type="date"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Payment Mode */}
            <div>
              <label className="form-label fw-semibold">Payment Mode</label>
              <select
                className="form-select"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <option value="">All</option>
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
            </div>

            {/* Payment Status */}
            <div>
              <label className="form-label fw-semibold">Payment Status</label>
              <select
                className="form-select"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            {/* Apply Button */}
            <div>
              <button className="btn btn-primary mt-2" onClick={handleApplyFilters}>
                <i className="bi bi-search"></i> Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Applied Filters (VISIBLE in print) */}
      {filters && Object.keys(filters).length > 0 && (
        <div className="alert alert-light border mb-4">
          <h6 className="fw-bold mb-2"><i className="bi bi-funnel-fill"></i> Filters Applied</h6>
          {filters.dateFilter && <p className="mb-1"><strong>Date Filter:</strong> {filters.dateFilter}</p>}
          {filters.startDate && filters.endDate && (
            <p className="mb-1">
              <strong>Date Range:</strong> {new Date(filters.startDate).toLocaleDateString()} →{" "}
              {new Date(filters.endDate).toLocaleDateString()}
            </p>
          )}
          {filters.paymentMode && <p className="mb-1"><strong>Payment Mode:</strong> {filters.paymentMode}</p>}
          {filters.paymentStatus && <p className="mb-0"><strong>Status:</strong> {filters.paymentStatus}</p>}
        </div>
      )}

      {/* Summary */}
      <h4 className="fw-bold mb-3"><i className="bi bi-graph-up"></i> Summary Overview</h4>
      <div className="row g-3 mb-4">
        {[
          { title: "Total Quantity Sold", value: `${totalQuantityKg.toFixed(2)} Kg`, icon: "bi-box", color: "primary" },
          { title: "Total Sales Value", value: `₹${totalValue.toFixed(2)}`, icon: "bi-currency-rupee", color: "success" },
          { title: "Paid Amount", value: `₹${totalPaidValue.toFixed(2)}`, icon: "bi-check2-circle", color: "success" },
          { title: "Unpaid Amount", value: `₹${totalUnpaidValue.toFixed(2)}`, icon: "bi-exclamation-circle", color: "warning" },
          { title: "Cash Sales", value: `₹${totalCashValue.toFixed(2)}`, icon: "bi-cash", color: "secondary" },
          { title: "Online Sales", value: `₹${totalOnlineValue.toFixed(2)}`, icon: "bi-globe", color: "info" },
        ].map((item, idx) => (
          <div key={idx} className="col-md-6 col-lg-4">
            <div className={`card border-${item.color} shadow-sm`}>
              <div className="card-body d-flex align-items-center">
                <div className={`text-${item.color} fs-3 me-3`}>
                  <i className={`bi ${item.icon}`}></i>
                </div>
                <div>
                  <p className="mb-1 fw-semibold text-muted">{item.title}</p>
                  <h5 className="fw-bold mb-0">{item.value}</h5>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product Summary */}
      <h4 className="fw-bold mb-3"><i className="bi bi-box-seam"></i> Product-wise Summary</h4>
      <div className="table-responsive mb-4">
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Product</th>
              <th>Stock (Kg)</th>
              <th>Sold (Kg)</th>
              <th>Remaining (Kg)</th>
              <th>Total Value</th>
              <th>Avg/Kg</th>
            </tr>
          </thead>
          <tbody>
            {productAggregates.map((pa) => (
              <tr key={pa._id}>
                <td>{pa.productName} - {pa._id}</td>
                <td>{pa.stockKg.toFixed(2)}</td>
                <td>{pa.totalSoldKg.toFixed(2)}</td>
                <td>{(pa.stockKg - pa.totalSoldKg).toFixed(2)}</td>
                <td>₹{pa.totalProductValue.toFixed(2)}</td>
                <td>₹{pa.avgPricePerKg.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paid Sales */}
      <h4 className="fw-bold mb-3 text-success"><i className="bi bi-cash-stack"></i> Paid Sales Data</h4>
      <div className="table-responsive mb-4">
        <table className="table table-bordered table-striped align-middle">
          <thead className="table-success">
            <tr>
              <th>#</th>
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
            {paidSales.map((sale, i) => (
              <tr key={sale._id}>
                <td>{i + 1}</td>
                <td>{new Date(sale.date).toLocaleDateString()}</td>
                <td>{sale.customerName}</td>
                <td>{sale.productName} - {sale.productCode}</td>
                <td>{sale.quantityKg.toFixed(2)}</td>
                <td>₹{sale.pricePerKg.toFixed(2)}</td>
                <td>₹{sale.totalValue.toFixed(2)}</td>
                <td><span className="badge bg-success">{sale.paymentMode}</span></td>
                <td><span className="badge bg-success">{sale.paymentStatus}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Unpaid Sales */}
      <h4 className="fw-bold mb-3 text-warning"><i className="bi bi-exclamation-triangle"></i> Unpaid Sales Data</h4>
      <div className="table-responsive mb-5">
        <table className="table table-bordered table-striped align-middle">
          <thead className="table-warning">
            <tr>
              <th>#</th>
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
            {unpaidSales.map((sale, i) => (
              <tr key={sale._id}>
                <td>{i + 1}</td>
                <td>{new Date(sale.date).toLocaleDateString()}</td>
                <td>{sale.customerName}</td>
                <td>{sale.productName} - {sale.productCode}</td>
                <td>{sale.quantityKg.toFixed(2)}</td>
                <td>₹{sale.pricePerKg.toFixed(2)}</td>
                <td>₹{sale.totalValue.toFixed(2)}</td>
                <td><span className="badge bg-secondary">{sale.paymentMode}</span></td>
                <td><span className="badge bg-warning text-dark">{sale.paymentStatus}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesReportPage;
