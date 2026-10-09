/**
 * Printer Driver Abstraction Types
 * Per AGENTS.md section 7.
 */

export type PrinterDriverId =
  "browser" | "webserial" | "webusb" | "webbluetooth" | "mock" | "tauri" | "capacitor-bt";

export interface PrinterDriver {
  /** Unique driver identifier */
  id: PrinterDriverId;
  /** Human-readable driver name */
  name: string;
  /** Returns whether the current browser/platform environment supports this transport */
  isSupported(): boolean;
  /** Initiates connection with the device (may trigger browser permission dialog) */
  connect(): Promise<void>;
  /** Sends raw byte payload to the printer */
  write(bytes: Uint8Array): Promise<void>;
  /** Closes and releases device connection */
  disconnect(): Promise<void>;
  /** Optional check if connection is active */
  isConnected?(): boolean;
  /** Optional device name currently connected */
  getDeviceName?(): string | null;
}
