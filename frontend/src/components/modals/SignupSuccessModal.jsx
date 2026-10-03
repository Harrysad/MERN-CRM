import { Button } from "react-bootstrap";
import GenericModal from "./GenericModal";

const SignupSuccessModal = ({ show, onClose, email }) => {
  const body = (
    <>
      <p className="mb-2">
        Wysłaliśmy link aktywacyjny na adres <strong>{email}</strong>
      </p>
      <p className="mb-0 text-muted">
        KLiknij go, aby potwierdzić konto. Jeśli widomość nie dotrze, sprawdź
        folder ze spamem. Jeśli e-mail nie dotarł to zalogowaniu możesz poprosić
        o ponowne wysłanie linku.
      </p>
    </>
  );

  const footer = (
    <Button vartiant="primary" onClick={onClose}>
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
