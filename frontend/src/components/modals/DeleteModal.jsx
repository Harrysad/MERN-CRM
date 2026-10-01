import { Button } from "react-bootstrap";
import GenericModal from "./GenericModal";
import { getWriteBlockMessage } from "../../helpers/helpers";

const DeleteModal = ({ show, onClose, onConfirm, isViewer, isVerified }) => {
  const blockMessage = getWriteBlockMessage(isViewer, isVerified);

  const footer = blockMessage ? (
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
      body={blockMessage || "Czy na pewno chcesz usunąć?"
      }
      footer={footer}
    />
  );
};

export default DeleteModal;
