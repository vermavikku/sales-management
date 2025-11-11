import React, { useState, useEffect } from "react";
import api from "../services/api";
import clsx from "clsx";

function InventoryManager() {
  const [products, setProducts] = useState([]);
  const [productName, setProductName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [error, setError] = useState(null); // For general component errors
  const [success, setSuccess] = useState(null); // For general component success messages
  const [addModalError, setAddModalError] = useState(null); // For Add Product Modal errors
  const [addModalSuccess, setAddModalSuccess] = useState(null); // For Add Product Modal success messages
  const [editModalError, setEditModalError] = useState(null); // For Edit Product Modal errors
  const [editModalSuccess, setEditModalSuccess] = useState(null); // For Edit Product Modal success messages
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  });

  useEffect(() => {
    fetchProducts();
  }, [pagination.currentPage, pagination.limit, searchQuery]);

  const fetchProducts = async () => {
    try {
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        search: searchQuery,
      };
      const data = await api.get("/products", params);
      setProducts(data.products);
      setPagination((prev) => ({
        ...prev,
        totalPages: data.totalPages,
        currentPage: data.currentPage,
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditProduct = (product) => {
    setCurrentProduct(product);
    setShowEditProductModal(true);
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setError(null);
      setSuccess(null);
      try {
        await api.delete(`/products/${id}`);
        setSuccess("Product deleted successfully!");
        fetchProducts();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleUpdateProductChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProductSubmit = async (e) => {
    e.preventDefault();
    setEditModalError(null);
    setEditModalSuccess(null);
    try {
      await api.put(`/products/${currentProduct._id}`, currentProduct);
      setEditModalSuccess("Product updated successfully!");
      setShowEditProductModal(false);
      setCurrentProduct(null);
      fetchProducts();
    } catch (err) {
      setEditModalError(err.message);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setAddModalError(null);
    setAddModalSuccess(null);
    try {
      const newProduct = {
        name: productName,
        code: productCode,
      };
      await api.post("/products", newProduct);
      setProductName("");
      setProductCode("");
      setAddModalSuccess("Product added successfully!");
      setShowAddProductModal(false);
      fetchProducts();
    } catch (err) {
      setAddModalError(err.message);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  return (
    <div className="container-fluid py-4 px-5 bg-white rounded-4 shadow-sm">
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">Product List</h3>
        <button
          onClick={() => setShowAddProductModal(true)}
          className="btn btn-primary d-flex align-items-center"
        >
          <i className="bi bi-plus me-2"></i>
          Add New Product
        </button>
      </div>

      <div className="d-flex align-items-center mb-4">
        <div className="input-group me-3">
          <span className="input-group-text border-0 bg-white">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            id="searchQuery"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by code or name..."
            className="form-control border-1 shadow-sm"
            style={{ borderRadius: "0 0.375rem 0.375rem 0" }}
          />
        </div>
        <button
          onClick={() => setSearchQuery("")}
          className="btn btn-light d-flex align-items-center shadow-sm border"
        >
          <i className="bi bi-x-lg me-2"></i>
          Clear
        </button>
      </div>

      <div className="table-responsive mb-4">
        <table className="table table-striped table-hover">
          <thead className="table-light">
            <tr>
              <th>Sr No.</th>
              <th>Name</th>
              <th>Code</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr key={product._id}>
                  <td>{index + 1}</td>
                  <td>{product.name}</td>
                  <td>{product.code}</td>
                  <td className="action-buttons">
                    <button
                      className="btn btn-light btn-sm me-2 border"
                      onClick={() => handleEditProduct(product)}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      className="btn btn-light btn-sm border"
                      onClick={() => handleDeleteProduct(product._id)}
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
                onClick={() => handlePageChange(pagination.currentPage - 1)}
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
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                aria-label="Next"
              >
                <span aria-hidden="true">Next</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Add Product Modal */}
      <div
        className={`modal ${showAddProductModal ? "d-block" : "d-none"}`}
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add New Product</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => {
                  setShowAddProductModal(false);
                  setAddModalError(null);
                  setAddModalSuccess(null);
                }}
              ></button>
            </div>
            <div className="modal-body">
              {addModalError && (
                <div className="alert alert-danger">{addModalError}</div>
              )}
              {addModalSuccess && (
                <div className="alert alert-success">{addModalSuccess}</div>
              )}
              <form onSubmit={handleAddProduct}>
                <div className="mb-3">
                  <label htmlFor="productName" className="form-label">
                    Product Name:
                  </label>
                  <input
                    type="text"
                    id="productName"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="productCode" className="form-label">
                    Product Code (Unique):
                  </label>
                  <input
                    type="text"
                    id="productCode"
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Add Product
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProductModal(false);
                    setAddModalError(null);
                    setAddModalSuccess(null);
                  }}
                  className="btn btn-secondary ms-2"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Product Modal */}
      <div
        className={`modal ${showEditProductModal ? "d-block" : "d-none"}`}
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Product</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => {
                  setShowEditProductModal(false);
                  setEditModalError(null);
                  setEditModalSuccess(null);
                }}
              ></button>
            </div>
            <div className="modal-body">
              {editModalError && (
                <div className="alert alert-danger">{editModalError}</div>
              )}
              {editModalSuccess && (
                <div className="alert alert-success">{editModalSuccess}</div>
              )}
              <form onSubmit={handleUpdateProductSubmit}>
                <div className="mb-3">
                  <label htmlFor="editProductName" className="form-label">
                    Product Name:
                  </label>
                  <input
                    type="text"
                    id="editProductName"
                    name="name"
                    value={currentProduct?.name || ""}
                    onChange={handleUpdateProductChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editProductCode" className="form-label">
                    Product Code (Unique):
                  </label>
                  <input
                    type="text"
                    id="editProductCode"
                    name="code"
                    value={currentProduct?.code || ""}
                    onChange={handleUpdateProductChange}
                    className="form-control"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Update Product
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProductModal(false);
                    setEditModalError(null);
                    setEditModalSuccess(null);
                  }}
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

export default InventoryManager;
