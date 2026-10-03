import axios from "axios";
import config from "../../config";
import { getCookie } from "../../helpers/helpers";

const api = axios.create({
  baseURL: config.api.url + "/auth", // Podstawowy URL API
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

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
    return response.data;
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
    throw error;
  }
};

export const logOutUser = async (payload) => {
  try {
    const response = await api.post("logout", payload);
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
    const token = JSON.parse(getCookie("user") || "null")?.jwt;
    const response = await api.post(
      "/resend-verification",
      {},
      {
        headers: { Authorization: token },
      },
    );
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
  const token = JSON.parse(getCookie("user") || "null")?.jwt;
  const response = await api.get("/verification-status", {
    headers: { Authorization: token },
  });
  return response.data;
};
