import { Button } from "react-bootstrap";
import GenericModal from "./GenericModal";

const ResendVerificationModal = ({
  show,
  onClose,
  message,
  secondsLeft,
  showCooldown = true,
}) => {
  const body = (
    <>
      <p className={showCooldown ? "mb-2" : "mb-0"}>{message}</p>
      {showCooldown && (
        <p className="mb-0 test-muted">
          {secondsLeft > 0
            ? `Kolejny linki możesz wysłać za ${secondsLeft} s.`
            : "Możesz teraz wysłać link ponownie."}
        </p>
      )}
    </>
  );

  const footer = (
    <Button variant="secondary" onClick={onClose}>
      Zamknij
    </Button>
  );

  return (
    <GenericModal
      show={show}
      onClose={onClose}
      title="Link weryfikacyjny"
      body={body}
      footer={footer}
    />
  );
};

export default ResendVerificationModal;
