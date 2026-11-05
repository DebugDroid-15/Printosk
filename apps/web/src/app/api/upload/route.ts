import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const jobId = formData.get('jobId') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const assignedJobId = jobId || `PSK-${crypto.randomInt(100000, 999999)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const storagePath = `${assignedJobId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    // 1. Upload to Supabase Storage 'documents' bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError);
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
    }

    // 2. Fetch Job primary key UUID from print_jobs
    const { data: jobRow } = await supabaseAdmin
      .from('print_jobs')
      .select('id')
      .eq('job_id', assignedJobId)
      .single();

    if (jobRow?.id) {
      // 3. Register file in print_files table
      await supabaseAdmin.from('print_files').insert({
        job_id: jobRow.id,
        original_file_path: storagePath,
        file_size: file.size,
        file_hash: fileHash,
        mime_type: file.type || 'application/pdf',
        processing_status: 'PROCESSED',
      });
    }

    return NextResponse.json({
      success: true,
      jobId: assignedJobId,
      storagePath,
      fileSize: file.size,
      fileHash,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

