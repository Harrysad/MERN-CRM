import { useState, useEffect } from "react";
import { useNavigate, useParams, NavLink } from "react-router-dom";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import { FormControl } from "react-bootstrap";
import { addCustomer, getCustomer, updateCustomer } from "../apiService/customer/apiCustomer";
import { extractCodeNumbers, formatNipCode, formatZipCode } from "../helpers/helpers";

const CustomerForm = ({ getCustomers }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    address: { street: "", suite: "", city: "", postcode: "" },
    nip: "",
  });

  useEffect(() => {
    if (id) {
      getCustomer(id)
        .then((c) => {
          setFormData({
            ...c,
            address: { ...c.address, postcode: formatZipCode(c.address.postcode) },
            nip: formatNipCode(c.nip),
          });
        })
        .catch(console.error);
    }
  }, [id]);

  const handleChange = (e) => {
    setError("");
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [key]: key === "postcode" ? formatZipCode(value) : value,
        },
      }));
    } else if (name === "nip") {
      setFormData((prev) => ({ ...prev, nip: formatNipCode(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const postcode = extractCodeNumbers(formData.address.postcode);
    const nip = extractCodeNumbers(formData.nip);
    const payload = { ...formData, address: { ...formData.address, postcode }, nip };

    const req = id ? updateCustomer(id, payload) : addCustomer(payload);
    req
      .then(() => { navigate("/"); getCustomers(); })
      .catch((err) => {
        if (err.response?.status === 409 || err.response?.status === 500) {
          setError("Podany NIP już istnieje w bazie danych.");
        } else {
          console.error(err);
        }
      });
  };

  return (
    <>
      <div className="page-header">
        <div>
          <NavLink to="/" className="d-inline-flex align-items-center gap-1 mb-2"
            style={{ fontSize: "0.8rem", color: "var(--crm-text-muted)", textDecoration: "none" }}>
            <i className="fa-solid fa-chevron-left"></i>
            Powrót do listy
          </NavLink>
          <h1 className="page-header__title">
            <i className={`fa-solid ${id ? "fa-pen-to-square" : "fa-user-plus"}`}></i>
            {id ? "Edytuj klienta" : "Dodaj nowego klienta"}
          </h1>
        </div>
      </div>

      <div className="form-card">
        <div className="form-card__header">
          <div className="form-card__title">
            <i className="fa-solid fa-building"></i>
            Dane firmy
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-card__body">
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" role="alert">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </div>
            )}

            <div className="form-section-label">Informacje podstawowe</div>

            <FloatingLabel label="Nazwa firmy" className="mb-3">
              <FormControl
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nazwa firmy"
                required
              />
            </FloatingLabel>

            <FloatingLabel label="NIP" className="mb-4">
              <FormControl
                type="text"
                name="nip"
                value={formData.nip}
                onChange={handleChange}
                placeholder="NIP"
                required
              />
            </FloatingLabel>

            <div className="form-section-label">Adres</div>

            <div className="row g-3">
              <div className="col-sm-8">
                <FloatingLabel label="Ulica">
                  <FormControl
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    placeholder="Ulica"
                    required
                  />
                </FloatingLabel>
              </div>
              <div className="col-sm-4">
                <FloatingLabel label="Nr lokalu">
                  <FormControl
                    type="text"
                    name="address.suite"
                    value={formData.address.suite}
                    onChange={handleChange}
                    placeholder="Nr lokalu"
                    required
                  />
                </FloatingLabel>
              </div>
              <div className="col-sm-8">
                <FloatingLabel label="Miasto">
                  <FormControl
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    placeholder="Miasto"
                    required
                  />
                </FloatingLabel>
              </div>
              <div className="col-sm-4">
                <FloatingLabel label="Kod pocztowy">
                  <FormControl
                    type="text"
                    name="address.postcode"
                    value={formData.address.postcode}
                    onChange={handleChange}
                    placeholder="Kod pocztowy"
                    required
                  />
                </FloatingLabel>
              </div>
            </div>
          </div>

          <div className="form-card__footer">
            <NavLink to="/" className="btn btn-outline-secondary d-flex align-items-center gap-2">
              <i className="fa-solid fa-xmark"></i>
              Anuluj
            </NavLink>
            <button type="submit" className="btn btn-primary d-flex align-items-center gap-2">
              <i className={`fa-solid ${id ? "fa-floppy-disk" : "fa-user-plus"}`}></i>
              {id ? "Zapisz zmiany" : "Dodaj klienta"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CustomerForm;
