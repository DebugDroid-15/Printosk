# Hardware Wiring & Commissioning Guide — Printosk 2.0

## 1. Overview
The **Printosk 2.0** hardware architecture uses an **ESP32-S3 N16R8** development board as the sole kiosk controller connected directly to an **Epson EcoTank L3115** document printer via native **USB OTG Host**.

---

## 2. Pinout & Interconnection Diagram

```
       ESP32-S3 N16R8                           EXTERNAL HARDWARE
    ┌──────────────────┐                     ┌─────────────────────┐
    │                  │                     │  Epson EcoTank L3115│
    │  GPIO 19 (D-)    ├────────────────────►│  USB Type-A Pin 2(D-)│
    │  GPIO 20 (D+)    ├────────────────────►│  USB Type-A Pin 3(D+)│
    │  GND             ├──────────┬─────────►│  USB Type-A Pin 4(GND)│
    │                  │          │          └─────────────────────┘
    │                  │          │
    │  GPIO 48 (WS2812)│(Onboard) │          ┌─────────────────────┐
    │  RGB Status LED  │          │          │ 5V 1A External Power│
    │                  │          │          │ (Buck Converter/PSU)│
    │  GPIO 4 (Buzzer) ├──────┐   └─────────►│  GND (Common)       │
    └──────────────────┘      │              │  +5V Out ───────────┼──────┐
                              │              └─────────────────────┘      │
                              ▼                                           │
                     ┌──────────────────┐                                 ▼
                     │ NPN Transistor   │                       USB Type-A Pin 1
                     │ Driver (2N2222)  │                           (VBUS 5V)
                     │ + Active Buzzer  │                   (Signals host presence)
                     └──────────────────┘
```

---

## 3. Critical Electrical & Wiring Rules

1. **Do NOT power the Epson L3115 through the ESP32-S3 board**:
   - The Epson EcoTank L3115 is powered by its own **230V AC mains connection**.
2. **USB VBUS (5V)**:
   - USB devices require a 5V reference on VBUS (Pin 1) to detect host connection. Supply this 5V from an external 5V regulator or buck converter with common GND tied to the ESP32-S3 GND.
3. **USB OTG D+ and D-**:
   - ESP32-S3 native USB pins are **GPIO 19 (D-)** and **GPIO 20 (D+)**.
   - Keep wire lengths under 30 cm (or use a shielded USB cable) to prevent packet loss.
4. **Onboard WS2812 RGB LED**:
   - Located on **GPIO 48** on the ESP32-S3 DevKit. No external resistor is needed.
   - Used for color-coded status indication (White: Boot, Amber: Wi-Fi, Green: Ready, Cyan: Job Received, Purple: Printing, Red: Error).
5. **Buzzer Circuit**:
   - Connected via GPIO 4. If using a 5V magnetic buzzer, drive via an NPN transistor (e.g. 2N2222 or S8050) with a 1kΩ base resistor and flyback diode.

