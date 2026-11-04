-- Printosk 2.0 Complete Production Database Schema
-- Idempotent setup for Supabase PostgreSQL

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum Types
DO $$ BEGIN
    CREATE TYPE paper_size_enum AS ENUM ('A4', 'A3', 'LETTER', 'LEGAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE colour_mode_enum AS ENUM ('BW', 'COLOUR');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE duplex_mode_enum AS ENUM ('SINGLE', 'DOUBLE_LONG', 'DOUBLE_SHORT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE job_status_enum AS ENUM (
        'PENDING_PAYMENT',
        'PAID',
        'PROCESSING',
        'READY',
        'CLAIMED',
        'PRINTING',
        'COMPLETED',
        'EXPIRED',
        'FAILED',
        'CANCELLED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE device_status_enum AS ENUM ('ONLINE', 'OFFLINE', 'BUSY', 'ERROR', 'MAINTENANCE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE printer_status_enum AS ENUM (
        'READY',
        'PRINTING',
        'PAPER_EMPTY',
        'PAPER_JAM',
        'COVER_OPEN',
        'LOW_INK',
        'DISCONNECTED',
        'ERROR'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE printer_language_enum AS ENUM ('EPSON_ESCPR', 'HP_PCL6', 'POSTSCRIPT', 'GENERIC_ESCPOS');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'kiosk_device')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. KIOSKS TABLE
CREATE TABLE IF NOT EXISTS public.kiosks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kiosk_code VARCHAR(32) UNIQUE NOT NULL, -- e.g. BBSR001
    kiosk_name TEXT NOT NULL,
    location TEXT NOT NULL,
    device_identity TEXT UNIQUE NOT NULL, -- Hashed hardware device identifier/token
    device_status device_status_enum NOT NULL DEFAULT 'OFFLINE',
    printer_status printer_status_enum NOT NULL DEFAULT 'DISCONNECTED',
    printer_model TEXT NOT NULL DEFAULT 'Epson EcoTank L3115',
    printer_language printer_language_enum NOT NULL DEFAULT 'EPSON_ESCPR',
    last_heartbeat TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. PRINT JOBS TABLE
CREATE TABLE IF NOT EXISTS public.print_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR(16) UNIQUE NOT NULL, -- e.g. PSK-824691
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    kiosk_id UUID REFERENCES public.kiosks(id) ON DELETE SET NULL,
    status job_status_enum NOT NULL DEFAULT 'PENDING_PAYMENT',
    paper_size paper_size_enum NOT NULL DEFAULT 'A4',
    colour_mode colour_mode_enum NOT NULL DEFAULT 'BW',
    duplex_mode duplex_mode_enum NOT NULL DEFAULT 'SINGLE',
    copies INTEGER NOT NULL DEFAULT 1 CHECK (copies >= 1 AND copies <= 50),
    page_range TEXT,
    total_pages INTEGER NOT NULL DEFAULT 1 CHECK (total_pages >= 1),
    total_sheets INTEGER NOT NULL DEFAULT 1 CHECK (total_sheets >= 1),
    amount_paise INTEGER NOT NULL CHECK (amount_paise >= 0),
    payment_status payment_status_enum NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    paid_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc', now()) + INTERVAL '60 minutes'),
    claimed_at TIMESTAMPTZ,
    printing_started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- 4. PRINT FILES TABLE
CREATE TABLE IF NOT EXISTS public.print_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.print_jobs(id) ON DELETE CASCADE,
    original_file_path TEXT NOT NULL,
    processed_file_path TEXT,
    file_size BIGINT NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- SHA-256
    mime_type TEXT NOT NULL DEFAULT 'application/pdf',
    processing_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (processing_status IN ('PENDING', 'PROCESSED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ
);

-- 5. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.print_jobs(id) ON DELETE CASCADE,
    gateway_order_id TEXT NOT NULL,
    gateway_payment_id TEXT,
    amount_paise INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    payment_status payment_status_enum NOT NULL DEFAULT 'PENDING',
    webhook_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    verified_at TIMESTAMPTZ
);

-- 6. PRINT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.print_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.print_jobs(id) ON DELETE SET NULL,
    kiosk_id UUID REFERENCES public.kiosks(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    message TEXT NOT NULL,
    error_code TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 7. DEVICE HEARTBEATS TABLE
CREATE TABLE IF NOT EXISTS public.device_heartbeats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kiosk_id UUID NOT NULL REFERENCES public.kiosks(id) ON DELETE CASCADE,
    firmware_version VARCHAR(32) NOT NULL,
    wifi_rssi INTEGER NOT NULL,
    free_heap BIGINT NOT NULL,
    printer_connected BOOLEAN NOT NULL DEFAULT FALSE,
    device_status device_status_enum NOT NULL DEFAULT 'ONLINE',
    printer_status printer_status_enum NOT NULL DEFAULT 'READY',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- INDEXES FOR PERFORMANCE & LOOKUPS
CREATE INDEX IF NOT EXISTS idx_kiosks_code ON public.kiosks(kiosk_code);
CREATE INDEX IF NOT EXISTS idx_print_jobs_job_id ON public.print_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON public.print_jobs(status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_expires ON public.print_jobs(expires_at) WHERE status IN ('READY', 'PAID');
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_heartbeats_kiosk_time ON public.device_heartbeats(kiosk_id, created_at DESC);

-- ATOMIC STORED FUNCTION: CLAIM PRINT JOB
-- Concurrency-safe: Locks candidate job with FOR UPDATE to prevent double-claim race conditions.
CREATE OR REPLACE FUNCTION public.claim_print_job(
    p_kiosk_code VARCHAR(32),
    p_job_id VARCHAR(16)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_kiosk RECORD;
    v_job RECORD;
    v_file RECORD;
    v_now TIMESTAMPTZ := timezone('utc', now());
BEGIN
    -- 1. Validate Kiosk
    SELECT * INTO v_kiosk FROM public.kiosks 
    WHERE kiosk_code = p_kiosk_code;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid kiosk code');
    END IF;

    IF v_kiosk.device_status = 'OFFLINE' THEN
        RETURN jsonb_build_object('success', false, 'message', 'This kiosk is currently offline');
    END IF;

    IF v_kiosk.printer_status IN ('PAPER_EMPTY', 'PAPER_JAM', 'DISCONNECTED', 'ERROR') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Printer not ready: ' || v_kiosk.printer_status);
    END IF;

    -- 2. Validate and Lock Job with FOR UPDATE
    SELECT * INTO v_job FROM public.print_jobs 
    WHERE job_id = p_job_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Print job not found');
    END IF;

    -- Check Payment
    IF v_job.payment_status != 'VERIFIED' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Payment is pending or unverified');
    END IF;

    -- Check Expiry
    IF v_job.expires_at < v_now THEN
        UPDATE public.print_jobs SET status = 'EXPIRED' WHERE id = v_job.id;
        RETURN jsonb_build_object('success', false, 'message', 'Print job has expired');
    END IF;

    -- Check Already Claimed or Completed
    IF v_job.status IN ('CLAIMED', 'PRINTING') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Print job is already being processed');
    END IF;

    IF v_job.status = 'COMPLETED' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Print job has already been collected');
    END IF;

    -- Find Processed File
    SELECT * INTO v_file FROM public.print_files 
    WHERE job_id = v_job.id AND processing_status = 'PROCESSED'
    ORDER BY created_at DESC LIMIT 1;

    IF NOT FOUND OR v_file.processed_file_path IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Print file is still processing. Please try in 10 seconds.');
    END IF;

    -- 3. Atomic Assignment
    UPDATE public.print_jobs
    SET status = 'CLAIMED',
        kiosk_id = v_kiosk.id,
        claimed_at = v_now
    WHERE id = v_job.id;

    -- Log Event
    INSERT INTO public.print_logs (job_id, kiosk_id, event_type, message)
    VALUES (v_job.id, v_kiosk.id, 'JOB_CLAIMED', 'Job claimed at kiosk ' || v_kiosk.kiosk_code);

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Job claimed successfully',
        'job', jsonb_build_object(
            'id', v_job.id,
            'job_id', v_job.job_id,
            'paper_size', v_job.paper_size,
            'colour_mode', v_job.colour_mode,
            'copies', v_job.copies,
            'total_pages', v_job.total_pages,
            'processed_file_path', v_file.processed_file_path
        )
    );
END;
$$;

-- CLEANUP EXPIRED JOBS STORED PROCEDURE
CREATE OR REPLACE FUNCTION public.cleanup_expired_print_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    UPDATE public.print_jobs
    SET status = 'EXPIRED'
    WHERE expires_at < timezone('utc', now())
      AND status IN ('READY', 'PAID', 'PROCESSING');

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

