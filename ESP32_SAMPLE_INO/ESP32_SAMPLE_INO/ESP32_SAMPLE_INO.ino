/*
 * PRINTOSK 2.0 - SAMPLE BENCH TEST FOR ESP32-S3 (NO PRINTER REQUIRED)
 * Tests: Onboard WS2812 RGB LED (GPIO 48) + Wi-Fi Connection + Supabase Database Query
 *
 * Board Settings in Arduino IDE:
 * Board: "ESP32S3 Dev Module"
 * USB CDC On Boot: "Enabled"
 * Flash Size: "16MB (128Mb)"
 * PSRAM: "OPI PSRAM"
 * Port: COM3
 */

#include <WiFi.h>
#include <HTTPClient.h>

// ==========================================
// 1. WI-FI & SUPABASE CONFIGURATION
// ==========================================
const char* WIFI_SSID     = "Manakusaku";
const char* WIFI_PASSWORD = "123456789";

// Live Supabase REST Endpoint & API Key
const char* SUPABASE_URL  = "https://cmchdgioopxyopoiuzeh.supabase.co/rest/v1/kiosks?kiosk_code=eq.BBSR001";
const char* SUPABASE_KEY  = "sb_publishable_GQE-LDAIFhkc9FOtkG3aOA_huqXPHUJ";

// Built-in RGB LED Pin for ESP32-S3 DevKitC-1
#define RGB_BUILTIN_PIN 48

void setRgbColor(uint8_t r, uint8_t g, uint8_t b) {
  // Use ESP32-S3 native neopixelWrite (built into Arduino-ESP32 core)
  neopixelWrite(RGB_BUILTIN_PIN, (r * 76) / 255, (g * 76) / 255, (b * 76) / 255);
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=================================================");
  Serial.println("    PRINTOSK 2.0 - STANDALONE ESP32-S3 TEST      ");
  Serial.println(" Testing: WS2812 RGB LED + Wi-Fi + Supabase DB   ");
  Serial.println(" (No Printer Required for this test)             ");
  Serial.println("=================================================");

  // 1. Boot: Solid White
  setRgbColor(255, 255, 255);
  Serial.println("[LED] State: WHITE (Booting)");

  // 2. Start Wi-Fi Connection
  Serial.printf("[WiFi] Connecting to SSID: %s ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // While connecting, blink Amber / Yellow
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
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
    Serial.print(" IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.printf(" Signal RSSI: %d dBm\n", WiFi.RSSI());
    Serial.println("==================================================");
    // Cyan: Connected to Wi-Fi, querying Supabase
    setRgbColor(0, 200, 255);
  } else {
    Serial.println("\n[ERROR] Failed to connect to Wi-Fi. Check SSID/Password.");
    setRgbColor(255, 0, 0); // Red
  }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[DB] Querying Supabase Database (kiosks table)...");
    setRgbColor(0, 255, 255); // Cyan (Pinging)

    HTTPClient http;
    http.begin(SUPABASE_URL);
    http.addHeader("apikey", SUPABASE_KEY);
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
    http.addHeader("Content-Type", "application/json");

    int httpResponseCode = http.GET();

    if (httpResponseCode > 0) {
      Serial.printf("[DB RESPONSE] HTTP Status Code: %d\n", httpResponseCode);
      String payload = http.getString();
      Serial.println("[DB PAYLOAD]: " + payload);

      if (httpResponseCode == 200) {
        Serial.println(">>> SUCCESS! Kiosk record verified in Supabase! <<<");
        Serial.println(">>> LED -> SOLID GREEN (Online & Ready) <<<");
        // Solid Green: 100% Online & Database Connected!
        setRgbColor(0, 255, 0);
      } else {
        setRgbColor(180, 0, 255); // Purple: Unexpected HTTP code
      }
    } else {
      Serial.printf("[DB ERROR] HTTP GET failed, error: %s\n", http.errorToString(httpResponseCode).c_str());
      setRgbColor(255, 0, 0); // Red
    }

    http.end();
  } else {
    Serial.println("[WiFi] Disconnected! Reconnecting...");
    setRgbColor(255, 140, 0);
    WiFi.reconnect();
  }

  // Poll database every 10 seconds
  delay(10000);
}
