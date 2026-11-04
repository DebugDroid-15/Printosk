# Printosk 2.0 Production Deployment Guide

## 1. Web Application Deployment (Vercel)
The `apps/web` application is built with Next.js 14 App Router and is fully optimized for Vercel deployment:
- **Root Directory**: `apps/web`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### Environment Variables for Vercel:
```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
RAZORPAY_KEY_ID=rzp_live_your_key
RAZORPAY_KEY_SECRET=your_secret
```

---

## 2. Supabase Database & Storage Deployment
1. Log in to your [Supabase Dashboard](https://supabase.com).
2. Navigate to **SQL Editor** and run:
   - `supabase/migrations/001_initial_schema.sql` (Creates tables, indexes, and `claim_print_job()` function).
   - `supabase/migrations/002_rls_and_storage.sql` (Configures Row Level Security and private storage buckets).
   - `supabase/seed.sql` (Registers your physical kiosks).

---

## 3. ESP32-S3 Firmware Compilation & Flashing

### Prerequisites:
- Install [ESP-IDF v5.1 or newer](https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/get-started/).

### Build and Flash Commands:
```bash
cd firmware/esp32-s3

# Set target to ESP32-S3
idf.py set-target esp32s3

# Configure Wi-Fi SSID, Password, and Kiosk ID
idf.py menuconfig

# Build firmware
idf.py build

# Flash to device (replace COM5 with your serial port)
idf.py -p COM5 flash monitor
```

