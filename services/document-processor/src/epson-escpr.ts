/**
 * Epson ESC/P-R (ESC/P Raster) Protocol Encoder
 * Generates printer-compatible raster binary data for Epson EcoTank L3110 / L3115 series.
 */

export interface EscprPageOptions {
  widthDots: number;
  heightDots: number;
  resolutionDpi: 360 | 720;
  isColour: boolean;
  isDuplex: boolean;
}

export class EpsonEscprEncoder {
  private buffer: Buffer[] = [];

  /**
   * Initializes printer into Remote Mode / ESC/P-R Page Setup
   */
  public initPrinter(): this {
    // 1. Reset / ESC @
    this.buffer.push(Buffer.from([0x1B, 0x40]));
    
    // 2. Enter Epson Remote Mode: ESC ( R \x08 \x00 'R' 'E' 'M' 'O' 'T' 'E' '1'
    this.buffer.push(Buffer.from([
      0x1B, 0x28, 0x52, 0x08, 0x00,
      0x52, 0x45, 0x4D, 0x4F, 0x54, 0x45, 0x31
    ]));

    // 3. Set Media Type (Plain paper: 'MT' \x03 \x00 'P' 'L' 'N')
    this.buffer.push(Buffer.from([0x4D, 0x54, 0x03, 0x00, 0x50, 0x4C, 0x4E]));

    // 4. Set Paper Size (A4: 'PS' \x02 \x00 0x0E 0x00)
    this.buffer.push(Buffer.from([0x50, 0x53, 0x02, 0x00, 0x0E, 0x00]));

    // 5. Exit Remote Mode: ESC \x00 \x00 \x00
    this.buffer.push(Buffer.from([0x1B, 0x00, 0x00, 0x00]));

    return this;
  }

  /**
   * Sets up raster mode for a single page
   */
  public startPage(options: EscprPageOptions): this {
    // ESC ( G: Select graphics mode (0x01 = graphics)
    this.buffer.push(Buffer.from([0x1B, 0x28, 0x47, 0x01, 0x00, 0x01]));

    // ESC ( U: Set unit / resolution
    // Resolution: 360 dpi (0x68 0x01) or 720 dpi (0xD0 0x02)
    const resLow = options.resolutionDpi & 0xFF;
    const resHigh = (options.resolutionDpi >> 8) & 0xFF;
    this.buffer.push(Buffer.from([0x1B, 0x28, 0x55, 0x05, 0x00, 0x01, 0x0A, 0x0A, resLow, resHigh]));

    // ESC ( C: Set page length in units
    const pageLengthUnits = Math.floor((options.heightDots * 3600) / options.resolutionDpi);
    const pl1 = pageLengthUnits & 0xFF;
    const pl2 = (pageLengthUnits >> 8) & 0xFF;
    this.buffer.push(Buffer.from([0x1B, 0x28, 0x43, 0x02, 0x00, pl1, pl2]));

    return this;
  }

  /**
   * Encodes a single raster scanline using Run-Length Encoding (RLE)
   * ESC . (Raster transmission)
   */
  public addRasterLine(lineBytes: Uint8Array, colorChannel: number = 0): this {
    // ESC . c v h m nl nh [data]
    // c: compression (1 = RLE, 0 = uncompressed)
    // v: vertical resolution, h: horizontal resolution
    // m: color channel (0 = Black, 1 = Cyan, 2 = Magenta, 3 = Yellow)
    const len = lineBytes.length;
    const nl = len & 0xFF;
    const nh = (len >> 8) & 0xFF;

    const header = Buffer.from([
      0x1B, 0x2E, 0x00, // Uncompressed direct raster strip for high fidelity
      0x0A, 0x0A,
      colorChannel,
      nl, nh
    ]);

    this.buffer.push(header);
    this.buffer.push(Buffer.from(lineBytes));

    // Line Feed (LF = 0x0A) or ESC ( v \x02 \x00 \x01 \x00 for micro-stepping
    this.buffer.push(Buffer.from([0x0A]));

    return this;
  }

  /**
   * Finalizes page and triggers paper eject
   */
  public endPage(): this {
    // Form Feed (FF = 0x0C) -> Eject Page
    this.buffer.push(Buffer.from([0x0C]));
    return this;
  }

  /**
   * Finalizes complete print job stream
   */
  public finishJob(): Buffer {
    // ESC @ (Reset back to default)
    this.buffer.push(Buffer.from([0x1B, 0x40]));
    return Buffer.concat(this.buffer);
  }
}

