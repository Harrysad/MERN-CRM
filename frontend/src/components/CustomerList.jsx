import { useState } from "react";
import { NavLink } from "react-router-dom";
import { deleteCustomer } from "../apiService/customer/apiCustomer";
import { formatZipCode, formatNipCode } from "../helpers/helpers";
import DeleteModal from "./modals/DeleteModal";
import CustomerToolbar from "./CustomerToolbar";

const CustomerList = ({
  customers,
  totalCustomers,
  handleGetCustomers,
  handleSortChange,
  toggleSortOrder,
  sortField,
  sortOrder,
  searchTerm,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  isViewer,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const handleDelete = () => {
    if (!selectedCustomerId) return;
    deleteCustomer(selectedCustomerId)
      .then((res) => {
        if (res.deleted) {
          handleGetCustomers();
          setModalVisible(false);
          setSelectedCustomerId(null);
        }
      })
      .catch(console.error);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">
            <i className="fa-solid fa-users"></i>
            Baza klientów
          </h1>
          <p className="page-header__subtitle">
            {totalCustomers != null ? `${totalCustomers} klientów łącznie` : ""}
          </p>
        </div>
        <NavLink
          to="/customers/add"
          className="btn btn-primary d-flex align-items-center gap-2 crm-icon-btn"
          aria-label="Dodaj klienta"
          title="Dodaj klienta"
        >
          <i className="fa-solid fa-user-plus"></i>
          <span className="crm-icon-btn__label">Dodaj klienta</span>
        </NavLink>
      </div>

      <div className="crm-card mb-3">
        <div className="crm-card__header">
          <CustomerToolbar
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            sortField={sortField}
            onSortChange={handleSortChange}
            sortOrder={sortOrder}
            onToggleSortOrder={toggleSortOrder}
            pageSize={pageSize}
            onPageSizeChange={onPageSizeChange}
          />
        </div>

        <div className="crm-table-wrapper" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
          <table className="crm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nazwa firmy</th>
                <th>Adres</th>
                <th>NIP</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2.5rem", color: "var(--crm-text-muted)" }}>
                    <i className="fa-solid fa-inbox fa-2x mb-2 d-block"></i>
                    Brak klientów
                  </td>
                </tr>
              ) : (
                customers.map((row, index) => (
                  <tr key={row._id}>
                    <td className="row-index">{index + 1}</td>
                    <td className="company-name">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: "var(--crm-primary-light)",
                          color: "var(--crm-primary)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
                        }}>
                          {row.name.charAt(0).toUpperCase()}
                        </div>
                        {row.name}
                      </div>
                    </td>
                    <td className="address-cell">
                      <i className="fa-solid fa-location-dot me-1" style={{ color: "var(--crm-text-muted)" }}></i>
                      {formatZipCode(row.address.postcode)} {row.address.city}
                      <br />
                      <span style={{ paddingLeft: "1rem" }}>
                        {row.address.street} {row.address.suite}
                      </span>
                    </td>
                    <td className="nip-cell">{formatNipCode(row.nip)}</td>
                    <td className="actions-cell">
                      <div className="btn-actions-group">
                        <NavLink
                          to={`/customers/${row._id}`}
                          className="btn-icon btn-icon--view"
                          title="Szczegóły"
                        >
                          <i className="fa-solid fa-eye"></i>
                        </NavLink>
                        <NavLink
                          to={`/customers/edit/${row._id}`}
                          className="btn-icon btn-icon--edit"
                          title="Edytuj"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </NavLink>
                        <button
                          className="btn-icon btn-icon--delete"
                          title="Usuń"
                          onClick={() => {
                            setSelectedCustomerId(row._id);
                            setModalVisible(true);
                          }}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="crm-mobile-list">
          {customers.length === 0 ? (
            <div className="crm-mobile-empty">
              <i className="fa-solid fa-inbox fa-2x mb-2 d-block"></i>
              Brak klientów
            </div>
          ) : (
            customers.map((row) => (
              <div className="crm-mobile-card" key={row._id}>
                <NavLink to={`/customers/${row._id}`} className="crm-mobile-card__main">
                  <div className="crm-mobile-card__avatar">
                    {row.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="crm-mobile-card__info">
                    <div className="crm-mobile-card__name">{row.name}</div>
                    <div className="crm-mobile-card__nip">{formatNipCode(row.nip)}</div>
                  </div>
                </NavLink>
                <div className="btn-actions-group">
                  <NavLink
                    to={`/customers/${row._id}`}
                    className="btn-icon btn-icon--view"
                    title="Szczegóły"
                  >
                    <i className="fa-solid fa-eye"></i>
                  </NavLink>
                  <NavLink
                    to={`/customers/edit/${row._id}`}
                    className="btn-icon btn-icon--edit"
                    title="Edytuj"
                  >
                    <i className="fa-solid fa-pen"></i>
                  </NavLink>
                  <button
                    className="btn-icon btn-icon--delete"
                    title="Usuń"
                    onClick={() => {
                      setSelectedCustomerId(row._id);
                      setModalVisible(true);
                    }}
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>



      <DeleteModal
        show={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={handleDelete}
        isViewer={isViewer}
      />
    </>
  );
};

export default CustomerList;