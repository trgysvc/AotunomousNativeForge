import type { IHardwareDriver } from '@aurapos/shared-types';
import { CashDrawerDriver } from '@aurapos/hardware/cash-drawer';
import { PrinterDriver } from '@aurapos/hardware/printer';
import { ScannerDriver } from '@aurapos/hardware/scanner';

const cashDrawer = new CashDrawerDriver();
const printer = new PrinterDriver();
const scanner = new ScannerDriver();

export async function initializeHardware(): Promise<void> {
  await Promise.all([
    cashDrawer.initialize(),
    printer.initialize(),
    scanner.initialize(),
  ]);
}

export async function openCashDrawer(): Promise<void> {
  await cashDrawer.open();
}

export async function printReceipt(data: string): Promise<void> {
  await printer.print(data);
}

export async function scanBarcode(): Promise<string> {
  return await scanner.scan();
}

export async function cutPaper(): Promise<void> {
  await printer.cut();
}

export async function beep(times: number = 1): Promise<void> {
  await scanner.beep(times);
}