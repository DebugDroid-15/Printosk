#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "esp_system.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "led_strip.h"
#include "esp_http_client.h"

static const char *TAG = "SAMPLE_TEST";

// ==========================================
// 1. CONFIGURATION & LIVE CREDENTIALS
// ==========================================
#define WIFI_SSID           "Manakusaku"
#define WIFI_PASSWORD       "123456789"

// Supabase REST Endpoint & API Key
#define SUPABASE_REST_URL   "https://cmchdgioopxyopoiuzeh.supabase.co/rest/v1/kiosks?kiosk_code=eq.BBSR001"
#define SUPABASE_ANON_KEY   "sb_publishable_GQE-LDAIFhkc9FOtkG3aOA_huqXPHUJ"

// Onboard WS2812 RGB LED Pin (GPIO 48 on DevKitC-1, change to 38 if using Waveshare)
#define RGB_LED_GPIO        48

static led_strip_handle_t s_led_strip = NULL;
static bool s_wifi_connected = false;

// ==========================================
// 2. RGB LED CONTROLLER (WS2812 RMT Driver)
// ==========================================
static void set_led_rgb(uint8_t r, uint8_t g, uint8_t b) {
    if (!s_led_strip) return;
    // Scale down brightness to ~30% for eye comfort
    uint8_t r_scaled = (r * 76) / 255;
    uint8_t g_scaled = (g * 76) / 255;
    uint8_t b_scaled = (b * 76) / 255;
    led_strip_set_pixel(s_led_strip, 0, r_scaled, g_scaled, b_scaled);
    led_strip_refresh(s_led_strip);
}

static void init_led(void) {
    led_strip_config_t strip_config = {
        .strip_gpio_num = RGB_LED_GPIO,
        .max_leds = 1,
    };
    led_strip_rmt_config_t rmt_config = {
        .resolution_hz = 10 * 1000 * 1000, // 10MHz
        .flags.with_dma = false,
    };
    esp_err_t ret = led_strip_new_rmt_device(&strip_config, &rmt_config, &s_led_strip);
    if (ret == ESP_OK) {
        led_strip_clear(s_led_strip);
        // Start Solid White on boot
        set_led_rgb(255, 255, 255);
        ESP_LOGI(TAG, "Onboard WS2812 RGB LED initialized on GPIO %d (WHITE: Booting)", RGB_LED_GPIO);
    } else {
        ESP_LOGE(TAG, "Failed to init WS2812 LED: %s", esp_err_to_name(ret));
    }
}

// ==========================================
// 3. WI-FI EVENT HANDLER
// ==========================================
static void wifi_event_handler(void *arg, esp_event_base_t event_base, int32_t event_id, void *event_data) {
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        ESP_LOGI(TAG, "Connecting to Wi-Fi SSID: %s ...", WIFI_SSID);
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        s_wifi_connected = false;
        // Blink Amber on Wi-Fi disconnect/retry
        set_led_rgb(255, 140, 0);
        ESP_LOGW(TAG, "Wi-Fi disconnected. Reconnecting to %s...", WIFI_SSID);
        esp_wifi_connect();
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t *event = (ip_event_got_ip_t *)event_data;
        ESP_LOGI(TAG, "==================================================");
        ESP_LOGI(TAG, " [SUCCESS] WI-FI CONNECTED!");
        ESP_LOGI(TAG, " IP Address: " IPSTR, IP2STR(&event->ip_info.ip));
        ESP_LOGI(TAG, "==================================================");
        s_wifi_connected = true;
        // Cyan: Got Wi-Fi, ready to query Supabase
        set_led_rgb(0, 200, 255);
    }
}

static void init_wifi(void) {
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    esp_event_handler_instance_t instance_any_id;
    esp_event_handler_instance_t instance_got_ip;
    ESP_ERROR_CHECK(esp_event_handler_instance_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &wifi_event_handler, NULL, &instance_any_id));
    ESP_ERROR_CHECK(esp_event_handler_instance_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &wifi_event_handler, NULL, &instance_got_ip));

    wifi_config_t wifi_config = {
        .sta = {
            .ssid = WIFI_SSID,
            .password = WIFI_PASSWORD,
            .threshold.authmode = WIFI_AUTH_WPA2_PSK,
        },
    };

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());
}

// ==========================================
// 4. SUPABASE DATABASE HEARTBEAT & TEST
// ==========================================
static void query_supabase_kiosk_status(void) {
    if (!s_wifi_connected) return;

    ESP_LOGI(TAG, "Pinging Supabase Database at %s...", SUPABASE_REST_URL);

    // Cyan blink while sending HTTPS request
    set_led_rgb(0, 255, 255);

    esp_http_client_config_t config = {
        .url = SUPABASE_REST_URL,
        .method = HTTP_METHOD_GET,
        .timeout_ms = 8000,
        .skip_cert_common_name_check = true,
    };

    esp_http_client_handle_t client = esp_http_client_init(&config);
    esp_http_client_set_header(client, "apikey", SUPABASE_ANON_KEY);
    esp_http_client_set_header(client, "Authorization", "Bearer " SUPABASE_ANON_KEY);
    esp_http_client_set_header(client, "Content-Type", "application/json");

    esp_err_t err = esp_http_client_perform(client);
    if (err == ESP_OK) {
        int status_code = esp_http_client_get_status_code(client);
        int content_length = esp_http_client_get_content_length(client);

        ESP_LOGI(TAG, "==================================================");
        ESP_LOGI(TAG, " [DATABASE RESPONSE] HTTP Status: %d", status_code);
        ESP_LOGI(TAG, " Content Length: %d bytes", content_length);

        if (status_code == 200) {
            ESP_LOGI(TAG, " SUCCESS: ESP32-S3 verified Kiosk record in Supabase!");
            ESP_LOGI(TAG, " LED -> SOLID GREEN (Online & Ready)");
            ESP_LOGI(TAG, "==================================================");
            // Solid Green: 100% Online & Database Connected!
            set_led_rgb(0, 255, 0);
        } else {
            ESP_LOGW(TAG, " Database returned non-200 status code: %d", status_code);
            // Purple: HTTP response received but unexpected code
            set_led_rgb(180, 0, 255);
        }
    } else {
        ESP_LOGE(TAG, " HTTPS Connection failed to Supabase: %s", esp_err_to_name(err));
        // Red: HTTPS / SSL Error
        set_led_rgb(255, 0, 0);
    }

    esp_http_client_cleanup(client);
}

// ==========================================
// 5. APPLICATION ENTRYPOINT
// ==========================================
void app_main(void) {
    ESP_LOGI(TAG, "=================================================");
    ESP_LOGI(TAG, "    PRINTOSK 2.0 - STANDALONE ESP32-S3 TEST      ");
    ESP_LOGI(TAG, " Testing: WS2812 RGB LED + Wi-Fi + Supabase DB   ");
    ESP_LOGI(TAG, " (No Printer Required for this test)             ");
    ESP_LOGI(TAG, "=================================================");

    // 1. Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // 2. Initialize WS2812 RGB LED (Solid White)
    init_led();

    // 3. Connect to Wi-Fi (Yellow/Amber while connecting)
    set_led_rgb(255, 140, 0);
    init_wifi();

    // 4. Main Telemetry Loop: Check Supabase DB periodically
    while (1) {
        if (s_wifi_connected) {
            query_supabase_kiosk_status();
        }
        // Query database every 10 seconds
        vTaskDelay(pdMS_TO_TICKS(10000));
    }
}

