import { useEffect, useState } from "react";
import { Route, Routes, Navigate, useNavigate, NavLink } from "react-router-dom";
import "./App.css";

import { getCustomers } from "./apiService/customer/apiCustomer";
import CustomerDetails from "./components/CustomerDetails";
import CustomerForm from "./components/CustomerForm";
import CustomerList from "./components/CustomerList";
import { SignUpSignIn } from "./components/SignUpSignIn";
import Pagination from "./components/Pagination";
import { deleteCookie, getCookie } from "./helpers/helpers";

const ProtectedRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/home" replace />;
  return children;
};

const CUSTOMER_DATA_LIMIT = 7;

function App() {
  const [user, setUser] = useState(JSON.parse(getCookie("user") || "null"));
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      document.body.classList.add("logged-in");
      document.body.classList.remove("login-page");
    } else {
      document.body.classList.remove("logged-in");
      document.body.classList.add("login-page");
    }
  }, [user]);

  const [customers, setCustomers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const handleSortChange = (e) => setSortField(e.target.value);
  const toggleSortOrder = () =>
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));

  const handleGetCustomers = (page = currentPage, limit = CUSTOMER_DATA_LIMIT) => {
    getCustomers(page, limit, sortField, sortOrder).then((res) => {
      setCustomers(res.data);
      setTotalCustomers(res.total);
      setCurrentPage(res.page);
    });
  };

  useEffect(() => {
    if (user) handleGetCustomers();
  }, [user, sortField, sortOrder]);

  const handleLogOut = (e) => {
    e.preventDefault();
    setUser(null);
    deleteCookie("user");
    navigate("/Home");
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="App">
      {user && (
        <nav className="crm-navbar">
          <NavLink className="crm-navbar__brand" to="/" onClick={closeMenu}>
            <div className="crm-navbar__brand-icon">
              <i className="fa-solid fa-chart-line"></i>
            </div>
            <span className="crm-navbar__brand-text">
              CRM<span>Pro</span>
            </span>
          </NavLink>

          <div className="crm-navbar__divider" />

          <div className={`crm-navbar__nav${menuOpen ? " open" : ""}`}>
            <NavLink to="/" className="crm-navbar__link" onClick={closeMenu} end>
              <i className="fa-solid fa-users"></i>
              Klienci
            </NavLink>
            <NavLink to="/customers/add" className="crm-navbar__link" onClick={closeMenu}>
              <i className="fa-solid fa-user-plus"></i>
              Dodaj klienta
            </NavLink>
          </div>

          <div className="crm-navbar__right">
            <a href="/Home" className="crm-navbar__logout" onClick={handleLogOut}>
              <i className="fa-solid fa-right-from-bracket"></i>
              Wyloguj
            </a>
            <button
              className="crm-navbar__toggle"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
            >
              <i className={`fa-solid ${menuOpen ? "fa-xmark" : "fa-bars"}`}></i>
            </button>
          </div>
        </nav>
      )}

      <Routes>
        <Route path="/Home" element={<SignUpSignIn setUser={setUser} />} />
        <Route
          path="/"
          element={
            <ProtectedRoute user={user}>
              <div className="main-content">
                <CustomerList
                  customers={customers}
                  totalCustomers={totalCustomers}
                  handleGetCustomers={handleGetCustomers}
                  handleSortChange={handleSortChange}
                  toggleSortOrder={toggleSortOrder}
                  sortField={sortField}
                  sortOrder={sortOrder}
                />
                <Pagination
                  dataPerPage={CUSTOMER_DATA_LIMIT}
                  totalData={totalCustomers}
                  currentPage={currentPage}
                  paginate={(page) => handleGetCustomers(page)}
                />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/add"
          element={
            <ProtectedRoute user={user}>
              <div className="main-content">
                <CustomerForm getCustomers={handleGetCustomers} />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/edit/:id"
          element={
            <ProtectedRoute user={user}>
              <div className="main-content">
                <CustomerForm getCustomers={handleGetCustomers} />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <ProtectedRoute user={user}>
              <div className="main-content">
                <CustomerDetails />
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
