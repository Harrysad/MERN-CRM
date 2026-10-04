import { Button } from "react-bootstrap";
import GenericModal from "./GenericModal";

const SignupSuccessModal = ({ show, onClose, email }) => {
  const body = (
    <>
      <p className="mb-2">
        Wysłaliśmy link aktywacyjny na adres <strong>{email}</strong>
      </p>
      <p className="mb-2 text-muted">
        Kliknij go, aby potwierdzić konto. Jeśli wiadomość nie dotrze, sprawdź
        folder ze spamem. Po zalogowaniu możesz też poprosić o ponowne wysłanie
        linku.
      </p>
      <p className="mb-0 text-muted small">
        To aplikacja demonstracyjna - konto wraz ze wszystkimi danymi zostanie
        automatycznie usunięte po 3 dniach.
      </p>
    </>
  );

  const footer = (
    <Button variant="primary" onClick={onClose}>
      Rozumiem
    </Button>
  );

  return (
    <GenericModal
      show={show}
      onClose={onClose}
      title="Konto zostało utworzone"
      body={body}
      footer={footer}
    />
  );
};

export default SignupSuccessModal;
