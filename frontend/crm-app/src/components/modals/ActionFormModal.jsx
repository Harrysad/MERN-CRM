import { Alert, Button } from "react-bootstrap";
import GenericModal from "./GenericModal";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import { FormControl } from "react-bootstrap";
import { Form } from "react-bootstrap";
import { useState } from "react";
const ActionFormModal = ({
  show,
  onClose,
  handleChange,
  value,
  onConfirm,
  customerName,
  formMode,
}) => {
  const [error, setError] = useState("");

  const title =
    formMode === "edit"
      ? `Edycja akcji dla ${customerName}`
      : `Dodawanie nowej akcji dla ${customerName}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.type || !value.description || !value.date) {
      setError("All fields required!!");
      return;
    }
    setError("");
    onConfirm();

  };

  const actionTypes = [
    {value: "Telefon", label: "Telefon"},
    {value: "Spotkanie", label: "Spotkanie"},
    {value: "Mail", label: "Mail"},
    {value: "Wideo rozmowa", label: "Wideo rozmowa"},
  ];

  const body = (
    <>
      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}
      <Form>
        <FloatingLabel
          controlId="floatingSelect"
          label="Typ akcji"
          className="mb-3"
        >
          <FormControl
            as="select"
            name="type"
            value={value.type}
            onChange={handleChange}
            placeholder="Typ akcji"
            required
          >
            <option value="">Wybierz typ akcji</option>
            {actionTypes.map((action) => (
              <option key={action.value} value={action.value}>
                {action.label}
              </option>
            ))}
            </FormControl>
        </FloatingLabel>
        <FloatingLabel controlId="floatingInput" label="Opis" className="mb-3">
          <FormControl
            type="text"
            name="description"
            value={value.description}
            onChange={handleChange}
            placeholder="Typ akcji"
            required
          />
        </FloatingLabel>
        <FloatingLabel controlId="floatingInput" label="Data" className="mb-3">
          <FormControl
            type="date"
            name="date"
            value={value.date.slice(0, 10)}
            onChange={handleChange}
            placeholder="Data"
            required
          />
        </FloatingLabel>
      </Form>
    </>
  );
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Anuluj
      </Button>
      <Button variant="success" onClick={handleSubmit}>
        {formMode === "edit" ? "Zapisz zmiany" : "Dodaj"}
      </Button>
    </>
  );

  return (
    <GenericModal
      show={show}
      onClose={onClose}
      title={title}
      body={body}
      footer={footer}
    />
  );
};

export default ActionFormModal;
