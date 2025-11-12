import React, { useState } from "react";
import InventoryManager from "./pages/InventoryManager";
import SalesPage from "./pages/SalesPage";
import SalesReportPage from "./pages/SalesReportPage"; // Import the new report page
import "./styles.css";

function App() {
  const [activePage, setActivePage] = useState("sales"); // 'sales', 'products', or 'sales-report'

  return (
    <div className="app-container">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <a className="navbar-brand" href="/">
            SM
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav mb-2 mb-lg-0 flex-column flex-lg-row w-100">
              <li className="nav-item">
                <button
                  className={`nav-link d-flex align-items-center gap-2 ${
                    activePage === "sales" ? "active" : ""
                  }`}
                  onClick={() => setActivePage("sales")}
                >
                  <i className="bi bi-receipt"></i>
                  <span>Sales</span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link d-flex align-items-center gap-2 ${
                    activePage === "products" ? "active" : ""
                  }`}
                  onClick={() => setActivePage("products")}
                >
                  <i className="bi bi-box-seam"></i>
                  <span>Products</span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link d-flex align-items-center gap-2 ${
                    activePage === "sales-report" ? "active" : ""
                  }`}
                  onClick={() => setActivePage("sales-report")}
                >
                  <i className="bi bi-file-earmark-bar-graph"></i>
                  <span>Sales Report</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <div className="main-content">
        {activePage === "sales" && <SalesPage />}
        {activePage === "products" && <InventoryManager />}
        {activePage === "sales-report" && <SalesReportPage />}
      </div>
    </div>
  );
}

export default App;
