import { Button } from "react-bootstrap";
import GenericModal from "./GenericModal";

const DeleteModal = ({ show, onClose, onConfirm, isViewer }) => {
  const footer = isViewer ? (
    <Button variant="secondary" onClick={onClose}>
      Zamknij
    </Button>
  ) : (
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
      body={
        isViewer
        ? "Konto demo jest tylko do odczytu - usuwanie danych jest wyłączone."
        : "Czy na pewno chcesz usunąć?"
      }
      footer={footer}
    />
  );
};

export default DeleteModal;
