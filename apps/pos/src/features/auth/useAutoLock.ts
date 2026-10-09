import { useEffect } from "react";
import { useAuthStore } from "./authStore";

export function useAutoLock() {
  const { isLocked, autoLockMinutes, lastActivityTime, lock, recordActivity } = useAuthStore();

  useEffect(() => {
    if (isLocked) return;

    const handleUserActivity = () => {
      recordActivity();
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    const checkIntervalMs = 5000;
    const intervalId = setInterval(() => {
      const now = Date.now();
      const timeoutMs = autoLockMinutes * 60 * 1000;
      if (now - lastActivityTime >= timeoutMs) {
        lock();
      }
    }, checkIntervalMs);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearInterval(intervalId);
    };
  }, [isLocked, autoLockMinutes, lastActivityTime, lock, recordActivity]);
}
