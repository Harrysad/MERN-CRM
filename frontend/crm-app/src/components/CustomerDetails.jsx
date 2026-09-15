import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import { getCustomer } from "../apiService/customer/apiCustomer";
import ActionList from "./ActionList";
import { addAction, getActions } from "../apiService/action/apiActions";
import ActionFormModal from "./modals/ActionFormModal";
import Pagination from "./Pagination";
import { formatNipCode, formatZipCode } from "../helpers/helpers";

const ACTION_INIT_FORM_DATA = { type: "", description: "", date: "" };
const ACTION_DATA_LIMIT = 4;

function CustomerDetails() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newAction, setNewAction] = useState(ACTION_INIT_FORM_DATA);
  const [allActions, setAllActions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalActions, setTotalActions] = useState(0);

  const getCustomerData = () => {
    getCustomer(id)
      .then((c) => {
        setCustomer({
          ...c,
          address: { ...c.address, postcode: formatZipCode(c.address.postcode) },
          nip: formatNipCode(c.nip),
        });
      })
      .catch(console.error);
  };

  const handleGetActions = (page = currentPage, limit = ACTION_DATA_LIMIT) => {
    getActions(id, page, limit).then((res) => {
      setAllActions(res?.data);
      setTotalActions(res?.totalActions);
      setCurrentPage(res?.page);
    });
  };

  useEffect(() => {
    getCustomerData();
    if (id) handleGetActions(1, ACTION_DATA_LIMIT);
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewAction((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    addAction({ ...newAction, customer: id })
      .then(() => {
        handleGetActions();
        setModalVisible(false);
        setNewAction(ACTION_INIT_FORM_DATA);
      })
      .catch(console.error);
  };

  const initials = customer?.name
    ? customer.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/" className="d-inline-flex align-items-center gap-1 mb-2"
            style={{ fontSize: "0.8rem", color: "var(--crm-text-muted)", textDecoration: "none" }}>
            <i className="fa-solid fa-chevron-left"></i>
            Powrót do listy klientów
          </Link>
          <h1 className="page-header__title">
            <i className="fa-solid fa-building"></i>
            {customer?.name ?? "…"}
          </h1>
        </div>
        <div className="d-flex gap-2">
          <Link to={`/customers/edit/${id}`} className="btn btn-outline-primary d-flex align-items-center gap-2">
            <i className="fa-solid fa-pen"></i>
            Edytuj
          </Link>
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => setModalVisible(true)}
          >
            <i className="fa-solid fa-plus"></i>
            Dodaj akcję
          </button>
        </div>
      </div>

      <div className="customer-details">
        {/* Left: Company info */}
        <div className="customer-info-card">
          <div className="customer-info-card__header">
            <div className="customer-avatar">{initials}</div>
            <div className="customer-info-card__name">{customer?.name}</div>
          </div>
          <div className="customer-info-card__body">
            <div className="info-row">
              <div className="info-row__icon"><i className="fa-solid fa-road"></i></div>
              <div>
                <div className="info-row__label">Ulica</div>
                <div className="info-row__value">
                  {customer?.address?.street} {customer?.address?.suite}
                </div>
              </div>
            </div>
            <div className="info-row">
              <div className="info-row__icon"><i className="fa-solid fa-envelope-open-text"></i></div>
              <div>
                <div className="info-row__label">Kod pocztowy</div>
                <div className="info-row__value">{customer?.address?.postcode}</div>
              </div>
            </div>
            <div className="info-row">
              <div className="info-row__icon"><i className="fa-solid fa-city"></i></div>
              <div>
                <div className="info-row__label">Miasto</div>
                <div className="info-row__value">{customer?.address?.city}</div>
              </div>
            </div>
            <div className="info-row">
              <div className="info-row__icon"><i className="fa-solid fa-hashtag"></i></div>
              <div>
                <div className="info-row__label">NIP</div>
                <div className="info-row__value" style={{ fontFamily: "monospace" }}>
                  {customer?.nip}
                </div>
              </div>
            </div>
            <div className="info-row">
              <div className="info-row__icon"><i className="fa-solid fa-timeline"></i></div>
              <div>
                <div className="info-row__label">Liczba akcji</div>
                <div className="info-row__value" style={{ color: "var(--crm-primary)", fontWeight: 700 }}>
                  {totalActions}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="customer-actions-panel">
          <div className="crm-card">
            <div className="crm-card__header">
              <span className="crm-card__title">
                <i className="fa-solid fa-clock-rotate-left"></i>
                Historia akcji
              </span>
              <button
                className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                onClick={() => setModalVisible(true)}
              >
                <i className="fa-solid fa-plus"></i>
                Dodaj
              </button>
            </div>
            <ActionList
              handleGetActions={handleGetActions}
              customerName={customer?.name}
              allActions={allActions}
            />
            <div style={{ padding: "0 0.5rem" }}>
              <Pagination
                dataPerPage={ACTION_DATA_LIMIT}
                totalData={totalActions}
                currentPage={currentPage}
                paginate={(page) => handleGetActions(page)}
              />
            </div>
          </div>
        </div>
      </div>

      <ActionFormModal
        show={modalVisible}
        onClose={() => setModalVisible(false)}
        handleChange={handleChange}
        value={newAction}
        onConfirm={handleSubmit}
        customerName={customer?.name}
      />
    </>
  );
}

export default CustomerDetails;
