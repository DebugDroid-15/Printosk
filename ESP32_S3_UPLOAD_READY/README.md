# ESP32-S3 Standalone Firmware Package — Printosk 2.0

This directory (`ESP32_S3_UPLOAD_READY`) is a standalone ESP-IDF project configured for the **ESP32-S3 N16R8** development board.

---

## 1. Directory Structure

```
ESP32_S3_UPLOAD_READY/
│
├── CMakeLists.txt              # Project CMake definitions
├── sdkconfig.defaults          # Target config: 16MB Flash, 8MB Octal PSRAM, USB Host
├── partitions.csv              # Flash partition map for N16R8
├── flash_esp32.bat             # Automated one-click compile and flash script for Windows
├── README.md                   # This instruction manual
│
└── main/
    ├── CMakeLists.txt          # Component registration and dependencies
    ├── Kconfig.projbuild       # Graphical configuration menu (menuconfig)
    ├── main.c                  # Bootloader, task scheduler & health loop
    ├── status_types.h          # Hardware state definitions & telemetry structs
    ├── rgb_status.h / .c       # Onboard WS2812 RGB LED (GPIO 48) RMT driver
    ├── buzzer.h / .c           # Non-blocking audio tones (GPIO 4)
    ├── wifi_manager.h / .c     # Station Wi-Fi manager with auto-reconnection
    ├── cloud_client.h / .c     # HTTPS polling, heartbeats & stream consumer
    ├── nvs_storage.h / .c      # NVS job state & power-loss restart recovery
    └── usb_printer.h / .c      # Native USB Host OTG (GPIO 19/20) for Epson L3115
```

---

## 2. Quick Upload Instructions (Windows)

### Option A: Using the Automated Flash Script
1. Plug your **ESP32-S3** board into your computer using a USB-C data cable (plug into the **UART / COM** port).
2. Double-click or run:
   ```cmd
   flash_esp32.bat COM5
   ```
   *(Replace `COM5` with your actual serial port number).*

### Option B: Using Standard ESP-IDF Terminal
```bash
# 1. Open ESP-IDF Terminal (or run export.bat in your ESP-IDF installation)
cd C:\PROJECTS\PrintTosk_2.0\ESP32_S3_UPLOAD_READY

# 2. (Optional) Customize your Wi-Fi SSID, Password, or Kiosk Code:
idf.py menuconfig

# 3. Build the project:
idf.py build

# 4. Flash and open serial monitor:
idf.py -p COM5 flash monitor
```

---

## 3. Physical Wiring Reference

```
  ESP32-S3 N16R8 Pin                     Connection / Hardware
  ─────────────────────────────────────────────────────────────────────────────
  GPIO 19 (USB D-)   ─────────────► USB Type-A Pin 2 (White wire)
  GPIO 20 (USB D+)   ─────────────► USB Type-A Pin 3 (Green wire)
  GND                ─────────────► USB Type-A Pin 4 (Black wire) + Power GND
  GPIO 48            ─────────────► Onboard WS2812 RGB LED (Built-in)
  GPIO 4             ─────────────► Active Buzzer (via NPN transistor)
  External +5V DC    ─────────────► USB Type-A Pin 1 (VBUS Red wire)
```

> [!CAUTION]
> The Epson printer must be powered via its own 230V AC mains cable. The +5V external connection to USB Pin 1 is strictly for VBUS host signaling.

