import { NextResponse } from 'next/server';
import { UniversalPrinterDriver, UniversalPrinterLanguage } from '@/../../services/document-processor/src/universal-printer';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const language = (searchParams.get('language') || 'EPSON_ESCPR') as UniversalPrinterLanguage;
    const kioskCode = searchParams.get('kioskCode') || 'BBSR001';

    const testPageBuffer = UniversalPrinterDriver.generateTestPage(language, kioskCode);

    return new NextResponse(testPageBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="selftest_${language.toLowerCase()}.prn"`,
        'Content-Length': testPageBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
