/**
 * Universal Printer Driver & Test Page Generator
 * Supports auto-detection and test page generation for Epson (ESC/P-R), HP (PCL5/PCL6),
 * PostScript, and ESC/POS thermal receipt printers.
 */

export type UniversalPrinterLanguage =
  | 'EPSON_ESCPR'
  | 'HP_PCL6'
  | 'POSTSCRIPT'
  | 'GENERIC_ESCPOS';

export interface PrinterDescriptor {
  vid: number;
  pid: number;
  manufacturer?: string;
  product?: string;
}

export class UniversalPrinterDriver {
  /**
   * Identifies the printer language automatically from USB Vendor ID (VID) and Product ID (PID)
   */
  public static detectLanguage(desc: PrinterDescriptor): UniversalPrinterLanguage {
    // Seiko Epson Corp: 0x04B8
    if (desc.vid === 0x04B8) {
      return 'EPSON_ESCPR';
    }

    // Hewlett-Packard (HP): 0x03F0
    if (desc.vid === 0x03F0) {
      return 'HP_PCL6';
    }

    // Brother: 0x04F9 / Canon: 0x04A9
    if (desc.vid === 0x04A9 || desc.vid === 0x04F9) {
      return 'POSTSCRIPT';
    }

    // Fallback based on manufacturer string if available
    const mfg = (desc.manufacturer || '').toLowerCase();
    if (mfg.includes('epson')) return 'EPSON_ESCPR';
    if (mfg.includes('hp') || mfg.includes('hewlett')) return 'HP_PCL6';

    // Default to universal ESC/P-R
    return 'EPSON_ESCPR';
  }

  /**
   * Generates a printer-ready self-test diagnostic printout for the detected printer language
   */
  public static generateTestPage(language: UniversalPrinterLanguage, kioskCode: string = 'BBSR001'): Buffer {
    switch (language) {
      case 'HP_PCL6':
        return this.generateHpPclTestPage(kioskCode);
      case 'POSTSCRIPT':
        return this.generatePostScriptTestPage(kioskCode);
      case 'GENERIC_ESCPOS':
        return this.generateEscPosTestPage(kioskCode);
      case 'EPSON_ESCPR':
      default:
        return this.generateEpsonEscprTestPage(kioskCode);
    }
  }

  /**
   * HP PCL 5/6 Universal Test Page
   */
  private static generateHpPclTestPage(kioskCode: string): Buffer {
    const chunks: Buffer[] = [];
    // Reset printer: ESC E
    chunks.push(Buffer.from([0x1B, 0x45]));
    // Set orientation Portrait: ESC & l 0 O
    chunks.push(Buffer.from('\x1B&l0O', 'ascii'));
    // Set A4 paper: ESC & l 26 A
    chunks.push(Buffer.from('\x1B&l26A', 'ascii'));
    // Select Courier Font, 12pt, Bold: ESC ( s 3 T ESC ( s 1 B
    chunks.push(Buffer.from('\x1B(s3T\x1B(s1B', 'ascii'));

    // Test text content
    const content =
      '\r\n\r\n' +
      '======================================================\r\n' +
      '          PRINTOSK 2.0 - HARDWARE SELF-TEST          \r\n' +
      '======================================================\r\n' +
      ` Kiosk Code:     ${kioskCode}\r\n` +
      ' Detected Model: HP Universal PCL Driver\r\n' +
      ' USB Connection: Native ESP32-S3 USB Host OK\r\n' +
      ` Timestamp:      ${new Date().toISOString()}\r\n` +
      ' Status:         ONLINE & READY FOR JOBS\r\n' +
      '======================================================\r\n' +
      '       Protocol Industry (C) 2026 - Odisha, India      \r\n\r\n';

    chunks.push(Buffer.from(content, 'ascii'));
    // Eject page (Form Feed = 0x0C)
    chunks.push(Buffer.from([0x0C]));
    // Reset printer: ESC E
    chunks.push(Buffer.from([0x1B, 0x45]));

    return Buffer.concat(chunks);
  }

