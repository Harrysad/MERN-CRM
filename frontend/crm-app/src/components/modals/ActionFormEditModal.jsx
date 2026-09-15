import { Button } from "react-bootstrap";
import GenericModal from "./GenericModal";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import { FormControl } from "react-bootstrap";

const ActionFormEditModal = ({
  show,
  onClose,
  onChange,
  value,
  onConfirm,
  actionId,
}) => {
  const title = `Edycja akcji nr. ${value.index}`;
  const body = (
    <>
      <FloatingLabel
        controlId="floatingInput"
        label="Typ akcji"
        className="mb-3"
      >
        <FormControl
          type="text"
          name="type"
          value={value.type}
          onChange={onChange}
          placeholder="Typ akcji"
          required
        />
      </FloatingLabel>
      <FloatingLabel controlId="floatingInput" label="Opis" className="mb-3">
        <FormControl
          type="text"
          name="description"
          value={value.description}
          onChange={onChange}
          placeholder="Typ akcji"
          required
        />
      </FloatingLabel>
      <FloatingLabel controlId="floatingInput" label="Data" className="mb-3">
        <FormControl
          type="date"
          name="date"
          value={value.date}
          onChange={onChange}
          placeholder="Data"
          required
        />
      </FloatingLabel>
    </>
  );
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Anuluj
      </Button>
      <Button variant="success" onClick={onConfirm(actionId)}>
        Zapisz
      </Button>
    </>
  );
  console.log(value);
  console.log("test");

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

export default ActionFormEditModal;
