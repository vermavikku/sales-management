import React, { useState, useEffect } from "react";
import api from "../services/api";
import dayjs from "dayjs";
import clsx from "clsx";

function SalesPage() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [dateRangeFilter, setDateRangeFilter] = useState("today"); // New state for date range filter
  const [filters, setFilters] = useState({
    startDate: dayjs().format("YYYY-MM-DD"), // Default to today
    endDate: dayjs().format("YYYY-MM-DD"), // Default to today
    customerName: "",
    paymentMode: "",
    paymentStatus: "",
    productCode: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  });
  const [totalAggregates, setTotalAggregates] = useState({
    totalQuantityKg: 0,
    totalValue: 0,
  });
  const [showAddSaleModal, setShowAddSaleModal] = useState(false);
  const [newSale, setNewSale] = useState({
    customerName: "",
    productCode: "",
    quantityKg: "",
    pricePerKg: "", // New state for price per kg
    totalValue: 0, // New state for total value
    paymentMode: "cash",
    paymentStatus: "unpaid",
    date: dayjs().format("YYYY-MM-DD"),
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showEditSaleModal, setShowEditSaleModal] = useState(false);
  const [currentSale, setCurrentSale] = useState(null);
  const [showFilters, setShowFilters] = useState(false); // State to toggle filter visibility

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, [filters, dateRangeFilter, pagination.currentPage, pagination.limit]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSales = async () => {
    setError(null);
    try {
      let calculatedStartDate = filters.startDate;
      let calculatedEndDate = filters.endDate;

      if (dateRangeFilter === "today") {
        calculatedStartDate = dayjs().format("YYYY-MM-DD");
        calculatedEndDate = dayjs().format("YYYY-MM-DD");
      } else if (dateRangeFilter === "all") {
        calculatedStartDate = "";
        calculatedEndDate = "";
      } else if (dateRangeFilter === "yesterday") {
        calculatedStartDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");
        calculatedEndDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");
      } else if (dateRangeFilter === "last7days") {
        calculatedStartDate = dayjs().subtract(6, "day").format("YYYY-MM-DD");
        calculatedEndDate = dayjs().format("YYYY-MM-DD");
      } else if (dateRangeFilter === "lastmonth") {
        calculatedStartDate = dayjs()
          .subtract(1, "month")
          .startOf("month")
          .format("YYYY-MM-DD");
        calculatedEndDate = dayjs()
          .subtract(1, "month")
          .endOf("month")
          .format("YYYY-MM-DD");
      }
      // If "custom", startDate and endDate are already in filters state

      const params = {
        ...filters,
        startDate: calculatedStartDate,
        endDate: calculatedEndDate,
        page: pagination.currentPage,
        limit: pagination.limit,
      };
      console.log("Fetching sales with params:", params); // Debug log
      const data = await api.get("/sales", params);
      console.log("Sales API response data:", data); // Debug log
      setSales(data.sales);
      setPagination((prev) => ({
        ...prev,
        totalPages: data.totalPages,
        currentPage: data.currentPage,
      }));
      setTotalAggregates({
        totalQuantityKg: Number(data.totalQuantityKg) || 0,
        totalValue: Number(data.totalValue) || 0,
      });
    } catch (err) {
      setError(err.message);
      console.error("Error fetching sales:", err); // Debug log
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await api.get("/products");
      setProducts(data.products); // Correctly access the products array
    } catch (err) {
      console.error("Error fetching products:", err.message);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to first page on filter change
  };

  const handleDateRangeChange = (e) => {
    const value = e.target.value;
    setDateRangeFilter(value);

    let newStartDate = "";
    let newEndDate = "";

    if (value === "today") {
      newStartDate = dayjs().format("YYYY-MM-DD");
      newEndDate = dayjs().format("YYYY-MM-DD");
    } else if (value === "yesterday") {
      newStartDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");
      newEndDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");
    } else if (value === "last7days") {
      newStartDate = dayjs().subtract(6, "day").format("YYYY-MM-DD");
      newEndDate = dayjs().format("YYYY-MM-DD");
    } else if (value === "lastmonth") {
      newStartDate = dayjs()
        .subtract(1, "month")
        .startOf("month")
        .format("YYYY-MM-DD");
      newEndDate = dayjs()
        .subtract(1, "month")
        .endOf("month")
        .format("YYYY-MM-DD");
    } else if (value === "all") {
      newStartDate = "";
      newEndDate = "";
    }
    // If "custom", startDate and endDate will be handled by their respective inputs

    setFilters((prev) => ({
      ...prev,
      startDate: newStartDate,
      endDate: newEndDate,
    }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleClearFilters = () => {
    setDateRangeFilter("today"); // Reset date range filter to today
    setFilters({
      startDate: dayjs().format("YYYY-MM-DD"), // Reset to today
      endDate: dayjs().format("YYYY-MM-DD"), // Reset to today
      customerName: "",
      paymentMode: "",
      paymentStatus: "",
      productCode: "",
    });
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleNewSaleChange = (e) => {
    const { name, value } = e.target;
    let updatedSale = { ...newSale, [name]: value };

    // If quantityKg or pricePerKg changes, update totalValue
    if (name === "quantityKg" || name === "pricePerKg") {
      const quantity = parseFloat(updatedSale.quantityKg);
      const price = parseFloat(updatedSale.pricePerKg);
      updatedSale.totalValue = quantity && price ? quantity * price : 0;
    }

    setNewSale(updatedSale);
  };

  const handleAddSaleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        ...newSale,
        quantityKg: parseFloat(newSale.quantityKg) || 0, // Default to 0 if NaN
        pricePerKg: parseFloat(newSale.pricePerKg) || 0, // Default to 0 if NaN
        totalValue: parseFloat(newSale.totalValue) || 0, // Default to 0 if NaN
      };

      await api.post("/sales", payload);
      setSuccess("Sale added successfully!");
      setShowAddSaleModal(false);
      setNewSale({
        customerName: "",
        productCode: "",
        quantityKg: "",
        pricePerKg: "",
        totalValue: 0,
        paymentMode: "cash",
        paymentStatus: "unpaid",
        date: dayjs().format("YYYY-MM-DD"),
      });
      fetchSales();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditSale = (sale) => {
    setCurrentSale({
      ...sale,
      productCode: sale.product.code, // Extract product code for the select input
      date: dayjs(sale.date).format("YYYY-MM-DD"),
    });
    setShowEditSaleModal(true);
  };

  const handleDeleteSale = async (id) => {
    if (window.confirm("Are you sure you want to delete this sale?")) {
      setError(null);
      setSuccess(null);
      try {
        await api.delete(`/sales/${id}`);
        setSuccess("Sale deleted successfully!");
        fetchSales();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleUpdateSaleChange = (e) => {
    const { name, value } = e.target;
    let updatedSale = { ...currentSale, [name]: value };

    if (name === "quantityKg" || name === "pricePerKg") {
      const quantity = parseFloat(updatedSale.quantityKg);
      const price = parseFloat(updatedSale.pricePerKg);
      updatedSale.totalValue = quantity && price ? quantity * price : 0;
    }
    setCurrentSale(updatedSale);
  };

  const handleUpdateSaleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        ...currentSale,
        quantityKg: parseFloat(currentSale.quantityKg) || 0,
        pricePerKg: parseFloat(currentSale.pricePerKg) || 0,
        totalValue: parseFloat(currentSale.totalValue) || 0,
      };
      await api.put(`/sales/${currentSale._id}`, payload);
      setSuccess("Sale updated successfully!");
      setShowEditSaleModal(false);
      setCurrentSale(null);
      fetchSales();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePageChange = (newPage) => {
    console.log(
      `handlePageChange called: newPage=${newPage}, currentPage=${pagination.currentPage}, totalPages=${pagination.totalPages}`
    ); // Debug log
    if (newPage >= 1 && newPage <= Number(pagination.totalPages)) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    } else {
      console.log("Page change prevented: newPage out of bounds."); // Debug log
    }
  };

  const handleDownloadPdf = async () => {
    setError(null);
    setSuccess(null);
    try {
      let calculatedStartDate = filters.startDate;
      let calculatedEndDate = filters.endDate;

      if (dateRangeFilter === "today") {
        calculatedStartDate = dayjs().format("YYYY-MM-DD");
        calculatedEndDate = dayjs().format("YYYY-MM-DD");
      } else if (dateRangeFilter === "all") {
        calculatedStartDate = "";
        calculatedEndDate = "";
      } else if (dateRangeFilter === "yesterday") {
        calculatedStartDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");
        calculatedEndDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");
      } else if (dateRangeFilter === "last7days") {
        calculatedStartDate = dayjs().subtract(6, "day").format("YYYY-MM-DD");
        calculatedEndDate = dayjs().format("YYYY-MM-DD");
      } else if (dateRangeFilter === "lastmonth") {
        calculatedStartDate = dayjs()
          .subtract(1, "month")
          .startOf("month")
          .format("YYYY-MM-DD");
        calculatedEndDate = dayjs()
          .subtract(1, "month")
          .endOf("month")
          .format("YYYY-MM-DD");
      }
      // If "custom", startDate and endDate are already in filters state

      const params = {
        ...filters,
        startDate: calculatedStartDate,
        endDate: calculatedEndDate,
        limit: -1, // Fetch all data without pagination for PDF
      };
      const response = await api.get("/sales/download-pdf", params, {
        responseType: "blob", // Important for downloading files
      });

      // Create a blob from the response
      const file = new Blob([response], { type: "application/pdf" });

      // Create a link element, set the download attribute, and click it
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute("download", "sales_report.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(fileURL); // Clean up the URL object

      setSuccess("PDF downloaded successfully!");
    } catch (err) {
      setError(err.message || "Failed to download PDF.");
    }
  };

  return (
    <div className="container-fluid py-4 px-5 bg-white rounded-4 shadow-sm">
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">All Sales</h3>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex">
          <button
            onClick={() => setShowAddSaleModal(true)}
            className="btn btn-primary d-flex align-items-center"
          >
            <i className="bi bi-plus me-2"></i>
            Add
          </button>
          <div className="ms-2">
            <select
              id="dateRangeFilter"
              name="dateRangeFilter"
              value={dateRangeFilter}
              onChange={handleDateRangeChange}
              className="form-select"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="lastmonth">Last Month</option>
              <option value="all">All</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>
      </div>

      {dateRangeFilter === "custom" && (
        <div className="row g-3 mb-4 p-3 bg-light rounded shadow-sm">
          <div className="col-md-6 col-lg-3">
            <label htmlFor="startDate" className="form-label">
              Start Date:
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="form-control"
            />
          </div>
          <div className="col-md-6 col-lg-3">
            <label htmlFor="endDate" className="form-label">
              End Date:
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="form-control"
            />
          </div>
        </div>
      )}

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card shadow border h-100">
            <div className="card-body d-flex align-items-center">
              <div className="icon-wrapper bg-primary-subtle me-3 p-3 rounded-3">
                <i className="bi bi-box-seam text-primary fs-4"></i>
              </div>
              <div>
                <p className="card-text text-muted mb-0">Total Sold Quantity</p>
                <h4 className="card-title mb-0 fw-bold">
                  {totalAggregates.totalQuantityKg !== undefined
                    ? totalAggregates.totalQuantityKg.toFixed(2)
                    : "0.00"}{" "}
                  Kg
                </h4>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow border h-100">
            <div className="card-body d-flex align-items-center">
              <div className="icon-wrapper bg-success-subtle me-3 p-3 rounded-3">
                <i className="bi bi-currency-rupee text-success fs-4"></i>
              </div>
              <div>
                <p className="card-text text-muted mb-0">Total Value</p>
                <h4 className="card-title mb-0 fw-bold">
                  {totalAggregates.totalValue !== undefined
                    ? totalAggregates.totalValue.toFixed(2)
                    : "0.00"}
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center mb-4">
        <div className="input-group me-3">
          <span className="input-group-text border-0 bg-white">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            id="customerName"
            name="customerName"
            value={filters.customerName}
            onChange={handleFilterChange}
            placeholder="Search customer..."
            className="form-control border-1 shadow-sm"
            style={{ borderRadius: "0 0.375rem 0.375rem 0" }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn btn-light d-flex align-items-center shadow-sm border"
        >
          <i
            className={clsx("bi", {
              "bi-funnel-fill": showFilters,
              "bi-funnel": !showFilters,
            })}
          ></i>
          <span className="ms-2">{showFilters ? "Filters" : "Filters"}</span>
        </button>
      </div>

      {showFilters && (
        <div className="row g-3 mb-4 p-3 bg-light rounded shadow-sm">
          <div className="col-md-6 col-lg-3">
            <label htmlFor="productCodeFilter" className="form-label">
              Product Code:
            </label>
            <select
              id="productCodeFilter"
              name="productCode"
              value={filters.productCode}
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product._id} value={product.code}>
                  {product.code} - {product.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6 col-lg-3">
            <label htmlFor="paymentModeFilter" className="form-label">
              Payment Mode:
            </label>
            <select
              id="paymentModeFilter"
              name="paymentMode"
              value={filters.paymentMode}
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">All Modes</option>
              <option value="online">Online</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <div className="col-md-6 col-lg-3">
            <label htmlFor="paymentStatusFilter" className="form-label">
              Payment Status:
            </label>
            <select
              id="paymentStatusFilter"
              name="paymentStatus"
              value={filters.paymentStatus}
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          <div className="col-12 d-flex justify-content-end">
            <button onClick={handleClearFilters} className="btn btn-secondary">
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Desktop View Table */}
      <div className="table-responsive mb-4 d-none d-md-block">
        <table className="table table-striped table-hover">
          <thead className="table-light">
            <tr>
              <th>Sr</th>
              <th>Date</th>
              <th>Name</th>
              <th>Product</th>
              <th>Kg</th>
              <th>Price/Kg</th>
              <th>Total</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center">
                  No sales found.
                </td>
              </tr>
            ) : (
              sales.map((sale, index) => (
                <tr key={sale._id}>
                  <td>{index + 1}</td>
                  <td>{dayjs(sale.date).format("YYYY-MM-DD")}</td>
                  <td>{sale.customerName}</td>
                  <td>{`${sale.productName} - ${sale.productCode}`}</td>
                  <td>{sale.quantityKg}</td>
                  <td>
                    <i className="bi bi-currency-rupee"></i>
                    {sale.pricePerKg ? sale.pricePerKg.toFixed(2) : "N/A"}
                  </td>
                  <td>
                    <i className="bi bi-currency-rupee"></i>
                    {sale.totalValue ? sale.totalValue.toFixed(2) : "N/A"}
                  </td>
                  <td>
                    <span
                      className={clsx("badge", {
                        "bg-secondary": sale.paymentMode === "cash",
                        "bg-info": sale.paymentMode === "online",
                      })}
                    >
                      {sale.paymentMode}
                    </span>
                  </td>
                  <td>
                    <span
                      className={clsx("badge", {
                        "bg-success": sale.paymentStatus === "paid",
                        "bg-warning text-dark": sale.paymentStatus === "unpaid",
                      })}
                    >
                      {sale.paymentStatus}
                    </span>
                  </td>
                  <td className="action-buttons">
                    <button
                      className="btn btn-light btn-sm border"
                      onClick={() => handleEditSale(sale)}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>

                    <button
                      className="btn btn-light btn-sm border"
                      onClick={() => handleDeleteSale(sale._id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View Cards */}
      <div className="d-md-none mb-4">
        {sales.length === 0 ? (
          <div className="alert alert-info text-center">No sales found.</div>
        ) : (
          sales.map((sale) => (
            <div key={sale._id} className="card mb-3 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <small className="text-muted">Total</small>
                    <h5 className="card-title mb-0 fw-bold">
                      <i className="bi bi-currency-rupee"></i>
                      {sale.totalValue ? sale.totalValue.toFixed(2) : "0.00"}
                    </h5>
                  </div>
                  <div className="text-end">
                    <small
                      className={clsx("badge me-2", {
                        "bg-secondary": sale.paymentMode === "cash",
                        "bg-info": sale.paymentMode === "online",
                      })}
                    >
                      {sale.paymentMode}
                    </small>
                    <span
                      className={clsx("badge", {
                        "bg-success": sale.paymentStatus === "paid",
                        "bg-warning text-dark": sale.paymentStatus === "unpaid",
                      })}
                    >
                      {sale.paymentStatus}
                    </span>
                  </div>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Name</span>
                  <span>{sale.customerName}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Product</span>
                  <span>{`${sale.productName} - ${sale.productCode}`}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Kg</span>
                  <span>{sale.quantityKg}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Price/Kg</span>
                  <span>
                    {sale.pricePerKg
                      ? `$${sale.pricePerKg.toFixed(2)}`
                      : "0.00"}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Date</span>
                  <span>{dayjs(sale.date).format("YYYY-MM-DD")}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-end">
                  <button
                    className="btn btn-light btn-sm border me-2"
                    onClick={() => handleEditSale(sale)}
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button
                    className="btn btn-light btn-sm border"
                    onClick={() => handleDeleteSale(sale._id)}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="d-flex justify-content-end align-items-center">
        <nav aria-label="Page navigation example">
          <ul className="pagination mb-0">
            <li
              className={clsx("page-item", {
                disabled: pagination.currentPage === 1,
              })}
            >
              <button
                className="page-link"
                disabled={pagination.currentPage === 1}
                onClick={() =>
                  handlePageChange(Number(pagination.currentPage) - 1)
                }
                aria-label="Previous"
              >
                <span aria-hidden="true">Previous</span>
              </button>
            </li>
            <li className="page-item active">
              <span className="page-link">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
            </li>
            <li
              className={clsx("page-item", {
                disabled: pagination.currentPage === pagination.totalPages,
              })}
            >
              <button
                className="page-link"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => {
                  console.log(
                    "Next button clicked. New page will be:",
                    Number(pagination.currentPage) + 1
                  );
                  handlePageChange(Number(pagination.currentPage) + 1);
                }}
                aria-label="Next"
              >
                <span aria-hidden="true">Next</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Add Sale Modal */}
      <div
        className={`modal ${showAddSaleModal ? "d-block" : "d-none"}`}
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add New Sale</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setShowAddSaleModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleAddSaleSubmit}>
                <div className="mb-3">
                  <label htmlFor="newSaleCustomerName" className="form-label">
                    Customer Name:
                  </label>
                  <input
                    type="text"
                    id="newSaleCustomerName"
                    name="customerName"
                    value={newSale.customerName}
                    onChange={handleNewSaleChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="newSaleProductCode" className="form-label">
                    Product:
                  </label>
                  <select
                    id="newSaleProductCode"
                    name="productCode"
                    value={newSale.productCode}
                    onChange={handleNewSaleChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product._id} value={product.code}>
                        {product.code} - {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="newSaleQuantityKg" className="form-label">
                    Quantity (Kg):
                  </label>
                  <input
                    type="number"
                    id="newSaleQuantityKg"
                    name="quantityKg"
                    value={newSale.quantityKg}
                    onChange={handleNewSaleChange}
                    min="0.01"
                    step="0.01"
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="newSalePricePerKg" className="form-label">
                    Price Per Kg:
                  </label>
                  <input
                    type="number"
                    id="newSalePricePerKg"
                    name="pricePerKg"
                    value={newSale.pricePerKg}
                    onChange={handleNewSaleChange}
                    min="0.01"
                    step="0.01"
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="newSaleTotalValue" className="form-label">
                    Total Value:
                  </label>
                  <input
                    type="number"
                    id="newSaleTotalValue"
                    name="totalValue"
                    value={newSale.totalValue.toFixed(2)}
                    className="form-control"
                    readOnly
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Payment Mode:</label>
                  <div>
                    <div className="form-check form-check-inline">
                      <input
                        type="radio"
                        name="paymentMode"
                        value="online"
                        checked={newSale.paymentMode === "online"}
                        onChange={handleNewSaleChange}
                        className="form-check-input"
                        id="newSalePaymentModeOnline"
                      />
                      <label
                        className="form-check-label"
                        htmlFor="newSalePaymentModeOnline"
                      >
                        Online
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        type="radio"
                        name="paymentMode"
                        value="cash"
                        checked={newSale.paymentMode === "cash"}
                        onChange={handleNewSaleChange}
                        className="form-check-input"
                        id="newSalePaymentModeCash"
                      />
                      <label
                        className="form-check-label"
                        htmlFor="newSalePaymentModeCash"
                      >
                        Cash
                      </label>
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Payment Status:</label>
                  <div>
                    <div className="form-check form-check-inline">
                      <input
                        type="radio"
                        name="paymentStatus"
                        value="paid"
                        checked={newSale.paymentStatus === "paid"}
                        onChange={handleNewSaleChange}
                        className="form-check-input"
                        id="newSalePaymentStatusPaid"
                      />
                      <label
                        className="form-check-label"
                        htmlFor="newSalePaymentStatusPaid"
                      >
                        Paid
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        type="radio"
                        name="paymentStatus"
                        value="unpaid"
                        checked={newSale.paymentStatus === "unpaid"}
                        onChange={handleNewSaleChange}
                        className="form-check-input"
                        id="newSalePaymentStatusUnpaid"
                      />
                      <label
                        className="form-check-label"
                        htmlFor="newSalePaymentStatusUnpaid"
                      >
                        Unpaid
                      </label>
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="newSaleDate" className="form-label">
                    Date:
                  </label>
                  <input
                    type="date"
                    id="newSaleDate"
                    name="date"
                    value={newSale.date}
                    onChange={handleNewSaleChange}
                    className="form-control"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Add Sale
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSaleModal(false)}
                  className="btn btn-secondary ms-2"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Sale Modal */}
      <div
        className={`modal ${showEditSaleModal ? "d-block" : "d-none"}`}
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Sale</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setShowEditSaleModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleUpdateSaleSubmit}>
                <div className="mb-3">
                  <label htmlFor="editSaleCustomerName" className="form-label">
                    Customer Name:
                  </label>
                  <input
                    type="text"
                    id="editSaleCustomerName"
                    name="customerName"
                    value={currentSale?.customerName || ""}
                    onChange={handleUpdateSaleChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editSaleProductCode" className="form-label">
                    Product:
                  </label>
                  <select
                    id="editSaleProductCode"
                    name="productCode"
                    value={currentSale?.productCode || ""}
                    onChange={handleUpdateSaleChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product._id} value={product.code}>
                        {product.code} - {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="editSaleQuantityKg" className="form-label">
                    Quantity (Kg):
                  </label>
                  <input
                    type="number"
                    id="editSaleQuantityKg"
                    name="quantityKg"
                    value={currentSale?.quantityKg || ""}
                    onChange={handleUpdateSaleChange}
                    min="0.01"
                    step="0.01"
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editSalePricePerKg" className="form-label">
                    Price Per Kg:
                  </label>
                  <input
                    type="number"
                    id="editSalePricePerKg"
                    name="pricePerKg"
                    value={currentSale?.pricePerKg || ""}
                    onChange={handleUpdateSaleChange}
                    min="0.01"
                    step="0.01"
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editSaleTotalValue" className="form-label">
                    Total Value:
                  </label>
                  <input
                    type="number"
                    id="editSaleTotalValue"
                    name="totalValue"
                    value={currentSale?.totalValue?.toFixed(2) || "0.00"}
                    className="form-control"
                    readOnly
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Payment Mode:</label>
                  <div>
                    <div className="form-check form-check-inline">
                      <input
                        type="radio"
                        name="paymentMode"
                        value="online"
                        checked={currentSale?.paymentMode === "online"}
                        onChange={handleUpdateSaleChange}
                        className="form-check-input"
                        id="editSalePaymentModeOnline"
                      />
                      <label
                        className="form-check-label"
                        htmlFor="editSalePaymentModeOnline"
                      >
                        Online
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        type="radio"
                        name="paymentMode"
                        value="cash"
                        checked={currentSale?.paymentMode === "cash"}
                        onChange={handleUpdateSaleChange}
                        className="form-check-input"
                        id="editSalePaymentModeCash"
                      />
                      <label
                        className="form-check-label"
                        htmlFor="editSalePaymentModeCash"
                      >
                        Cash
                      </label>
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Payment Status:</label>
                  <div>
                    <div className="form-check form-check-inline">
                      <input
                        type="radio"
                        name="paymentStatus"
                        value="paid"
                        checked={currentSale?.paymentStatus === "paid"}
                        onChange={handleUpdateSaleChange}
                        className="form-check-input"
                        id="editSalePaymentStatusPaid"
                      />
                      <label
                        className="form-check-label"
                        htmlFor="editSalePaymentStatusPaid"
                      >
                        Paid
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        type="radio"
                        name="paymentStatus"
                        value="unpaid"
                        checked={currentSale?.paymentStatus === "unpaid"}
                        onChange={handleUpdateSaleChange}
                        className="form-check-input"
                        id="editSalePaymentStatusUnpaid"
                      />
                      <label
                        className="form-check-label"
                        htmlFor="editSalePaymentStatusUnpaid"
                      >
                        Unpaid
                      </label>
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="editSaleDate" className="form-label">
                    Date:
                  </label>
                  <input
                    type="date"
                    id="editSaleDate"
                    name="date"
                    value={currentSale?.date || ""}
                    onChange={handleUpdateSaleChange}
                    className="form-control"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Update Sale
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditSaleModal(false)}
                  className="btn btn-secondary ms-2"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesPage;
