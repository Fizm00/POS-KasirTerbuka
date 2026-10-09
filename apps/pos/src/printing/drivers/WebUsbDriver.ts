import type { PrinterDriver, PrinterDriverId } from "./types";

interface UsbEndpointLike {
  endpointNumber: number;
  direction: "in" | "out";
  type: "bulk" | "interrupt" | "isochronous";
}

interface UsbAlternateInterfaceLike {
  endpoints: UsbEndpointLike[];
}

interface UsbInterfaceLike {
  interfaceNumber: number;
  alternate: UsbAlternateInterfaceLike;
}

interface UsbConfigurationLike {
  configurationValue: number;
  interfaces: UsbInterfaceLike[];
}

interface UsbDeviceLike {
  productName?: string;
  opened: boolean;
  configuration: UsbConfigurationLike | null;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  transferOut(
    endpointNumber: number,
    data: Uint8Array
  ): Promise<{ status: string; bytesWritten: number }>;
}

interface UsbLike {
  requestDevice(options: {
    filters: Array<{ classCode?: number; vendorId?: number }>;
  }): Promise<UsbDeviceLike>;
}

export class WebUsbDriver implements PrinterDriver {
  readonly id: PrinterDriverId = "webusb";
  readonly name = "USB Langsung (WebUSB)";

  private device: UsbDeviceLike | null = null;
  private interfaceNumber: number | null = null;
  private endpointNumber: number | null = null;

  isSupported(): boolean {
    return typeof navigator !== "undefined" && "usb" in (navigator as unknown as { usb?: UsbLike });
  }

  async connect(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("WebUSB API tidak didukung di browser ini.");
    }

    const usb = (navigator as unknown as { usb: UsbLike }).usb;
    // Request device: classCode 7 is Printer class, but many cheap thermal printers use vendor-specific 0xFF or 0.
    // An empty filter list lets the user pick any USB device from the browser chooser.
    this.device = await usb.requestDevice({ filters: [] });

    await this.device.open();

    if (!this.device.configuration) {
      await this.device.selectConfiguration(1);
    }

    // Find the bulk OUT endpoint for thermal printing
    const configuration = this.device.configuration;
    let foundOutEndpoint: number | null = null;
    let foundInterface: number | null = null;

    if (configuration) {
      for (const iface of configuration.interfaces) {
        for (const ep of iface.alternate.endpoints) {
          if (ep.direction === "out" && ep.type === "bulk") {
            foundOutEndpoint = ep.endpointNumber;
            foundInterface = iface.interfaceNumber;
            break;
          }
        }
        if (foundOutEndpoint !== null) break;
      }
    }

    // Fallback default endpoint 1 if not discovered
    this.interfaceNumber = foundInterface ?? 0;
    this.endpointNumber = foundOutEndpoint ?? 1;

    await this.device.claimInterface(this.interfaceNumber);
  }

  async write(bytes: Uint8Array): Promise<void> {
    if (!this.device || !this.device.opened || this.endpointNumber === null) {
      throw new Error("Printer USB belum terhubung.");
    }

    // Transfer bytes via bulk out endpoint
    await this.device.transferOut(this.endpointNumber, bytes);
  }

  async disconnect(): Promise<void> {
    if (this.device) {
      try {
        if (this.interfaceNumber !== null) {
          await this.device.releaseInterface(this.interfaceNumber);
        }
        await this.device.close();
      } finally {
        this.device = null;
        this.interfaceNumber = null;
        this.endpointNumber = null;
      }
    }
  }

  isConnected(): boolean {
    return this.device !== null && this.device.opened;
  }

  getDeviceName(): string | null {
    if (!this.device) return null;
    return this.device.productName || "USB Thermal Printer";
  }
}
