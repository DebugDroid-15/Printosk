import assert from 'node:assert';
import test from 'node:test';
import { PDFDocument } from 'pdf-lib';
import { DocumentProcessor } from './processor';
import { EpsonEscprEncoder } from './epson-escpr';

test('Epson ESC/P-R Encoder generates valid header and footer sequences', () => {
  const encoder = new EpsonEscprEncoder();
  encoder.initPrinter();
  encoder.startPage({
    widthDots: 2880,
    heightDots: 4000,
    resolutionDpi: 360,
    isColour: false,
    isDuplex: false
  });
  encoder.addRasterLine(new Uint8Array(10).fill(0xFF));
  encoder.endPage();
  const buffer = encoder.finishJob();

  assert(buffer.length > 30, 'Buffer should contain printer commands');
  // Check ESC @ reset at start
  assert.strictEqual(buffer[0], 0x1B);
  assert.strictEqual(buffer[1], 0x40);
  // Check Remote mode sequence 'R', 'E', 'M', 'O', 'T', 'E'
  const remoteIndex = buffer.indexOf(Buffer.from('REMOTE1'));
  assert(remoteIndex !== -1, 'Must contain REMOTE1 command');
});

test('DocumentProcessor validates and processes multi-page PDF', async () => {
  // Create a minimal synthetic 2-page PDF
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([595.28, 841.89]); // A4
  pdfDoc.addPage([595.28, 841.89]); // A4
  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  const inspect = await DocumentProcessor.inspectPdf(pdfBuffer);
  assert.strictEqual(inspect.isValid, true);
  assert.strictEqual(inspect.totalPages, 2);

  const result = await DocumentProcessor.processToEscpr({
    pdfBuffer,
    paperSize: 'A4',
    colourMode: 'BW',
    copies: 1
  });

  assert.strictEqual(result.totalPages, 2);
  assert.strictEqual(result.format, 'EPSON_ESCPR');
  assert(result.fileSizeBytes > 100);
});
