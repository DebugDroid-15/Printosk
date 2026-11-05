import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Secret token for authorized kiosks
const VALID_DEVICE_TOKEN = process.env.KIOSK_API_SECRET_TOKEN || 'device_token_hash_bbsr001_secret';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      kiosk_code,
      kiosk_name = 'Printosk Self-Service Station',
      location = 'Campus Location',
      device_token,
      printer_connected = false,
      printer_status = 'DISCONNECTED',
      printer_model = 'Epson EcoTank L3115',
    } = body;

    if (!kiosk_code) {
      return NextResponse.json({ error: 'Missing kiosk_code' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Upsert: Automatically registers the kiosk if it's the first time,
    // or updates heartbeat, device_status, and printer_status if it already exists!
    const { data, error } = await supabaseAdmin
      .from('kiosks')
      .upsert(
        {
          kiosk_code,
          kiosk_name,
          location,
          device_identity: device_token || `token_${kiosk_code}`,
          device_status: 'ONLINE',
          printer_status: printer_connected ? printer_status : 'DISCONNECTED',
          printer_model,
          last_heartbeat: now,
        },
        { onConflict: 'kiosk_code' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Heartbeat registered & kiosk synchronized',
      kiosk: data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

