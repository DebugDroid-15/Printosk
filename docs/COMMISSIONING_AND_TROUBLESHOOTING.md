# Printosk 2.0 Hardware Commissioning & Field Operator Manual

## 1. Hardware Parts Checklist

- [x] **ESP32-S3 N16R8 Development Board** (16MB Flash, 8MB PSRAM, USB OTG).
- [x] **Epson EcoTank L3115 Printer** (Mains-powered A4 Inkjet Tank).
- [x] **External 5V 1A DC Power Supply / Buck Converter** (For USB Host VBUS).
- [x] **USB Type-A Female Breakout Cable** (D+, D-, VBUS, GND).
- [x] **Active 5V Buzzer + NPN Transistor (2N2222) + 1kΩ Resistor**.
- [x] **Permanent Acrylic / Vinyl QR Code Plate** (Printed with `https://printosk.vercel.app/kiosk/[KIOSK_CODE]`).

---

## 2. Wiring Assembly Diagram

```
                 ESP32-S3 DevKit
               ┌──────────────────┐
               │                  │
               │   GPIO 19 (D-)   ├──────────────────────────────┐
               │   GPIO 20 (D+)   ├────────────────────────┐     │
               │   GND            ├──────────┬───────┐     │     │
               │   GPIO 4         ├───┐      │       │     │     │
               └──────────────────┘   │      │       │     │     │
                                      ▼      │       │     │     │
                             1kΩ Base │      │       │     │     │
                           2N2222 NPN │      │       │     │     │
                             + Buzzer │      │       │     │     │
                                      │      │       │     │     │
                                      │      │       ▼     ▼     ▼
                                      │      │   ┌───────────────────┐
                                      │      │   │ 4 | 3  | 2  |  1  │
                                      │      │   │GND| D+ | D- | VBUS│
                                      │      │   └───────────────────┘
                                      │      │    USB Type-A Female
                                      │      │     (To Epson L3115)
                                      ▼      ▼            ▲
                         ┌───────────────────────┐        │
                         │ 5V DC 1A Power Supply │────────┘
                         │ (Buck Converter)      │
                         └───────────────────────┘
```

> [!IMPORTANT]
> The Epson printer must be plugged into its standard 230V AC mains wall outlet. Do **NOT** attempt to power the printer mechanism through the ESP32! The 5V VBUS pin is strictly used to signal USB host detection.

---

## 3. Firmware Flashing & Configuration

1. Connect the ESP32-S3 board to your PC via its **UART/COM port**.
2. Open terminal in `firmware/esp32-s3`:
   ```bash
   idf.py set-target esp32s3
   idf.py menuconfig
   ```
3. Set your campus Wi-Fi SSID and Password under **Printosk Wi-Fi Configuration**.
4. Set your unique Kiosk Code (e.g., `BBSR001`).
5. Compile and flash:
   ```bash
   idf.py -p COM5 flash monitor
   ```

---

## 4. Visual Diagnostic Guide (Onboard WS2812 LED & Buzzer)

| LED Color | Pattern | Audio Tone | Meaning & Action |
| :--- | :--- | :--- | :--- |
| ⚪ **White** | Solid | 1 short beep | Microcontroller booting & self-test |
| 🟡 **Amber** | Slow pulse | Silent | Connecting to campus Wi-Fi network |
| 🟢 **Green** | Soft breathing | 2 happy chirps | **Ready & Idle**: Connected to cloud, printer warm |
| 🔵 **Cyan** | Fast blink | Double chime | **Job Claimed**: Downloading print stream from cloud |
| 🟣 **Purple** | Rapid chase | Single beep | **Printing**: Streaming ESC/P-R raster data over USB |
| 🟢 **Bright Mint** | Solid for 5s | Fanfare chime | **Completed**: Pages printed, tray output ready |
| 🟠 **Orange** | Strobe | Warning tone | **Paper Empty**: Printer is out of paper. Add sheets! |
| 🔴 **Red** | Fast strobe | Alarm beep | **Hardware / Connection Error**: Check USB cable or Wi-Fi |

---

## 5. Maintenance & Troubleshooting

- **Printer Not Detected (Orange/Red LED)**: Check that the USB Type-A connector is firmly seated and the external 5V VBUS supply is delivering steady voltage.
- **Paper Jam**: Clear paper from the Epson front/rear feed, close lid. The printer's internal optical sensor will reset `GET_PORT_STATUS`, turning the LED back to Green.
- **Job Expiry**: If a student does not arrive at the kiosk within 60 minutes, the job automatically expires, and files are cleaned up from the server.

