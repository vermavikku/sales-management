import React, { useState, useEffect } from "react";
import api from "../services/api";

const SalesReportPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states (can be expanded based on actual filter requirements)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [productCode, setProductCode] = useState("");

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        startDate,
        endDate,
        customerName,
        paymentMode,
        paymentStatus,
        productCode,
      };
      const res = await api.get("/sales/download-report", params); // Use the api service
      setReportData(res); // api service already returns data directly
    } catch (err) {
      console.error("Error fetching sales report:", err);
      setError("Failed to fetch sales report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []); // Fetch data on initial load

  const handleApplyFilters = () => {
    fetchReportData();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="container mt-4">Loading report...</div>;
  if (error) return <div className="container mt-4 text-danger">Error: {error}</div>;
  if (!reportData) return <div className="container mt-4">No report data available.</div>;

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

  const paidSales = sales.filter((sale) => sale.paymentStatus === "paid");
  const unpaidSales = sales.filter((sale) => sale.paymentStatus === "unpaid");

  return (
    <div className="sales-report-page container mt-4">
      <h1 className="text-center mb-4">Sales Report</h1>

      <div className="card mb-4 no-print">
        <div className="card-header">
          <h3 className="mb-0">Filters</h3>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6 col-lg-4">
              <label htmlFor="startDate" className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-6 col-lg-4">
              <label htmlFor="endDate" className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="col-md-6 col-lg-4">
              <label htmlFor="customerName" className="form-label">Customer Name</label>
              <input
                type="text"
                className="form-control"
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="col-md-6 col-lg-4">
              <label htmlFor="paymentMode" className="form-label">Payment Mode</label>
              <select
                className="form-select"
                id="paymentMode"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <option value="">All</option>
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div className="col-md-6 col-lg-4">
              <label htmlFor="paymentStatus" className="form-label">Payment Status</label>
              <select
                className="form-select"
                id="paymentStatus"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
            <div className="col-md-6 col-lg-4">
              <label htmlFor="productCode" className="form-label">Product Code</label>
              <input
                type="text"
                className="form-control"
                id="productCode"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
              />
            </div>
          </div>
          <div className="d-flex justify-content-end mt-3">
            <button className="btn btn-primary me-2" onClick={handleApplyFilters}>Apply Filters</button>
            <button className="btn btn-secondary" onClick={handlePrint}>Print Report</button>
          </div>
        </div>
      </div>

      {Object.keys(filters).length > 0 && (
        <div className="filters-section mb-4">
          <h3>Filters Applied</h3>
          {filters.startDate && filters.endDate && (
            <p>
              <strong>Date:</strong> {new Date(filters.startDate).toLocaleDateString()} &rarr;{" "}
              {new Date(filters.endDate).toLocaleDateString()}
            </p>
          )}
          {filters.customerName && <p><strong>Customer:</strong> {filters.customerName}</p>}
          {filters.paymentMode && <p><strong>Mode:</strong> {filters.paymentMode}</p>}
          {filters.paymentStatus && <p><strong>Status:</strong> {filters.paymentStatus}</p>}
          {filters.productCode && <p><strong>Product Code:</strong> {filters.productCode}</p>}
        </div>
      )}

      <h2 className="mb-3">Summary Overview</h2>
      <div className="row g-3 mb-4">
        <div className="col-md-6 col-lg-4">
          <div className="summary-card total-qty">
            <div className="icon bg-primary-subtle"><span className="text-primary">📦</span></div>
            <div className="details">
              <p>Total Quantity Sold</p>
              <h4>{totalQuantityKg.toFixed(2)} Kg</h4>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-4">
          <div className="summary-card total-value">
            <div className="icon bg-success-subtle"><span className="text-success">₹</span></div>
            <div className="details">
              <p>Total Sales Value</p>
              <h4>₹{totalValue.toFixed(2)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-4">
          <div className="summary-card paid">
            <div className="icon bg-success-subtle"><span className="text-success">₹</span></div>
            <div className="details">
              <p>Paid Amount</p>
              <h4>₹{totalPaidValue.toFixed(2)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-4">
          <div className="summary-card unpaid">
            <div className="icon bg-warning-subtle"><span className="text-warning">₹</span></div>
            <div className="details">
              <p>Unpaid Amount</p>
              <h4>₹{totalUnpaidValue.toFixed(2)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-4">
          <div className="summary-card cash">
            <div className="icon bg-secondary-subtle"><span className="text-secondary">₹</span></div>
            <div className="details">
              <p>Cash Sales</p>
              <h4>₹{totalCashValue.toFixed(2)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-4">
          <div className="summary-card online">
            <div className="icon bg-info-subtle"><span className="text-info">₹</span></div>
            <div className="details">
              <p>Online Sales</p>
              <h4>₹{totalOnlineValue.toFixed(2)}</h4>
            </div>
          </div>
        </div>
      </div>

      <h2 className="mb-3">Product-wise Summary</h2>
      <div className="table-responsive mb-4">
        <table className="table table-bordered table-striped">
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

      <h2 className="mb-3">Paid Sales Data</h2>
      <div className="table-responsive mb-4">
        <table className="table table-bordered table-striped">
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
            {paidSales.map((sale, index) => (
              <tr key={sale._id}>
                <td>{index + 1}</td>
                <td>{new Date(sale.date).toLocaleDateString()}</td>
                <td>{sale.customerName}</td>
                <td>{sale.productName} - {sale.productCode}</td>
                <td>{sale.quantityKg.toFixed(2)}</td>
                <td>{sale.pricePerKg.toFixed(2)}</td>
                <td>{sale.totalValue.toFixed(2)}</td>
                <td>{sale.paymentMode}</td>
                <td>{sale.paymentStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3">Unpaid Sales Data</h2>
      <div className="table-responsive mb-4">
        <table className="table table-bordered table-striped">
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
            {unpaidSales.map((sale, index) => (
              <tr key={sale._id}>
                <td>{index + 1}</td>
                <td>{new Date(sale.date).toLocaleDateString()}</td>
                <td>{sale.customerName}</td>
                <td>{sale.productName} - {sale.productCode}</td>
                <td>{sale.quantityKg.toFixed(2)}</td>
                <td>{sale.pricePerKg.toFixed(2)}</td>
                <td>{sale.totalValue.toFixed(2)}</td>
                <td>{sale.paymentMode}</td>
                <td>{sale.paymentStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesReportPage;
