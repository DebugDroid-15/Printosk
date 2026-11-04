-- Seed data for testing Printosk 2.0
-- Insert default admin user and initial kiosk

INSERT INTO public.kiosks (
    kiosk_code,
    kiosk_name,
    location,
    device_identity,
    device_status,
    printer_status,
    printer_model,
    printer_language
) VALUES (
    'BBSR001',
    'Main Campus Library Kiosk',
    'Ground Floor, Central Library, BBSR',
    'device_token_hash_bbsr001_secret',
    'ONLINE',
    'READY',
    'Epson EcoTank L3115',
    'EPSON_ESCPR'
) ON CONFLICT (kiosk_code) DO UPDATE
SET device_status = 'ONLINE', printer_status = 'READY';

INSERT INTO public.kiosks (
    kiosk_code,
    kiosk_name,
    location,
    device_identity,
    device_status,
    printer_status,
    printer_model,
    printer_language
) VALUES (
    'BBSR002',
    'Student Activity Center',
    '1st Floor, SAC Building',
    'device_token_hash_bbsr002_secret',
    'ONLINE',
    'READY',
    'Epson EcoTank L3115',
    'EPSON_ESCPR'
) ON CONFLICT (kiosk_code) DO NOTHING;