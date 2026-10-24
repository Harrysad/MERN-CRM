import { describe, it, expect, vi, afterEach } from "vitest";
import config from "../../../src/config";
import {
  createApiClient,
  SESSION_EXPIRED_EVENT,
} from "../../../src/apiService/createApiClient";

const respondWith = (client, status, capture = {}) => {
  client.defaults.adapter = (requestConfig) => {
    capture.config = requestConfig;

    if (status >= 400) {
      const error = new Error(`status ${status}`);
      error.config = requestConfig;
      error.response = { status, data: {}, config: requestConfig };
      return Promise.reject(error);
    }

    return Promise.resolve({
      data: {},
      status,
      statusText: "OK",
      headers: {},
      config: requestConfig,
    });
  };
};

describe("createApiClient", () => {
  const onExpired = vi.fn();

  afterEach(() => {
    window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
    onExpired.mockReset();
  });

  it("targets the API path and sends the session cookie", () => {
    const client = createApiClient("/customers");

    expect(client.defaults.baseURL).toBe(`${config.api.url}/customers`);
    expect(client.defaults.withCredentials).toBe(true);
  });

  it("marks every request with the header that protects against CSRF", async () => {
    const client = createApiClient("/customers");
    const capture = {};
    respondWith(client, 200, capture);

    await client.get("/");

    expect(capture.config.headers.get("X-Requested-With")).toBe(
      "XMLHttpRequest",
    );
  });

  it("announces an expired session when the API answers 401", async () => {
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    const client = createApiClient("/customers");
    respondWith(client, 401);

    await expect(client.get("/")).rejects.toBeDefined();

    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it("does not announce an expired session for other errors", async () => {
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    const client = createApiClient("/customers");
    respondWith(client, 500);

    await expect(client.get("/")).rejects.toBeDefined();

    expect(onExpired).not.toHaveBeenCalled();
  });
});
