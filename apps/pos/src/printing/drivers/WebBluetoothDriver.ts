import type { PrinterDriver, PrinterDriverId } from "./types";

interface BluetoothCharacteristicLike {
  properties: {
    write: boolean;
    writeWithoutResponse: boolean;
  };
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithoutResponse?(value: BufferSource): Promise<void>;
}

interface BluetoothServiceLike {
  uuid: string;
  getCharacteristics(): Promise<BluetoothCharacteristicLike[]>;
}

interface BluetoothGattServerLike {
  connected: boolean;
  connect(): Promise<BluetoothGattServerLike>;
  disconnect(): void;
  getPrimaryServices(): Promise<BluetoothServiceLike[]>;
}

interface BluetoothDeviceLike {
  name?: string;
  gatt?: BluetoothGattServerLike;
}

interface BluetoothLike {
  requestDevice(options: {
    acceptAllDevices?: boolean;
    optionalServices?: Array<string | number>;
  }): Promise<BluetoothDeviceLike>;
}

// Well-known BLE transparent UART service UUIDs used by mobile thermal printers (Zjiang, Goojprt, Panda, etc.)
const KNOWN_BLE_PRINTER_SERVICES: Array<string | number> = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000fee7-0000-1000-8000-00805f9b34fb",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
  0xff00,
  0xffe0,
  0x18f0,
  0xae30,
];

export class WebBluetoothDriver implements PrinterDriver {
  readonly id: PrinterDriverId = "webbluetooth";
  readonly name = "Bluetooth BLE (Web Bluetooth)";

  private device: BluetoothDeviceLike | null = null;
  private characteristic: BluetoothCharacteristicLike | null = null;

  isSupported(): boolean {
    return (
      typeof navigator !== "undefined" &&
      "bluetooth" in (navigator as unknown as { bluetooth?: BluetoothLike })
    );
  }

  async connect(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Web Bluetooth API tidak didukung di browser ini.");
    }

    const bluetooth = (navigator as unknown as { bluetooth: BluetoothLike }).bluetooth;
    this.device = await bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: KNOWN_BLE_PRINTER_SERVICES,
    });

    if (!this.device.gatt) {
      throw new Error("Perangkat Bluetooth tidak memiliki GATT server.");
    }

    const server = await this.device.gatt.connect();
    const services = await server.getPrimaryServices();

    // Find the writable characteristic
    let writeChar: BluetoothCharacteristicLike | null = null;
    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            writeChar = char;
            break;
          }
        }
      } catch {
        // Skip service if inaccessible
      }
      if (writeChar) break;
    }

    if (!writeChar) {
      throw new Error(
        "Karakteristik penulisan (write characteristic) printer Bluetooth tidak ditemukan."
      );
    }

    this.characteristic = writeChar;
  }

  async write(bytes: Uint8Array): Promise<void> {
    if (!this.device || !this.characteristic) {
      throw new Error("Printer Bluetooth belum terhubung.");
    }

    // Thermal BLE printers have limited buffer (typically 20 to 100 bytes MTU)
    const CHUNK_SIZE = 64;
    for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
      const chunk = bytes.slice(offset, offset + CHUNK_SIZE);
      if (
        this.characteristic.properties.writeWithoutResponse &&
        this.characteristic.writeValueWithoutResponse
      ) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
      // Small delay between chunks to avoid buffer overrun on microcontrollers
      await new Promise((resolve) => setTimeout(resolve, 15));
    }
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
  }

  isConnected(): boolean {
    return Boolean(this.device?.gatt?.connected && this.characteristic);
  }

  getDeviceName(): string | null {
    return this.device?.name || "Bluetooth Thermal Printer";
  }
}
