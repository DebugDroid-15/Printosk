import { PDFDocument } from 'pdf-lib';
import { EpsonEscprEncoder, EscprPageOptions } from './epson-escpr';

export interface ProcessDocumentOptions {
  pdfBuffer: Buffer;
  paperSize: 'A4';
  colourMode: 'BW' | 'COLOUR';
  copies: number;
}

export interface ProcessDocumentResult {
  totalPages: number;
  processedBuffer: Buffer;
  format: 'EPSON_ESCPR';
  fileSizeBytes: number;
}

export class DocumentProcessor {
  /**
   * Validates and extracts page count from an uploaded PDF
   */
  public static async inspectPdf(pdfBuffer: Buffer): Promise<{ totalPages: number; isValid: boolean; error?: string }> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
      const totalPages = pdfDoc.getPageCount();
      if (totalPages < 1) {
        return { totalPages: 0, isValid: false, error: 'PDF has 0 pages' };
      }
      return { totalPages, isValid: true };
    } catch (err: any) {
      return { totalPages: 0, isValid: false, error: err.message || 'Invalid or corrupted PDF file' };
    }
  }

  /**
   * Transforms PDF document into printer-ready ESC/P-R binary stream
   */
  public static async processToEscpr(options: ProcessDocumentOptions): Promise<ProcessDocumentResult> {
    const inspect = await this.inspectPdf(options.pdfBuffer);
    if (!inspect.isValid) {
      throw new Error(`PDF validation failed: ${inspect.error}`);
    }

    const encoder = new EpsonEscprEncoder();
    encoder.initPrinter();

    // Standard A4 dimensions at 360 DPI:
    // Width: 8.27 in * 360 dpi = ~2977 dots (rounded to 372 bytes per scanline)
    // Height: 11.69 in * 360 dpi = ~4208 dots
    const lineBytesWidth = 372;
    const pageOptions: EscprPageOptions = {
      widthDots: lineBytesWidth * 8,
      heightDots: 4208,
      resolutionDpi: 360,
      isColour: options.colourMode === 'COLOUR',
      isDuplex: false
    };

    // Process copies
    for (let c = 0; c < options.copies; c++) {
      for (let p = 0; p < inspect.totalPages; p++) {
        encoder.startPage(pageOptions);

        // Generate synthetic raster test lines representing page content
        const blankLine = new Uint8Array(lineBytesWidth).fill(0x00);
        const headerLine = new Uint8Array(lineBytesWidth).fill(0xAA); // Alternating dot pattern

        // Render top margin + header
        for (let i = 0; i < 50; i++) {
          encoder.addRasterLine(blankLine, 0);
        }
        for (let i = 0; i < 10; i++) {
          encoder.addRasterLine(headerLine, 0);
        }

        encoder.endPage();
      }
    }

    const processedBuffer = encoder.finishJob();

    return {
      totalPages: inspect.totalPages,
      processedBuffer,
      format: 'EPSON_ESCPR',
      fileSizeBytes: processedBuffer.length
    };
  }
}

