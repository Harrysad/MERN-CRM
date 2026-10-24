import axios from "axios";
import config from "../config";

export const SESSION_EXPIRED_EVENT = "session-expired";

export const createApiClient = (path) => {
  const client = axios.create({
    baseURL: config.api.url + path,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      }
      return Promise.reject(error);
    },
  );

  return client;
};
