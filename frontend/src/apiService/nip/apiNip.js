import { createApiClient } from "../createApiClient";

const api = createApiClient("/nip");

export const lookupNip = async (nip) => {
  const response = await api.get(`/${nip}`);
  return response.data;
};
