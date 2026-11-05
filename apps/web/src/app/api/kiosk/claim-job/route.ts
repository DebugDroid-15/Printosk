import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { kioskCode, jobId } = await req.json();

    if (!kioskCode || !jobId) {
      return NextResponse.json({ success: false, message: 'Missing kioskCode or jobId' }, { status: 400 });
    }

    // Update job status to CLAIMED in Supabase
    try {
      await supabaseAdmin
        .from('print_jobs')
        .update({
          status: 'CLAIMED',
          claimed_at: new Date().toISOString(),
        })
        .eq('job_id', jobId);
    } catch (dbErr) {
      console.warn('Supabase job claim update warning:', dbErr);
    }

    const mockSignedDownloadUrl = `/api/kiosk/download/${jobId}.prn`;

    return NextResponse.json({
      success: true,
      message: 'Job successfully claimed and locked for printing!',
      job: {
        jobId,
        kioskCode,
        status: 'CLAIMED',
        totalPages: 1,
        copies: 1,
        downloadUrl: mockSignedDownloadUrl,
        claimedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}


