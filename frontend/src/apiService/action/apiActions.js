import { createApiClient } from "../createApiClient";

const api = createApiClient("/actions");

export const getActions = async (customerId, page, limit) => {
  try {
    const response = await api.get(
      `/${customerId}?page=${page}&limit=${limit}`,
    );
    return response.data;
  } catch (error) {
    console.error("Błąd podczas pobierania danych: ", error);
    throw error;
  }
};

export const addAction = async (payload) => {
  try {
    const response = await api.post("/add", payload);
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
