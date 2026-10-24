import { useEffect } from "react";
import { SESSION_EXPIRED_EVENT } from "../apiService/createApiClient";

export function useSessionExpired(onExpired) {
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [onExpired]);
}
