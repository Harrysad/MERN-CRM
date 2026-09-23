import axios from "axios"
import config from "../../config";
import { getCookie } from "../../helpers/helpers";

const api = axios.create({
    baseURL: config.api.url + "/nip",
    headers: {
        "Content-Type": "application/json",
        Authorization: JSON.parse(getCookie("user") || "null")?.jwt,
    },
});

api.interceptors.request.use(
    (config) => {
        const token = JSON.parse(getCookie("user") || "null")?.jwt;
        if (token) {
            config.headers["Authorization"] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const lookupNip = async (nip) => {
    const response = await api.get(`/${nip}`);
    return response.data;
};