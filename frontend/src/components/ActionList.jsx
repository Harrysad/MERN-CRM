import { useEffect, useState } from "react";
import { deleteAction, updateAction } from "../apiService/action/apiActions";
import DeleteModal from "./modals/DeleteModal";
import ActionFormModal from "./modals/ActionFormModal";

const TYPE_BADGE = {
  Telefon:       { cls: "phone",   icon: "fa-phone" },
  Spotkanie:     { cls: "meeting", icon: "fa-handshake" },
  Mail:          { cls: "email",   icon: "fa-envelope" },
  "Wideo rozmowa": { cls: "video", icon: "fa-video" },
};

const ActionBadge = ({ type }) => {
  const meta = TYPE_BADGE[type] ?? { cls: "default", icon: "fa-circle-dot" };
  return (
    <span className={`action-badge ${meta.cls}`}>
      <i className={`fa-solid ${meta.icon}`}></i>
      {type}
    </span>
  );
};

const ActionList = ({ handleGetActions, customerName, allActions }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEditVisible, setModalEditVisible] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState(null);
  const [editAction, setEditAction] = useState({
    _id: "", type: "", description: "", date: "", customer: "",
  });

  useEffect(() => {
    if (selectedActionId) {
      const found = allActions.find((a) => a._id === selectedActionId);
      if (found) setEditAction(found);
    }
  }, [selectedActionId, allActions]);

  const handleDelete = () => {
    if (!selectedActionId) return;
    deleteAction(selectedActionId)
      .then((res) => {
        if (res.deleted) {
          setModalVisible(false);
          handleGetActions();
        }
      })
      .catch(console.error);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditAction((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    updateAction(selectedActionId, editAction)
      .then(() => {
        setModalEditVisible(false);
        handleGetActions();
      })
      .catch(console.error);
  };

  return (
    <>
      {allActions.length === 0 ? (
        <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--crm-text-muted)" }}>
          <i className="fa-solid fa-inbox fa-2x mb-2 d-block"></i>
          Brak akcji — dodaj pierwszą interakcję z klientem
        </div>
      ) : (
        <div className="crm-table-wrapper" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
          <table className="crm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Typ</th>
                <th>Opis</th>
                <th>Data</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {allActions.map((row, index) => (
                <tr key={row._id}>
                  <td className="row-index">{index + 1}</td>
                  <td><ActionBadge type={row.type} /></td>
                  <td style={{ maxWidth: 280 }}>{row.description}</td>
                  <td style={{ whiteSpace: "nowrap", color: "var(--crm-text-muted)", fontSize: "0.825rem" }}>
                    <i className="fa-regular fa-calendar me-1"></i>
                    {row.date.slice(0, 10)}
                  </td>
                  <td className="actions-cell">
                    <div className="btn-actions-group">
                      <button
                        className="btn-icon btn-icon--edit"
                        title="Edytuj"
                        onClick={() => {
                          setSelectedActionId(row._id);
                          setModalEditVisible(true);
                        }}
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button
                        className="btn-icon btn-icon--delete"
                        title="Usuń"
                        onClick={() => {
                          setSelectedActionId(row._id);
                          setModalVisible(true);
                        }}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DeleteModal
        show={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={handleDelete}
      />

      <ActionFormModal
        show={modalEditVisible}
        onClose={() => setModalEditVisible(false)}
        handleChange={handleEditChange}
        value={editAction}
        onConfirm={handleSubmit}
        customerName={customerName}
        formMode="edit"
        handleGetActions={handleGetActions}
      />
    </>
  );
};

export default ActionList;
