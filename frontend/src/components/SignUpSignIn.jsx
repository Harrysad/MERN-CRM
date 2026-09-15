import { useState } from "react";
import "./SignUpSignIn.css";
import { addUser, logInUser } from "../apiService/user/apiUser";
import { useNavigate } from "react-router-dom";
import { setCookie } from "../helpers/helpers";

export const SignUpSignIn = ({ setUser }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (isRegister) {
      addUser(formData)
        .then(() => {
          setIsRegister(false);
          setFormData({ name: "", email: "", password: "" });
        })
        .catch(() => setError("Ten adres e-mail jest już zajęty."));
    } else {
      logInUser({ email: formData.email, password: formData.password })
        .then((user) => {
          setCookie(user);
          setUser(user);
          navigate("/");
        })
        .catch(() => setError("Nieprawidłowy e-mail lub hasło."));
    }
  };

  const switchMode = () => {
    setIsRegister((prev) => !prev);
    setError("");
    setFormData({ name: "", email: "", password: "" });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Form panel */}
        <div className="auth-form-panel">
          <h2>{isRegister ? "Utwórz konto" : "Zaloguj się"}</h2>
          <p className="auth-subtitle">
            {isRegister
              ? "Wypełnij formularz, aby założyć konto w systemie CRM"
              : "Witaj ponownie! Zaloguj się, aby kontynuować."}
          </p>

          {error && (
            <div className="auth-alert">
              <i className="fa-solid fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div className="form-group">
                <label className="form-label">Imię i nazwisko</label>
                <div className="auth-input-icon">
                  <i className="fa-solid fa-user"></i>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Jan Kowalski"
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Adres e-mail</label>
              <div className="auth-input-icon">
                <i className="fa-solid fa-envelope"></i>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jan@firma.pl"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Hasło</label>
              <div className="auth-input-icon">
                <i className="fa-solid fa-lock"></i>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-btn">
              <i className={`fa-solid ${isRegister ? "fa-user-plus" : "fa-right-to-bracket"} me-2`}></i>
              {isRegister ? "Zarejestruj się" : "Zaloguj się"}
            </button>
          </form>

          <p className="auth-link">
            {isRegister ? (
              <>Masz już konto? <button onClick={switchMode}>Zaloguj się</button></>
            ) : (
              <>Nie masz konta? <button onClick={switchMode}>Zarejestruj się</button></>
            )}
          </p>
        </div>

        {/* Promo panel */}
        <div className="auth-promo-panel">
          <div className="auth-promo-logo">
            <i className="fa-solid fa-chart-line"></i>
          </div>
          <h3>CRM<span style={{ color: "#93c5fd" }}>Pro</span></h3>
          <p>
            Profesjonalne zarządzanie relacjami z klientami w jednym miejscu.
          </p>
          <ul className="auth-promo-features">
            <li><i className="fa-solid fa-check"></i> Baza klientów i kontraktów</li>
            <li><i className="fa-solid fa-check"></i> Historia interakcji</li>
            <li><i className="fa-solid fa-check"></i> Zarządzanie akcjami</li>
            <li><i className="fa-solid fa-check"></i> Wyszukiwanie i sortowanie</li>
          </ul>
          <button className="auth-switch-btn" onClick={switchMode}>
            {isRegister ? "Mam już konto" : "Utwórz konto"}
          </button>
        </div>
      </div>
    </div>
  );
};
