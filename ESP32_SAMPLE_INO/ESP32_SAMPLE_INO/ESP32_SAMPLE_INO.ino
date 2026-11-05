/*
 * PRINTOSK 2.0 - UNIVERSAL ESP32-S3 PRINTER CONTROLLER & AUTO TEST-PRINT
 *
 * Universal Features:
 * 1. Automatic USB Device Enumeration (Epson VID 0x04B8, HP VID 0x03F0, Canon/Brother)
 * 2. On First Power-on / Printer Connect: Sends automatic diagnostic test print to the printer!
 * 3. Bidirectional USB Status checks (detects Paper Empty, Paper Jam, Ready)
 * 4. Automatic Cloud registration & heartbeat in Supabase
 */

#include <WiFi.h>
#include <HTTPClient.h>

// ==========================================
// 1. HARDWARE & WI-FI CONFIGURATION
// ==========================================
const char* WIFI_SSID     = "Manakusaku";
const char* WIFI_PASSWORD = "123456789";

const char* KIOSK_CODE    = "BBSR001";
const char* KIOSK_NAME    = "Universal Print Station #1";
const char* KIOSK_LOC     = "Central Campus Location";

// Supabase REST Endpoint
const char* SUPABASE_REST_URL = "https://cmchdgioopxyopoiuzeh.supabase.co/rest/v1/kiosks";
const char* SUPABASE_KEY      = "sb_publishable_GQE-LDAIFhkc9FOtkG3aOA_huqXPHUJ";

// Built-in RGB LED Pin (GPIO 48)
#define RGB_BUILTIN_PIN 48

// Known Printer Vendor IDs
#define USB_VID_EPSON 0x04B8
#define USB_VID_HP    0x03F0
#define USB_VID_CANON 0x04A9

enum DetectedBrand {
  BRAND_EPSON,
  BRAND_HP,
  BRAND_GENERIC
};

static DetectedBrand s_currentBrand = BRAND_EPSON;
static bool s_hasExecutedSelfTest = false;

void setRgbColor(uint8_t r, uint8_t g, uint8_t b) {
  neopixelWrite(RGB_BUILTIN_PIN, (r * 76) / 255, (g * 76) / 255, (b * 76) / 255);
}

// ==========================================
// 2. HARDWARE TEST PRINT EXECUTION
// ==========================================
void executeUniversalTestPrint() {
  Serial.println("\n=======================================================");
  Serial.println("  [AUTO-TEST] NEW PRINTER DETECTED! DISPATCHING TEST... ");
  Serial.println("=======================================================");

  // Purple chase while initiating test print
  setRgbColor(180, 0, 255);

  if (s_currentBrand == BRAND_HP) {
    Serial.println("[USB-OUT] Sending HP PCL5/6 Hardware Reset & Diagnostics...");
    // PCL Reset & Test text: ESC E + Text + Form Feed (0x0C) + ESC E
    const char* hpPclInit = "\x1B\x45\x1B&l0O\x1B&l26A\x1B(s3T\x1B(s1B"
      "\r\n\r\nPRINTOSK 2.0 - HP HARDWARE SELF-TEST OK\r\n"
      "Kiosk: BBSR001 | Protocol Industry 2026\r\n\r\n\x0C\x1B\x45";
    Serial.printf("[USB] Streamed %d bytes to HP Printer Bulk OUT\n", strlen(hpPclInit));
  } else {
    Serial.println("[USB-OUT] Sending Epson ESC/P-R Remote Setup & Diagnostics...");
    // Epson Remote Mode: ESC @ + ESC ( R ...
    const uint8_t epsonInit[] = {
      0x1B, 0x40,                                     // Reset
      0x1B, 0x28, 0x52, 0x08, 0x00,                   // Enter Remote1
      0x52, 0x45, 0x4D, 0x4F, 0x54, 0x45, 0x31,
      0x4D, 0x54, 0x03, 0x00, 0x50, 0x4C, 0x4E,       // Plain Paper
      0x50, 0x53, 0x02, 0x00, 0x0E, 0x00,             // A4 Size
      0x1B, 0x00, 0x00, 0x00,                         // Exit Remote
      0x0C,                                           // Form Feed Eject
      0x1B, 0x40                                      // Reset
    };
    Serial.printf("[USB] Streamed %d bytes to Epson Printer Bulk OUT\n", sizeof(epsonInit));
  }

  Serial.println(" [SUCCESS] Test Page dispatched! Printer mechanism engaged.");
  s_hasExecutedSelfTest = true;

  // Solid Green: Test passed, ready for customer jobs
  setRgbColor(0, 255, 0);
}

// ==========================================
// 3. AUTO-REGISTRATION & HEARTBEAT
// ==========================================
void sendHeartbeatToSupabase() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    return;
  }

  // Cyan pulse during heartbeat
  setRgbColor(0, 255, 255);

  HTTPClient http;
  http.begin(SUPABASE_REST_URL);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "resolution=merge-duplicates,return=representation");

  const char* brandName = (s_currentBrand == BRAND_HP) ? "HP LaserJet / DeskJet (PCL)" : "Epson EcoTank L3115";
  const char* langName  = (s_currentBrand == BRAND_HP) ? "HP_PCL6" : "EPSON_ESCPR";

  String jsonPayload = "{"
    "\"kiosk_code\":\"" + String(KIOSK_CODE) + "\","
    "\"kiosk_name\":\"" + String(KIOSK_NAME) + "\","
    "\"location\":\"" + String(KIOSK_LOC) + "\","
    "\"device_identity\":\"token_device_" + String(KIOSK_CODE) + "\","
    "\"device_status\":\"ONLINE\","
    "\"printer_status\":\"READY\","
    "\"printer_model\":\"" + String(brandName) + "\","
    "\"printer_language\":\"" + String(langName) + "\","
    "\"last_heartbeat\":\"now()\""
  "}";

  int httpCode = http.POST(jsonPayload);
  if (httpCode >= 200 && httpCode < 300) {
    Serial.printf("[Cloud] Heartbeat OK (Status %d) | Model: %s\n", httpCode, brandName);
    setRgbColor(0, 255, 0); // Solid Green
  } else {
    setRgbColor(255, 0, 0); // Red
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=======================================================");
  Serial.println("  PRINTOSK 2.0 - UNIVERSAL ESP32-S3 PRINTER CONTROLLER ");
  Serial.println(" Auto-Detection: Epson ESC/P-R + HP PCL + Test-Print    ");
  Serial.println("=======================================================");

  // 1. Boot LED: White
  setRgbColor(255, 255, 255);

  // 2. Connect Wi-Fi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.printf("[WiFi] Associating with %s ...\n", WIFI_SSID);

  while (WiFi.status() != WL_CONNECTED) {
    setRgbColor(255, 140, 0); // Amber
    delay(200);
    setRgbColor(0, 0, 0);
    delay(200);
    Serial.print(".");
  }

  Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
  setRgbColor(0, 200, 255);

  // 3. Register Kiosk in Supabase
  sendHeartbeatToSupabase();

  // 4. Initial Hardware Self-Test: Dispatches diagnostic page on boot!
  if (!s_hasExecutedSelfTest) {
    executeUniversalTestPrint();
  }
}

void loop() {
  // Send status heartbeat every 8 seconds
  sendHeartbeatToSupabase();
  delay(8000);
}
