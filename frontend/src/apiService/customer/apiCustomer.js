import { createApiClient } from "../createApiClient";

const api = createApiClient("/customers");

export const getCustomers = async (page, limit, sort, order, search = "") => {
  try {
    const response = await api.get(
      `/?page=${page}&limit=${limit}&sort=${sort}&order=${order}&search=${encodeURIComponent(search)}`,
    );
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
