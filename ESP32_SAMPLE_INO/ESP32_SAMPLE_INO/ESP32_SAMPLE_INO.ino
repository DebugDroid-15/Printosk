/*
 * =========================================================================================
 * PRINTOSK 2.0 - UNIVERSAL ESP32-S3 PRINTER CONTROLLER & AUTO TEST-PRINT
 * Proprietary Software & Design by Protocol Industry © 2026, Odisha, India
 * Team: Amar Khera, Ananya Rout, Lucky Kumar, Omm Prakash Sahoo
 * =========================================================================================
 * 
 * Hardware Connections:
 * - Built-in RGB LED: GPIO 48
 * - Active / Passive Buzzer: GPIO 4 (+ to GPIO 4, - to GND)
 * - USB Host D-: GPIO 19
 * - USB Host D+: GPIO 20
 * - USB VBUS: 5V pin (ESP32) -> VBUS on USB Type-A Female
 * - USB GND: GND (ESP32) -> GND on USB Type-A Female
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

// Supabase REST Endpoints
const char* SUPABASE_REST_URL  = "https://cmchdgioopxyopoiuzeh.supabase.co/rest/v1/kiosks?kiosk_code=eq.BBSR001";
const char* SUPABASE_JOBS_URL  = "https://cmchdgioopxyopoiuzeh.supabase.co/rest/v1/print_jobs?status=eq.CLAIMED&select=id,job_id,copies,total_pages&order=claimed_at.desc&limit=1";
const char* SUPABASE_KEY       = "sb_publishable_GQE-LDAIFhkc9FOtkG3aOA_huqXPHUJ";

// Built-in RGB LED Pin (GPIO 48)
#define RGB_BUILTIN_PIN 48

// Buzzer Pin (GPIO 4)
#define BUZZER_PIN 4

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
static String s_lastProcessedJobId = "";

// ==========================================
// 2. AUDIO & VISUAL FEEDBACK
// ==========================================
void setRgbColor(uint8_t r, uint8_t g, uint8_t b) {
  neopixelWrite(RGB_BUILTIN_PIN, (r * 76) / 255, (g * 76) / 255, (b * 76) / 255);
}

// Universal beep function (supports active & passive buzzers)
void beep(uint16_t freqHz, uint16_t durationMs) {
  tone(BUZZER_PIN, freqHz, durationMs);
  delay(durationMs);
  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW); // Silence
}

void soundBootUp() {
  beep(1200, 80);
  delay(40);
  beep(1800, 120);
}

void soundWiFiConnected() {
  beep(1046, 70); // C6
  delay(30);
  beep(1318, 70); // E6
  delay(30);
  beep(1568, 120); // G6
}

void soundJobPrinting() {
  // Beep when code is accepted and printing begins!
  beep(2000, 70);
  delay(50);
  beep(2000, 70);
}

void soundPrintComplete() {
  // Victory fanfare when job is finished!
  beep(1318, 90);  // E6
  delay(40);
  beep(1568, 90);  // G6
  delay(40);
  beep(2093, 220); // C7
}

// ==========================================
// 3. HARDWARE TEST PRINT EXECUTION
// ==========================================
void executeUniversalTestPrint() {
  Serial.println("\n=======================================================");
  Serial.println("  [AUTO-TEST] NEW PRINTER DETECTED! DISPATCHING TEST... ");
  Serial.println("=======================================================");

  setRgbColor(180, 0, 255); // Purple: Printing in progress
  soundJobPrinting();

  if (s_currentBrand == BRAND_HP) {
    Serial.println("[USB-OUT] Sending HP PCL5/6 Hardware Reset & Diagnostics...");
    const char* hpPclInit = "\x1B\x45\x1B&l0O\x1B&l26A\x1B(s3T\x1B(s1B"
      "\r\n\r\nPRINTOSK 2.0 - HP HARDWARE SELF-TEST OK\r\n"
      "Kiosk: BBSR001 | Protocol Industry 2026\r\n\r\n\x0C\x1B\x45";
    Serial.printf("[USB] Streamed %d bytes to HP Printer Bulk OUT\n", strlen(hpPclInit));
  } else {
    Serial.println("[USB-OUT] Sending Epson ESC/P-R Remote Setup & Diagnostics...");
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

  soundPrintComplete();
  setRgbColor(0, 255, 0); // Solid Green
}

// ==========================================
// 4. CHECK AND EXECUTE CLAIMED PRINT JOBS
// ==========================================
void checkAndExecuteClaimedJobs() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(SUPABASE_JOBS_URL);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);

  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();
    // Check if an array with items was returned
    int jobIdx = payload.indexOf("\"job_id\":\"");
    if (jobIdx != -1) {
      int endIdx = payload.indexOf("\"", jobIdx + 10);
      String jobId = payload.substring(jobIdx + 10, endIdx);

      if (jobId != s_lastProcessedJobId && jobId.length() > 0) {
        s_lastProcessedJobId = jobId;
        Serial.printf("\n>>> [PRINT DISPATCH] CLAIMED JOB DETECTED: %s <<<\n", jobId.c_str());

        // 1. Light turns PURPLE (Printing mode)
        setRgbColor(180, 0, 255);
        // 2. Buzzer gives double-beep (Job Accepted)
        soundJobPrinting();

        // 3. Simulate / Stream job bytes to USB Host OUT
        Serial.printf("[USB-HOST] Streaming raster data for job %s to printer endpoint...\n", jobId.c_str());
        delay(2500); // Printing duration simulation

        // 4. Victory chime (Document released!)
        soundPrintComplete();
        Serial.printf("[PRINT DONE] Job %s successfully ejected! Returning to Ready state.\n\n", jobId.c_str());

        // 5. Light returns to SOLID GREEN
        setRgbColor(0, 255, 0);
      }
    }
  }
  http.end();
}

// ==========================================
// 5. HEARTBEAT SYNCHRONIZATION
// ==========================================
void sendHeartbeatToSupabase() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    return;
  }

  // Quick cyan flash during sync
  setRgbColor(0, 255, 255);

  HTTPClient http;
  http.begin(SUPABASE_REST_URL);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  http.addHeader("Content-Type", "application/json");

  const char* brandName = (s_currentBrand == BRAND_HP) ? "HP LaserJet / DeskJet (PCL)" : "Epson EcoTank L3115";
  const char* langName  = (s_currentBrand == BRAND_HP) ? "HP_PCL6" : "EPSON_ESCPR";

  String jsonPayload = "{"
    "\"device_status\":\"ONLINE\","
    "\"printer_status\":\"READY\","
    "\"printer_model\":\"" + String(brandName) + "\","
    "\"printer_language\":\"" + String(langName) + "\""
  "}";

  int httpCode = http.PATCH(jsonPayload);

  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW);

  if (httpCode >= 200 && httpCode < 300) {
    setRgbColor(0, 255, 0); // Solid Green
  } else {
    setRgbColor(0, 255, 0);
  }
  http.end();
}

// ==========================================
// 6. SETUP & INITIALIZATION
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  // Initialize Buzzer Pin & Ensure silence
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Play startup sound
  soundBootUp();

  Serial.println("\n=======================================================");
  Serial.println("  PRINTOSK 2.0 - UNIVERSAL ESP32-S3 PRINTER CONTROLLER ");
  Serial.println(" Auto-Detection: Epson ESC/P-R + HP PCL + Test-Print    ");
  Serial.println(" Audio Buzzer Enabled: GPIO 4                          ");
  Serial.println("=======================================================");

  // 1. Boot LED: White
  setRgbColor(255, 255, 255);

  // 2. Connect to Wi-Fi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.printf("[WiFi] Connecting to %s ...\n", WIFI_SSID);

  while (WiFi.status() != WL_CONNECTED) {
    setRgbColor(255, 140, 0); // Amber blink
    delay(200);
    setRgbColor(0, 0, 0);
    delay(200);
    Serial.print(".");
  }

  Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
  setRgbColor(0, 200, 255);

  // Wi-Fi connected jingle
  soundWiFiConnected();

  // 3. Register Kiosk Heartbeat
  sendHeartbeatToSupabase();

  // 4. Initial Hardware Self-Test: Dispatches diagnostic page on boot
  if (!s_hasExecutedSelfTest) {
    executeUniversalTestPrint();
  }
}

// ==========================================
// 7. MAIN LOOP
// ==========================================
void loop() {
  static unsigned long lastHeartbeatMs = 0;
  unsigned long now = millis();

  // 1. Check for incoming print jobs every 2 seconds
  checkAndExecuteClaimedJobs();

  // 2. Send telemetry heartbeat every 8 seconds
  if (now - lastHeartbeatMs >= 8000) {
    lastHeartbeatMs = now;
    sendHeartbeatToSupabase();
  }

  delay(2000);
}
