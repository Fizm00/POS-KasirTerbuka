import type { PrinterDriver, PrinterDriverId } from "./types";

interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

interface SerialPortLike {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  writable: {
    getWriter(): {
      write(chunk: Uint8Array): Promise<void>;
      releaseLock(): void;
    };
  } | null;
  getInfo(): SerialPortInfo;
}

interface SerialLike {
  requestPort(options?: {
    filters?: Array<{ usbVendorId?: number; usbProductId?: number }>;
  }): Promise<SerialPortLike>;
  getPorts(): Promise<SerialPortLike[]>;
}

export class WebSerialDriver implements PrinterDriver {
  readonly id: PrinterDriverId = "webserial";
  readonly name = "USB / Serial Port (Web Serial)";

  private port: SerialPortLike | null = null;
  private baudRate: number;

  constructor(baudRate: number = 9600) {
    this.baudRate = baudRate;
  }

  isSupported(): boolean {
    return (
      typeof navigator !== "undefined" &&
      "serial" in (navigator as unknown as { serial?: SerialLike })
    );
  }

  async connect(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Web Serial API tidak didukung di browser ini.");
    }

    const serial = (navigator as unknown as { serial: SerialLike }).serial;
    this.port = await serial.requestPort();
    await this.port.open({ baudRate: this.baudRate });
  }

  async write(bytes: Uint8Array): Promise<void> {
    if (!this.port || !this.port.writable) {
      throw new Error("Printer serial belum terhubung atau port tidak dapat ditulis.");
    }

    const writer = this.port.writable.getWriter();
    try {
      await writer.write(bytes);
    } finally {
      writer.releaseLock();
    }
  }

  async disconnect(): Promise<void> {
    if (this.port) {
      try {
        await this.port.close();
      } finally {
        this.port = null;
      }
    }
  }

  isConnected(): boolean {
    return this.port !== null && this.port.writable !== null;
  }

  getDeviceName(): string | null {
    if (!this.port) return null;
    const info = this.port.getInfo();
    if (info.usbVendorId) {
      return `Serial Printer (VID: 0x${info.usbVendorId.toString(16).padStart(4, "0")})`;
    }
    return "Serial Port Printer";
  }
}
