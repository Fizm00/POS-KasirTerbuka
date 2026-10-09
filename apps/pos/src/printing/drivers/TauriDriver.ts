import type { PrinterDriver, PrinterDriverId } from "./types";
import { isTauri } from "../../lib/platform";
import { invoke } from "@tauri-apps/api/core";

export interface TauriDriverOptions {
  connectionType?: "serial" | "network";
  portName?: string;
  baudRate?: number;
  networkAddress?: string;
}

export class TauriDriver implements PrinterDriver {
  readonly id: PrinterDriverId = "tauri";
  readonly name = "Desktop Thermal Printer (Tauri)";

  private connected: boolean = false;
  private connectionType: "serial" | "network" = "serial";
  private portName: string = "";
  private baudRate: number = 9600;
  private networkAddress: string = "";

  constructor(options: TauriDriverOptions = {}) {
    this.configure(options);
  }

  configure(options: TauriDriverOptions): void {
    if (options.connectionType) this.connectionType = options.connectionType;
    if (options.portName !== undefined) this.portName = options.portName;
    if (options.baudRate !== undefined) this.baudRate = options.baudRate;
    if (options.networkAddress !== undefined) this.networkAddress = options.networkAddress;
  }

  isSupported(): boolean {
    return isTauri();
  }

  async listSerialPorts(): Promise<string[]> {
    if (!this.isSupported()) {
      return [];
    }
    try {
      return await invoke<string[]>("list_serial_ports");
    } catch (err) {
      console.error("Gagal mendeteksi port serial:", err);
      return [];
    }
  }

  async connect(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Tauri driver hanya didukung di aplikasi desktop Tauri.");
    }
    this.connected = true;
  }

  async write(bytes: Uint8Array): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Tauri driver hanya didukung di aplikasi desktop Tauri.");
    }

    const payload = Array.from(bytes);

    if (this.connectionType === "network") {
      if (!this.networkAddress) {
        throw new Error("Alamat IP printer jaringan belum ditentukan.");
      }
      await invoke("print_raw_network", {
        address: this.networkAddress,
        data: payload,
      });
    } else {
      if (!this.portName) {
        const ports = await this.listSerialPorts();
        if (ports.length > 0) {
          this.portName = ports[0];
        } else {
          throw new Error("Port serial printer belum dipilih atau tidak ada printer terhubung.");
        }
      }
      await invoke("print_raw_serial", {
        portName: this.portName,
        baudRate: this.baudRate,
        data: payload,
      });
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getDeviceName(): string | null {
    if (this.connectionType === "network") {
      return this.networkAddress
        ? `Network Printer (${this.networkAddress})`
        : "Network Thermal Printer";
    }
    return this.portName ? `Serial Printer (${this.portName})` : "Desktop Thermal Printer";
  }
}
