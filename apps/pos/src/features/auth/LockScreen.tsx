import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Delete } from "lucide-react";
import { settingsRepo } from "../../db/repositories/settingsRepo";
import { usersRepo } from "../../db/repositories/usersRepo";
import type { StoreSettings, User } from "../../db/schema";
import { verifyPin } from "./pin";
import { useAuthStore } from "./authStore";
import { t } from "../../i18n";

export const LockScreen: React.FC = () => {
  const navigate = useNavigate();
  const unlock = useAuthStore((state) => state.unlock);

  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pinDigits, setPinDigits] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Load store settings and active users
  useEffect(() => {
    async function loadData() {
      const s = await settingsRepo.getSettings();
      setSettings(s);

      const allUsers = await usersRepo.getUsers();
      const activeUsers = allUsers.filter((u) => u.isActive);
      setUsers(activeUsers);

      if (activeUsers.length === 1) {
        setSelectedUser(activeUsers[0]);
      }
    }
    loadData();
  }, []);

  const attemptUnlock = React.useCallback(
    async (candidatePin: string) => {
      if (!selectedUser || isVerifying) return;
      setIsVerifying(true);

      try {
        const isValid = await verifyPin(candidatePin, selectedUser.pinHash);
        if (isValid) {
          unlock(selectedUser);
          navigate("/kasir", { replace: true });
        } else {
          // If 4 digits failed, wait if user might be typing a 5-6 digit PIN
          if (candidatePin.length < 6) {
            setIsVerifying(false);
            return;
          }
          // At 6 digits or explicit failure, show error and clear dots
          setErrorMessage(t("lock.pinIncorrect"));
          setPinDigits("");
        }
      } catch {
        setErrorMessage(t("lock.pinIncorrect"));
        setPinDigits("");
      } finally {
        setIsVerifying(false);
      }
    },
    [selectedUser, isVerifying, unlock, navigate]
  );

  const handleDigitPress = React.useCallback(
    (digit: string) => {
      if (isVerifying || pinDigits.length >= 6) return;
      const nextDigits = pinDigits + digit;
      setPinDigits(nextDigits);
      setErrorMessage("");

      // Auto verify if reached 4 to 6 digits and matches length
      if (nextDigits.length >= 4) {
        attemptUnlock(nextDigits);
      }
    },
    [isVerifying, pinDigits, attemptUnlock]
  );

  const handleBackspace = React.useCallback(() => {
    if (isVerifying || pinDigits.length === 0) return;
    setPinDigits((prev) => prev.slice(0, -1));
    setErrorMessage("");
  }, [isVerifying, pinDigits.length]);

  // Listen to physical keyboard numeric input
  useEffect(() => {
    if (!selectedUser) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigitPress(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedUser, handleDigitPress, handleBackspace]);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-control)] p-8 flex flex-col items-center gap-6">
        {/* Store Name as plain text */}
        <div className="text-center space-y-1">
          <p className="text-xl font-semibold text-[var(--text)]">
            {settings?.storeName || "Kasir Terbuka"}
          </p>
          {selectedUser && users.length > 1 && (
            <button
              type="button"
              onClick={() => {
                setSelectedUser(null);
                setPinDigits("");
                setErrorMessage("");
              }}
              className="text-sm text-[var(--primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 cursor-pointer"
            >
              {selectedUser.name} ({t("lock.backToUserSelect")})
            </button>
          )}
        </div>

        {/* User picker if more than 1 user and no user selected */}
        {!selectedUser ? (
          <div className="w-full flex flex-col gap-3">
            <p className="text-sm font-medium text-[var(--text-muted)] text-center">
              {t("lock.selectUser")}
            </p>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setSelectedUser(u);
                    setPinDigits("");
                    setErrorMessage("");
                  }}
                  className="min-h-[52px] px-4 py-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] flex items-center justify-between text-base font-medium text-[var(--text)] hover:bg-[var(--primary-soft)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 cursor-pointer transition-colors"
                >
                  <span>{u.name}</span>
                  <span className="text-sm text-[var(--text-muted)] capitalize">{u.role}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* PIN Entry Area */
          <div className="w-full flex flex-col items-center gap-6">
            {/* PIN Dots (4 to 6 slots) */}
            <div className="flex items-center gap-3 py-2" role="status" aria-label="PIN entered">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const isFilled = index < pinDigits.length;
                return (
                  <div
                    key={index}
                    className={`w-3.5 h-3.5 rounded-full transition-colors ${
                      isFilled
                        ? "bg-[var(--primary)]"
                        : "border border-[var(--border-strong)] bg-transparent"
                    }`}
                  />
                );
              })}
            </div>

            {/* Inline Error (shown only after an attempt) */}
            {errorMessage && (
              <p role="alert" className="text-sm font-medium text-[var(--danger)] text-center">
                {errorMessage}
              </p>
            )}

            {/* 3x4 Numeric Keypad with 64px keys */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
              {keys.map((key, i) => {
                if (key === "") {
                  return <div key={`empty-${i}`} className="min-h-[64px]" />;
                }

                if (key === "del") {
                  return (
                    <button
                      key="del"
                      type="button"
                      onClick={handleBackspace}
                      aria-label="Hapus digit"
                      className="min-h-[64px] min-w-[64px] rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--bg)] active:bg-[var(--border)] flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2"
                    >
                      <Delete className="w-6 h-6" aria-hidden="true" />
                    </button>
                  );
                }

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleDigitPress(key)}
                    className="min-h-[64px] min-w-[64px] rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface)] text-2xl font-semibold text-[var(--text)] hover:bg-[var(--bg)] active:bg-[var(--border)] flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 tabular-nums"
                  >
                    {key}
                  </button>
                );
              })}
            </div>

            {/* Forgot PIN helper link */}
            <div className="text-center pt-2">
              <span className="text-sm text-[var(--text-muted)]">{t("lock.forgotPin")}</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
