import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { verifyEmail } from "../apiService/user/apiUser";

function VerifyEmail() {
    const { token } = useParams();
    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        verifyEmail(token)
            .then((res) => {
                setStatus("success");
                setMessage(res.message || "Adres e-mail został potwierdzony.")
            })
            .catch((err) => {
                setStatus("error");
                setMessage(
                    err.response?.data?.message || "Nie udało się potwierdzić adresu e-mail. Link mógł już zostać użyty lub wygasł."
                );
            });
    }, [token]);

    return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", padding: "1.5rem" }}>
            <div className="form-card" style={{ maxWidth: 420, width: "100%", textAlign: "center", padding: "2rem" }}>
                {status === "loading" && (
                    <>
                        <div className="spinner-border text-primary mb-3" role="status"></div>
                        <p>Weryfikowanie adresu e-mail...</p>
                    </>
                )}
                {status === "success" && (
                    <>
                        <i className="fa-solid fa-circle-check fa-2x mb-3" style={{ color: "#16a34a" }}></i>
                        <p>{message}</p>
                        <Link to="/" className="btn btn-primary mt-2">Przejdź do aplikacji</Link>
                    </>
                )}
                {status === "error" && (
                    <>
                        <i className="fa-solid fa-circle-exclamation fa-2x mb-3" style={{ color: "#dc2626" }}></i>
                        <p>{message}</p>
                        <Link to="/Home" className="btn btn-outline-secondary mt-2">Wróć do logowania</Link>
                    </>
                )}
            </div>
        </div>
    );
}

export default VerifyEmail;