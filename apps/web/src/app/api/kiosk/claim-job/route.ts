import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { kioskCode, jobId } = await req.json();

    if (!kioskCode || !jobId) {
      return NextResponse.json({ success: false, message: 'Missing kioskCode or jobId' }, { status: 400 });
    }

    // In a live Supabase environment, this executes:
    // const { data, error } = await supabase.rpc('claim_print_job', { p_kiosk_code: kioskCode, p_job_id: jobId });
    // In local standalone test mode, simulate valid atomic claim:
    const mockSignedDownloadUrl = `/api/kiosk/download/${jobId}.prn`;

    return NextResponse.json({
      success: true,
      message: 'Job successfully claimed and locked for printing!',
      job: {
        jobId,
        kioskCode,
        status: 'CLAIMED',
        totalPages: 2,
        copies: 1,
        downloadUrl: mockSignedDownloadUrl,
        claimedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

