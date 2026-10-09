import type { PrinterDriver, PrinterDriverId } from "./types";
import { concatByteArrays } from "../escpos/builder";

export class MockDriver implements PrinterDriver {
  readonly id: PrinterDriverId = "mock";
  readonly name = "Mock Driver (Test)";

  private connected = false;
  private supported = true;
  private shouldFail = false;
  private failMessage = "Mock printer failure";
  public writtenChunks: Uint8Array[] = [];

  constructor(options?: { supported?: boolean; shouldFail?: boolean }) {
    if (options?.supported !== undefined) this.supported = options.supported;
    if (options?.shouldFail !== undefined) this.shouldFail = options.shouldFail;
  }

  isSupported(): boolean {
    return this.supported;
  }

  setSupported(val: boolean): void {
    this.supported = val;
  }

  setShouldFail(val: boolean, message?: string): void {
    this.shouldFail = val;
    if (message) this.failMessage = message;
  }

  async connect(): Promise<void> {
    if (this.shouldFail) {
      throw new Error(this.failMessage);
    }
    this.connected = true;
  }

  async write(bytes: Uint8Array): Promise<void> {
    if (this.shouldFail) {
      throw new Error(this.failMessage);
    }
    this.writtenChunks.push(new Uint8Array(bytes));
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getDeviceName(): string | null {
    return this.connected ? "Mock Thermal Printer 58mm" : null;
  }

  getAllWrittenBytes(): Uint8Array {
    return concatByteArrays(this.writtenChunks);
  }

  clear(): void {
    this.writtenChunks = [];
    this.connected = false;
    this.shouldFail = false;
  }
}
