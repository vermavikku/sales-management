import React, { useState, useEffect } from "react";
import api from "../services/api";
import dayjs from "dayjs";
import clsx from "clsx";

function StocksPage() {
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]); // State for all stocks
  const [filters, setFilters] = useState({
    startDate: dayjs().format("YYYY-MM-DD"), // Default to today
    endDate: dayjs().format("YYYY-MM-DD"), // Default to today
    productCode: "",
    productName: "",
  });
  const [dateRangeFilter, setDateRangeFilter] = useState("today"); // New state for date range filter
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [newStockInput, setNewStockInput] = useState({
    productCode: "",
    newStockKg: "",
    date: dayjs().format("YYYY-MM-DD"),
  });
  const [showEditStockModal, setShowEditStockModal] = useState(false);
  const [currentStock, setCurrentStock] = useState(null);
  const [showFilters, setShowFilters] = useState(false); // State to toggle filter visibility

  useEffect(() => {
    fetchProducts();
    fetchStocks();
  }, [filters, dateRangeFilter, pagination.currentPage, pagination.limit]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProducts = async () => {
    try {
      const data = await api.get("/products");
      setProducts(data.products);
    } catch (err) {
      console.error("Error fetching products:", err.message);
    }
  };

  const fetchStocks = async () => {
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
      const data = await api.get("/stock", params); // Assuming /stock endpoint can handle filters
      setStocks(data.stocks); // Assuming the API returns an object with a 'stocks' array
      setPagination((prev) => ({
        ...prev,
        totalPages: data.totalPages,
        currentPage: data.currentPage,
      }));
    } catch (err) {
      setError(err.message);
      console.error("Error fetching stocks:", err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
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

    setFilters((prev) => ({
      ...prev,
      startDate: newStartDate,
      endDate: newEndDate,
    }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleClearFilters = () => {
    setDateRangeFilter("today");
    setFilters({
      startDate: dayjs().format("YYYY-MM-DD"),
      endDate: dayjs().format("YYYY-MM-DD"),
      productCode: "",
      productName: "",
    });
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleNewStockInputChange = (e) => {
    const { name, value } = e.target;
    setNewStockInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      if (!newStockInput.productCode) {
        setError("Please select a product.");
        return;
      }

      const newStockAmount = parseFloat(newStockInput.newStockKg) || 0;
      let currentTotalStock = 0;
      let currentRemainStock = 0;

      // Fetch the specific stock entry for the selected product and date
      try {
        const specificStockData = await api.get(
          `/stock/${newStockInput.productCode}?date=${newStockInput.date}`
        );
        if (specificStockData && specificStockData.stocks.length > 0) {
          currentTotalStock = specificStockData.stocks[0].totalStock;
          currentRemainStock = specificStockData.stocks[0].remainStock;
        }
      } catch (fetchErr) {
        // If no stock found for the date, it's fine, we'll create a new one or update if productCode matches
        console.log(
          "No existing stock found for the selected date, will create new or update existing product stock."
        );
      }

      const payload = {
        productCode: newStockInput.productCode,
        totalStock: currentTotalStock + newStockAmount,
        remainStock: currentRemainStock + newStockAmount,
        date: newStockInput.date,
      };

      await api.post("/stock", payload); // This endpoint should handle creation/update
      setSuccess("Stock added successfully!");
      setShowAddStockModal(false);
      setNewStockInput({
        productCode: "",
        newStockKg: "",
        date: dayjs().format("YYYY-MM-DD"),
      });
      fetchStocks(); // Refresh the stock list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditStock = (stock) => {
    setCurrentStock({
      ...stock,
      productCode: stock.product_code,
      date: dayjs(stock.date).format("YYYY-MM-DD"),
      newStockKg: stock.totalStock, // Initialize with current total stock
    });
    setShowEditStockModal(true);
  };

  const handleUpdateStockChange = (e) => {
    const { name, value } = e.target;
    setCurrentStock((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateStockSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        productCode: currentStock.productCode,
        totalStock: parseFloat(currentStock.newStockKg) || 0, // Use newStockKg as the updated totalStock
        remainStock: parseFloat(currentStock.newStockKg) || 0, // For simplicity, assume remainStock is updated to totalStock
        date: currentStock.date,
      };
      await api.put(`/stock/${currentStock._id}`, payload); // Assuming an update endpoint by ID
      setSuccess("Stock updated successfully!");
      setShowEditStockModal(false);
      setCurrentStock(null);
      fetchStocks();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteStock = async (id) => {
    if (window.confirm("Are you sure you want to delete this stock entry?")) {
      setError(null);
      setSuccess(null);
      try {
        await api.delete(`/stock/${id}`); // Assuming a delete endpoint by ID
        setSuccess("Stock entry deleted successfully!");
        fetchStocks();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= Number(pagination.totalPages)) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  return (
    <div className="container-fluid py-4 px-5 bg-white rounded-4 shadow-sm">
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">All Stocks</h3>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex">
          <button
            onClick={() => setShowAddStockModal(true)}
            className="btn btn-primary d-flex align-items-center"
          >
            <i className="bi bi-plus me-2"></i>
            Add Stock
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

      <div className="d-flex align-items-center mb-4">
        <div className="input-group me-3">
          <span className="input-group-text border-0 bg-white">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            id="productSearch"
            name="productName"
            value={filters.productName}
            onChange={handleFilterChange}
            placeholder="Search by product name..."
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
              <th>Product Code</th>
              <th>Product Name</th>
              <th>Total Stock (Kg)</th>
              <th>Remaining Stock (Kg)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stocks.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">
                  No stock entries found.
                </td>
              </tr>
            ) : (
              stocks.map((stock, index) => (
                <tr key={stock._id}>
                  <td>{index + 1}</td>
                  <td>{dayjs(stock.date).format("YYYY-MM-DD")}</td>
                  <td>{stock.product_code}</td>
                  <td>{stock.product_name}</td>
                  <td>{stock.totalStock}</td>
                  <td>{stock.remainStock}</td>
                  <td className="action-buttons">
                    <button
                      className="btn btn-light btn-sm border"
                      onClick={() => handleEditStock(stock)}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      className="btn btn-light btn-sm border"
                      onClick={() => handleDeleteStock(stock._id)}
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
        {stocks.length === 0 ? (
          <div className="alert alert-info text-center">
            No stock entries found.
          </div>
        ) : (
          stocks.map((stock) => (
            <div key={stock._id} className="card mb-3 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <small className="text-muted">Product</small>
                    <h5 className="card-title mb-0 fw-bold">
                      {stock.product_name} - {stock.product_code}
                    </h5>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-success">
                      Remaining: {stock.remainStock} Kg
                    </span>
                  </div>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Total</span>
                  <span>{stock.totalStock}Kg</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Date</span>
                  <span>{dayjs(stock.date).format("YYYY-MM-DD")}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-end">
                  <button
                    className="btn btn-light btn-sm border me-2"
                    onClick={() => handleEditStock(stock)}
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button
                    className="btn btn-light btn-sm border"
                    onClick={() => handleDeleteStock(stock._id)}
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
                onClick={() =>
                  handlePageChange(Number(pagination.currentPage) + 1)
                }
                aria-label="Next"
              >
                <span aria-hidden="true">Next</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Add Stock Modal */}
      <div
        className={`modal ${showAddStockModal ? "d-block" : "d-none"}`}
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add New Stock</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setShowAddStockModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleAddStockSubmit}>
                <div className="mb-3">
                  <label htmlFor="newStockProductCode" className="form-label">
                    Product:
                  </label>
                  <select
                    id="newStockProductCode"
                    name="productCode"
                    value={newStockInput.productCode}
                    onChange={handleNewStockInputChange}
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
                  <label htmlFor="newStockKg" className="form-label">
                    Stock Quantity (Kg):
                  </label>
                  <input
                    type="number"
                    id="newStockKg"
                    name="newStockKg"
                    value={newStockInput.newStockKg}
                    onChange={handleNewStockInputChange}
                    min="0.01"
                    step="0.01"
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="newStockDate" className="form-label">
                    Date:
                  </label>
                  <input
                    type="date"
                    id="newStockDate"
                    name="date"
                    value={newStockInput.date}
                    onChange={handleNewStockInputChange}
                    className="form-control"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(false)}
                  className="btn btn-secondary ms-2"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Stock Modal */}
      <div
        className={`modal ${showEditStockModal ? "d-block" : "d-none"}`}
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Stock</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setShowEditStockModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleUpdateStockSubmit}>
                <div className="mb-3">
                  <label htmlFor="editStockProductCode" className="form-label">
                    Product:
                  </label>
                  <select
                    id="editStockProductCode"
                    name="productCode"
                    value={currentStock?.productCode || ""}
                    onChange={handleUpdateStockChange}
                    className="form-select"
                    required
                    disabled // Product code should not be editable for an existing stock entry
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
                  <label htmlFor="editStockKg" className="form-label">
                    Total Stock Quantity (Kg):
                  </label>
                  <input
                    type="number"
                    id="editStockKg"
                    name="newStockKg" // Using newStockKg to hold the updated total stock
                    value={currentStock?.newStockKg || ""}
                    onChange={handleUpdateStockChange}
                    min="0.01"
                    step="0.01"
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editStockDate" className="form-label">
                    Date:
                  </label>
                  <input
                    type="date"
                    id="editStockDate"
                    name="date"
                    value={currentStock?.date || ""}
                    onChange={handleUpdateStockChange}
                    className="form-control"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Update Stock
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditStockModal(false)}
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

export default StocksPage;
