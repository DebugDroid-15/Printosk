/*
 * PRINTOSK 2.0 - LIVE ESP32-S3 CLIENT WITH AUTO-REGISTRATION & DYNAMIC HEARTBEAT
 * Tests: Onboard WS2812 RGB LED (GPIO 48) + Wi-Fi Connection + Supabase Auto-Registration
 *
 * Behavior:
 * 1. Boot: Connects to Wi-Fi "Manakusaku"
 * 2. Auto-registers itself into Supabase database (Upsert)
 * 3. Sends Heartbeat every 8 seconds with printer status
 * 4. LED Color Codes:
 *    - Amber: Connecting to Wi-Fi
 *    - Cyan: Sending Heartbeat
 *    - Solid Green: Heartbeat Verified in Cloud (Online)
 *    - Red: Connection Failure
 */

#include <WiFi.h>
#include <HTTPClient.h>

// ==========================================
// 1. CONFIGURATION
// ==========================================
const char* WIFI_SSID     = "Manakusaku";
const char* WIFI_PASSWORD = "123456789";

// Kiosk Identification
const char* KIOSK_CODE    = "BBSR001";
const char* KIOSK_NAME    = "Campus Central Library Kiosk";
const char* KIOSK_LOC     = "Ground Floor, Central Library";

// Supabase REST Endpoint & API Key
const char* SUPABASE_REST_URL = "https://cmchdgioopxyopoiuzeh.supabase.co/rest/v1/kiosks";
const char* SUPABASE_KEY      = "sb_publishable_GQE-LDAIFhkc9FOtkG3aOA_huqXPHUJ";

// Built-in RGB LED Pin for ESP32-S3 DevKitC-1
#define RGB_BUILTIN_PIN 48

void setRgbColor(uint8_t r, uint8_t g, uint8_t b) {
  neopixelWrite(RGB_BUILTIN_PIN, (r * 76) / 255, (g * 76) / 255, (b * 76) / 255);
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=================================================");
  Serial.println("  PRINTOSK 2.0 - AUTO-REGISTRATION & HEARTBEAT   ");
  Serial.println(" Kiosk Code: BBSR001 | Target: ESP32-S3 N16R8    ");
  Serial.println("=================================================");

  // 1. Boot: White
  setRgbColor(255, 255, 255);

  // 2. Start Wi-Fi Connection
  Serial.printf("[WiFi] Connecting to SSID: %s ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // While connecting, blink Amber
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    setRgbColor(255, 140, 0); // Amber
    delay(250);
    setRgbColor(0, 0, 0);
    delay(250);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n==================================================");
    Serial.println(" [SUCCESS] WI-FI CONNECTED!");
    Serial.print(" Local IP: ");
    Serial.println(WiFi.localIP());
    Serial.printf(" RSSI: %d dBm\n", WiFi.RSSI());
    Serial.println("==================================================");
    setRgbColor(0, 200, 255); // Cyan
  } else {
    Serial.println("\n[ERROR] Failed to connect to Wi-Fi. Check SSID/Password.");
    setRgbColor(255, 0, 0); // Red
  }
}

// Sends an UPSERT request to Supabase to register or update heartbeat
void sendHeartbeatToSupabase() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Lost connection! Reconnecting...");
    setRgbColor(255, 140, 0);
    WiFi.reconnect();
    return;
  }

  // Cyan blink while sending HTTP heartbeat
  setRgbColor(0, 255, 255);

  HTTPClient http;
  http.begin(SUPABASE_REST_URL);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  http.addHeader("Content-Type", "application/json");
  // Prefer return=representation and resolution=merge-duplicates (PostgreSQL UPSERT on kiosk_code)
  http.addHeader("Prefer", "resolution=merge-duplicates,return=representation");

  // Construct JSON payload: Auto-registers if missing, updates timestamp if existing!
  String jsonPayload = "{"
    "\"kiosk_code\":\"" + String(KIOSK_CODE) + "\","
    "\"kiosk_name\":\"" + String(KIOSK_NAME) + "\","
    "\"location\":\"" + String(KIOSK_LOC) + "\","
    "\"device_identity\":\"token_device_" + String(KIOSK_CODE) + "\","
    "\"device_status\":\"ONLINE\","
    "\"printer_status\":\"READY\","
    "\"printer_model\":\"Epson EcoTank L3115\","
    "\"printer_language\":\"EPSON_ESCPR\","
    "\"last_heartbeat\":\"now()\""
  "}";

  Serial.println("[Cloud] Dispatching Heartbeat to Supabase...");
  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    Serial.printf("[Cloud] SUCCESS! HTTP Status: %d | Kiosk synchronized!\n", httpResponseCode);
    // Solid Green: 100% Online & Database Synchronized!
    setRgbColor(0, 255, 0);
  } else {
    Serial.printf("[Cloud ERROR] HTTP POST failed, code: %d | %s\n", httpResponseCode, http.errorToString(httpResponseCode).c_str());
    String response = http.getString();
    Serial.println("[Cloud ERROR Detail]: " + response);
    setRgbColor(255, 0, 0); // Red on error
  }

  http.end();
}

void loop() {
  sendHeartbeatToSupabase();
  // Send heartbeat pulse every 8 seconds
  delay(8000);
}
