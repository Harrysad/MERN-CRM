import axios from "axios";
import config from "../../config";
import { getCookie } from "../../helpers/helpers";

// Utworzenie instancji Axios
const api = axios.create({
  baseURL: config.api.url + "/customers", // Podstawowy URL API
  headers: {
    "Content-Type": "application/json",
    Authorization: JSON.parse(getCookie("user") || "null")?.jwt,
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

export const getCustomers = async (page, limit, sort, order) => {
  try {
    const response = await api.get(`/?page=${page}&limit=${limit}&sort=${sort}&order=${order}`); //Tu dodać dwa parametry ?page
    return response.data;
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
    throw error;
  }
};

export const getCustomer = async (id) => {
  try {
    const response = await api.get(`/${id}`);
    return response.data;
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
    throw error;
  }
};

export const deleteCustomer = async (id) => {
  try {
    const response = await api.delete(`/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
    throw error;
  }
};

export const updateCustomer = async (id, payload) => {
  try {
    const response = await api.put(`/edit/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
    throw error;
  }
};

export const addCustomer = async (payload) => {
  try {
    const response = await api.post(`/add`, payload);
    return response.data;
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
    throw error;
  }
};