  /**
   * Epson ESC/P-R Universal Test Page
   */
  private static generateEpsonEscprTestPage(kioskCode: string): Buffer {
    const chunks: Buffer[] = [];
    // ESC @ (Reset)
    chunks.push(Buffer.from([0x1B, 0x40]));
    // Epson Remote Mode entry: ESC ( R \x08 \x00 'R' 'E' 'M' 'O' 'T' 'E' '1'
    chunks.push(Buffer.from([0x1B, 0x28, 0x52, 0x08, 0x00, 0x52, 0x45, 0x4D, 0x4F, 0x54, 0x45, 0x31]));
    // Plain paper (MT PLN) & A4 paper (PS \x02 \x00 0x0E 0x00)
    chunks.push(Buffer.from([0x4D, 0x54, 0x03, 0x00, 0x50, 0x4C, 0x4E]));
    chunks.push(Buffer.from([0x50, 0x53, 0x02, 0x00, 0x0E, 0x00]));
    // Exit remote mode: ESC \x00 \x00 \x00
    chunks.push(Buffer.from([0x1B, 0x00, 0x00, 0x00]));

    // Start Page Graphics (360 DPI)
    chunks.push(Buffer.from([0x1B, 0x28, 0x47, 0x01, 0x00, 0x01]));
    chunks.push(Buffer.from([0x1B, 0x28, 0x55, 0x05, 0x00, 0x01, 0x0A, 0x0A, 0x68, 0x01]));

    // Generate diagnostic alignment raster stripes
    const widthBytes = 372;
    const testLine = new Uint8Array(widthBytes).fill(0x55); // Alternating dot test pattern
    const emptyLine = new Uint8Array(widthBytes).fill(0x00);

    for (let i = 0; i < 40; i++) {
      chunks.push(Buffer.from([0x1B, 0x2E, 0x00, 0x0A, 0x0A, 0x00, widthBytes & 0xFF, (widthBytes >> 8) & 0xFF]));
      chunks.push(Buffer.from(testLine));
      chunks.push(Buffer.from([0x0A]));
    }

    for (let i = 0; i < 40; i++) {
      chunks.push(Buffer.from([0x1B, 0x2E, 0x00, 0x0A, 0x0A, 0x00, widthBytes & 0xFF, (widthBytes >> 8) & 0xFF]));
      chunks.push(Buffer.from(emptyLine));
      chunks.push(Buffer.from([0x0A]));
    }

    // Form Feed (Eject Page)
    chunks.push(Buffer.from([0x0C]));
    // ESC @ (Reset)
    chunks.push(Buffer.from([0x1B, 0x40]));

    return Buffer.concat(chunks);
  }

  /**
   * Universal PostScript Test Page
   */
  private static generatePostScriptTestPage(kioskCode: string): Buffer {
    const ps =
      '%!PS\n' +
      '/Helvetica-Bold findfont 18 scalefont setfont\n' +
      '72 700 moveto\n' +
      '(PRINTOSK 2.0 - UNIVERSAL POSTSCRIPT TEST) show\n' +
      '/Helvetica findfont 12 scalefont setfont\n' +
      '72 670 moveto\n' +
      `(${kioskCode} - Self-Test Successful) show\n` +
      'showpage\n';
    return Buffer.from(ps, 'ascii');
  }

  /**
   * ESC/POS Receipt Test Page
   */
  private static generateEscPosTestPage(kioskCode: string): Buffer {
    const chunks: Buffer[] = [];
    chunks.push(Buffer.from([0x1B, 0x40])); // Reset
    chunks.push(Buffer.from([0x1B, 0x61, 0x01])); // Center
    chunks.push(Buffer.from(`\nPRINTOSK 2.0 TEST\nKIOSK: ${kioskCode}\nREADY\n\n`, 'ascii'));
    chunks.push(Buffer.from([0x1D, 0x56, 0x41, 0x10])); // Cut
    return Buffer.concat(chunks);
  }
}
