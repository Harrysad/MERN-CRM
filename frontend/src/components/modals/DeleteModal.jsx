import { Button } from "react-bootstrap";
import GenericModal from "./GenericModal";

const DeleteModal = ({ show, onClose, onConfirm }) => {
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Anuluj
      </Button>
      <Button variant="danger" onClick={onConfirm}>
        Usuń
      </Button>
    </>
  );

  return (
    <GenericModal
      show={show}
      onClose={onClose}
      title="Potwierdzenie usunięcia"
      body="Czy na pewno chcesz usunąć?"
      footer={footer}
    />
  );
};

export default DeleteModal;
