import { createApiClient } from "../createApiClient";
import { toSessionUser } from "../../helpers/helpers";

const api = createApiClient("/auth");

export const addUser = async (payload) => {
  try {
    const response = await api.post("/signup", payload);
    return response.data;
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
    throw error;
  }
};

export const logInUser = async (payload) => {
  try {
    const response = await api.post("/login", payload);
    return toSessionUser(response.data);
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
    throw error;
  }
};

export const logOutUser = async (payload) => {
  try {
    const response = await api.post("/logout", payload);
    return response.data;
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
    throw error;
  }
};

export const verifyEmail = async (token) => {
  try {
    const response = await api.get(`/verify/${token}`);
    return response.data;
  } catch (error) {
    console.error("Błąd podczas weryfikacji adresu e-mail.", error);
    throw error;
  }
};

export const resendVerification = async () => {
  try {
    const response = await api.post("/resend-verification");
    return response.data;
  } catch (error) {
    console.error(
      "Błąd podczas ponownego wysyłania linku weryfikacyjnego: ",
      error,
    );
    throw error;
  }
};

export const getVerificationStatus = async () => {
  const response = await api.get("/verification-status");
  return response.data;
};
