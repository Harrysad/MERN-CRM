import axios from "axios";
import config from "../../config";

const api = axios.create({
    baseURL: config.api.url + '/auth', // Podstawowy URL API
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });

export const addUser = async (payload) => {
    try {
        const response = await api.post('/signup', payload)
        return response.data;
    } catch (error) {
        console.error("Błąd podczas pobierania danych:", error);
      throw error;
    }
}

export const logInUser = async (payload) => {
    try {
        const response = await api.post('/login', payload)
        return response.data;
    } catch (error) {
        console.error("Błąd podczas pobierania danych:", error);
      throw error;
    }
}

export const logOutUser = async (payload) => {
  try {
    const response = await api.post('logout', payload)
    return response.data
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
      throw error;
  }
}