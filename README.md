# Printosk 2.0 — Autonomous Cloud-Connected Printing Kiosk

Printosk 2.0 is an automated, QR-authorized self-service document printing platform. It connects customers directly to physical kiosks powered by a single **ESP32-S3 N16R8** microcontroller communicating with an **Epson EcoTank L3115** printer over native USB Host OTG.

---

## Key Features

1. **Direct USB Host Communication (No Raspberry Pi or Secondary MCUs)**:
   - Driven entirely by an **ESP32-S3 N16R8** running FreeRTOS and ESP-IDF.
   - Native USB Full-Speed OTG communication with Epson EcoTank L3115 (`VID: 0x04B8`, `PID: 0x1137`).
2. **Onboard WS2812 RGB Status LED & Buzzer**:
   - 8-state color system (Boot White, Wi-Fi Yellow, Ready Green, Auth/Download Cyan, Printing Purple, Error Red).
   - Audio feedback patterns for boot, job received, print completed, and alerts.
3. **Bi-directional Printer Telemetry**:
   - USB `GET_PORT_STATUS` control requests and Bulk IN parsing to detect Paper Empty, Paper Jam, Low Ink, and Cover Open.
   - Real-time cloud status updates to disable the kiosk button and inform customers before they pay.
4. **Universal Driver Engine**:
   - Cloud Document Processor rasterizes high-resolution PDFs into printer-specific binary streams (ESC/P-R for Epson, PCL for HP).
   - The ESP32-S3 acts as a high-speed universal USB pipe.
5. **No Keypads or Screens at the Kiosk**:
   - Kiosk displays a permanent QR code (e.g., `https://printosk.vercel.app/kiosk/BBSR001`).
   - Customers use their smartphone browser with an on-screen tactile keypad to release jobs.
6. **Strict Expiry & Atomic Concurrency**:
   - 60-minute automatic retention policy.
   - Atomic database job claims (`FOR UPDATE`) prevent race conditions or double printing.

---

## Repository Structure

```
PrintTosk_2.0/
├── apps/
│   └── web/                     # Next.js 14 App Router (Customer portal, QR Kiosk, Upload)
├── services/
│   └── document-processor/      # PDF-to-ESC/P-R rasterizer service & tests
├── firmware/
│   └── esp32-s3/                # ESP-IDF v5.1+ USB Host & Cloud client firmware
├── supabase/
│   ├── migrations/              # Production SQL schema, RLS policies, and RPCs
│   └── seed.sql                 # Kiosk seed records
├── shared/
│   └── types/                   # Shared TypeScript domain models
└── docs/
    ├── DEPLOYMENT.md            # Vercel, Supabase, and ESP-IDF deployment guides
    └── HARDWARE_WIRING.md       # Pinout & external 5V VBUS wiring schematic
```

---

## Verification & Test Results

- **Shared Types Package**: Compiled successfully (`tsc`).
- **Document Processor**: Unit tests passed (`Epson ESC/P-R Encoder` & `Multi-page PDF processor`).
- **Web Application**: Next.js 14 production build compiled cleanly (`next build` outputting `/`, `/upload`, `/payment-success`, and `/kiosk/[kioskCode]`).
- **ESP32 Firmware**: Written to ESP-IDF standards using RMT for WS2812 RGB LED and native USB Host.

