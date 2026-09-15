import axios from "axios";
import config from "../../config";
import { getCookie } from "../../helpers/helpers";

const api = axios.create({
  baseURL: config.api.url + "/actions",
  headers: {
    "Content-Type": "application/json",
    Authorization: JSON.parse(getCookie("user") || 'null')?.jwt,
  },
});


api.interceptors.request.use(
  (config) => {
    const token = JSON.parse(getCookie("user") || "null")?.jwt; // Pobieranie tokena z cookies
    if (token) {
      config.headers["Authorization"] = token; // Dodanie tokena do nagłówka
    }
    return config;
  },
  (error) => {
    return Promise.reject(error); // Obsługa błędów żądań
  }
);

export const getActions = async (customerId, page, limit) => {
  try {
    const response = await api.get(`/${customerId}?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Błąd podczas pobierania danych: ", error);
    throw error;
  }
};

export const addAction = async (payload) => {
  try {
    const response = await api.post("/add", payload);
    console.log(response);
    return response.data;
  } catch (error) {
    console.error("Błąd podczas pobierania danych: ", error);
    throw error;
  }
};

export const updateAction = async (id, payload) => {
  try {
    const response = await api.put(`/edit/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error("Błąd podczas pobierania danych: ", error);
    throw error;
  }
};

export const deleteAction = async (id) => {
  try {
    const response = await api.delete(`/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error("Błąd podczas pobierania danych: ", error);
    throw error;
  }
};
