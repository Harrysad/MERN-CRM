import { Button } from "react-bootstrap";
import GenericModal from "./GenericModal";

const ResendVerificationModal = ({ show, onClose, message, secondsLeft }) => {
    const body = (
        <>
            <p className="mb-2">{message}</p>
            <p className="mb-0 test-muted">
                {secondsLeft > 0
                    ? `Kolejny linki możesz wysłać za ${secondsLeft} s.`
                    : "Możesz teraz wysłać link ponownie."}
            </p>
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