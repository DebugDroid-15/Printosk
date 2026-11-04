# Printosk 2.0 Security Audit, Threat Model & Compliance Report

## 1. Executive Summary
This document outlines the security architecture, threat model, and verification results for **Printosk 2.0**. As an autonomous document kiosk handling user data, payments, and embedded IoT controllers, security must be enforced across hardware, network, backend, and frontend layers.

---

## 2. Threat Modeling & Mitigation Matrix

| Threat Category | Potential Attack Vector | Printosk 2.0 Mitigation & Defense in Depth | Verified Status |
| :--- | :--- | :--- | :--- |
| **Payment Tampering** | Client tampering with frontend price/amount before checkout. | **Server-side Calculation**: Payable amount is strictly calculated on the server in integer minor units (Paise). Razorpay orders are created via `/api/payments/create-order`. | ✅ **Mitigated** |
| **Payment Spoofing** | Customer sends fake "payment_success" message to trigger job. | **Cryptographic Signature Verification**: Print Job IDs are **never** generated or activated on the frontend. The server verifies HMAC SHA-256 signatures (`razorpay_order_id\|razorpay_payment_id`) and webhook signatures before updating job state to `PAID`. | ✅ **Mitigated** |
| **Race Conditions / Double Printing** | Two users or tabs scanning the same QR and entering the same Job ID simultaneously. | **PostgreSQL Atomic Claim with `FOR UPDATE`**: The `claim_print_job()` stored procedure locks the job row at the database transaction level, preventing multiple concurrent claims. Subsequent attempts receive an immediate reject response. | ✅ **Mitigated** |
| **File Snooping / Privacy Breach** | Unauthorized users attempting to browse or download customer documents. | **Private Storage Buckets & Ephemeral URLs**: Storage buckets (`documents`, `processed-prints`) are strictly private. Files are only accessible via short-lived signed URLs generated during authorized job execution. | ✅ **Mitigated** |
| **Data Hoarding / Leaks** | Abandoned or old customer documents lingering on disks. | **60-Minute Hard Expiry & Automated Pruning**: Database marks unprinted jobs as `EXPIRED` after 60 minutes. An automated cron worker (`/api/cron/cleanup`) prunes files from storage. | ✅ **Mitigated** |
| **ESP32 Credential Exposure** | Leaking Supabase service-role keys into firmware binary. | **Device Tokens / Restricted RPCs**: The ESP32-S3 **never** receives a Supabase `service_role` key. It communicates using a hashed device identity token with access restricted exclusively to its own assigned queue. | ✅ **Mitigated** |
| **Power Loss / Duplicate Print Waste** | Kiosk losing power mid-job and auto-reprinting on boot. | **NVS Job State Recovery**: Last active job state is persisted locally in ESP32 NVS. On reboot, if state was `PRINTING`, auto-printing is halted to prevent wasting ink and paper. | ✅ **Mitigated** |

---

## 3. Cryptographic Verification Standard

- **HMAC SHA-256**: Used for Razorpay signature verification and webhook authentication.
- **TLS 1.3 / HTTPS**: Enforced across all Next.js API endpoints, Supabase database connections, and ESP32-S3 mbedTLS sockets.
- **Device Identity**: Unique hashed tokens for each physical kiosk registered in `public.kiosks.device_identity`.

---

## 4. Acceptance Sign-Off
All core security mechanisms have been implemented and validated against the strict engineering rules of Printosk 2.0.

