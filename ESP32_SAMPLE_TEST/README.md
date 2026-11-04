# ESP32-S3 Sample Bench Test (No Printer Required)

This standalone firmware tests your physical **ESP32-S3 N16R8** board with:
1. **Onboard WS2812 RGB LED (GPIO 48)**
2. **Wi-Fi Connection** (SSID: `Manakusaku`, Password: `123456789`)
3. **Live Supabase Database Query** (`cmchdgioopxyopoiuzeh.supabase.co`)

---

## Visual Diagnostic Color Stages:

| LED Color | Stage | Meaning |
| :--- | :--- | :--- |
| ⚪ **White** | Booting | ESP32 initialized NVS and RMT LED peripheral. |
| 🟡 **Amber / Yellow** | Connecting | Searching and associating with Wi-Fi `Manakusaku`. |
| 🔵 **Cyan** | Pinging | Got Wi-Fi IP; sending HTTPS query to Supabase table `public.kiosks`. |
| 🟢 **Solid Green** | **SUCCESS!** | Supabase returned `HTTP 200 OK`! The kiosk record is verified. |
| 🔴 **Red** | Error | Wi-Fi failure or HTTPS connection timeout. |

---

## How to Flash in One Click (Windows):

1. Plug your ESP32-S3 board into your PC via its USB-C port.
2. Open terminal in this folder:
   ```cmd
   cd c:\PROJECTS\PrintTosk_2.0\ESP32_SAMPLE_TEST
   .\flash_test.bat COM5
   ```
   *(Replace `COM5` with your actual serial port number).*

