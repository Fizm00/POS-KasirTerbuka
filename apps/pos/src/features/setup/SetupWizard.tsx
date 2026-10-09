import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "../../components";
import { settingsRepo } from "../../db/repositories/settingsRepo";
import { usersRepo } from "../../db/repositories/usersRepo";
import { hashPin } from "../auth/pin";
import { useAuthStore } from "../auth/authStore";
import { t } from "../../i18n";

export const SetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const unlock = useAuthStore((state) => state.unlock);

  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Store info
  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [storeError, setStoreError] = useState("");

  // Step 2: Admin info
  const [adminName, setAdminName] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [adminErrors, setAdminErrors] = useState<{
    name?: string;
    pin?: string;
    pinConfirm?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setStoreError(t("setup.errorStoreNameRequired"));
      return;
    }
    setStoreError("");
    setCurrentStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; pin?: string; pinConfirm?: string } = {};

    if (!adminName.trim()) {
      errors.name = t("setup.errorAdminNameRequired");
    }

    const pinRegex = /^\d{4,6}$/;
    if (!pinRegex.test(pin)) {
      errors.pin = t("setup.errorPinLength");
    }

    if (pin !== pinConfirm) {
      errors.pinConfirm = t("setup.errorPinMismatch");
    }

    if (Object.keys(errors).length > 0) {
      setAdminErrors(errors);
      return;
    }

    setAdminErrors({});
    setCurrentStep(3);
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      // 1. Hash PIN with salt
      const pinHash = await hashPin(pin);

      // 2. Save store settings
      await settingsRepo.updateSettings({
        storeName: storeName.trim(),
        address: address.trim(),
        phone: phone.trim(),
      });

      // 3. Save initial admin user
      const adminUser = await usersRepo.createUser({
        name: adminName.trim(),
        role: "admin",
        pinHash,
        isActive: true,
      });

      // 4. Request persistent storage if supported
      if (typeof navigator !== "undefined" && navigator.storage?.persist) {
        try {
          await navigator.storage.persist();
        } catch {
          // Ignore persistent storage rejection
        }
      }

      // 5. Unlock session and redirect to /kasir
      unlock(adminUser);
      navigate("/kasir", { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-control)] p-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-1 border-b border-[var(--border)] pb-4">
          <span className="text-sm font-medium text-[var(--text-muted)]">
            {t("setup.step", { current: currentStep, total: 3 })}
          </span>
          <h1 className="text-xl font-semibold text-[var(--text)]">
            {currentStep === 1 && t("setup.storeTitle")}
            {currentStep === 2 && t("setup.adminTitle")}
            {currentStep === 3 && t("setup.finishTitle")}
          </h1>
        </div>

        {/* Step 1: Store info */}
        {currentStep === 1 && (
          <form onSubmit={handleNextStep1} className="flex flex-col gap-4">
            <Input
              label={t("setup.storeName")}
              placeholder={t("setup.storeNamePlaceholder")}
              value={storeName}
              onChange={(e) => {
                setStoreName(e.target.value);
                if (storeError) setStoreError("");
              }}
              error={storeError}
              autoFocus
            />

            <Input
              label={t("setup.storeAddress")}
              placeholder={t("setup.storeAddressPlaceholder")}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <Input
              label={t("setup.storePhone")}
              placeholder={t("setup.storePhonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary">
                {t("setup.next")}
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Admin account */}
        {currentStep === 2 && (
          <form onSubmit={handleNextStep2} className="flex flex-col gap-4">
            <Input
              label={t("setup.adminName")}
              placeholder={t("setup.adminNamePlaceholder")}
              value={adminName}
              onChange={(e) => {
                setAdminName(e.target.value);
                if (adminErrors.name) setAdminErrors((prev) => ({ ...prev, name: undefined }));
              }}
              error={adminErrors.name}
              autoFocus
            />

            <Input
              label={t("setup.pin")}
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              helperText={t("setup.pinHelper")}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                setPin(digits);
                if (adminErrors.pin) setAdminErrors((prev) => ({ ...prev, pin: undefined }));
              }}
              error={adminErrors.pin}
            />

            <Input
              label={t("setup.pinConfirm")}
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pinConfirm}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                setPinConfirm(digits);
                if (adminErrors.pinConfirm) {
                  setAdminErrors((prev) => ({ ...prev, pinConfirm: undefined }));
                }
              }}
              error={adminErrors.pinConfirm}
            />

            <div className="pt-2 flex justify-between items-center">
              <Button type="button" variant="secondary" onClick={() => setCurrentStep(1)}>
                {t("common.back")}
              </Button>
              <Button type="submit" variant="primary">
                {t("setup.next")}
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Finish */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 text-base text-[var(--text)]">
              <p>{t("setup.finishNote")}</p>
              <div className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-control)]">
                <p className="text-sm font-medium text-[var(--text-muted)]">
                  {t("setup.finishBackupReminder")}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCurrentStep(2)}
                disabled={isLoading}
              >
                {t("common.back")}
              </Button>
              <Button type="button" variant="primary" onClick={handleFinish} isLoading={isLoading}>
                {t("setup.startUsing")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
