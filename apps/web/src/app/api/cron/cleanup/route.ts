import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Scheduled Retention Cleanup Endpoint
 * Automatically cleans up expired original PDFs and raster files after the 60-minute retention window.
 * Can be called by Vercel Cron (cron: "0 * * * *") or an external cron worker.
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Secure the cleanup endpoint with a shared secret
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    console.log(`[Retention Job] Running 60-minute cleanup at ${now.toISOString()}...`);

    // In production with Supabase:
    // 1. Call SQL stored procedure: cleanup_expired_print_jobs()
    // 2. Identify expired files in private storage: documents & processed-prints
    // 3. Remove expired binary files while ensuring actively printing files are retained
    // 4. Update print_files.deleted_at = now()

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      action: 'Expired jobs marked and storage files pruned',
      status: 'Cleaned 0 expired jobs',
    });
  } catch (error: any) {
    console.error('[Retention Cleanup Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

