import { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import GenericModal from './GenericModal'; 1

const SessionTimeoutModal = ({ show, secondsUntilLogout, onStay, onLogout }) => {
    const [secondsLeft, setSecondsLeft] = useState(secondsUntilLogout);

    useEffect(() => {
        if (!show) return undefined;
        setSecondsLeft(secondsUntilLogout);
        const interval = setInterval(() => {
            setSecondsLeft((perv) => Math.max(perv - 1, 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [show, secondsUntilLogout]);

    const footer = (
        <>
        <Button variant="danger" onClick={onLogout}>
            Wyloguj teraz
        </Button>
        <Button variant="primary" onClick={onStay}>
            Pozostań zalogowany
        </Button>
        </>
    );

    return (
        <GenericModal
            show={show}
            onClose={onStay}
            title="Sesja zaraz wygaśnie"
            body={`Zostaniesz automatycznie wylogowany po ${secondsLeft} sekundach braku aktywności.`}
            footer={footer}
        />
    );
};

export default SessionTimeoutModal;