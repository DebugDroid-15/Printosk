#include <stdio.h>
#include <string.h>
#include "esp_log.h"
#include "esp_system.h"
#include "status_types.h"
#include "rgb_status.h"
#include "buzzer.h"
#include "usb_printer.h"
#include "nvs_storage.h"
#include "wifi_manager.h"
#include "cloud_client.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

static const char *TAG = "MAIN";

void app_main(void) {
    ESP_LOGI(TAG, "=========================================");
    ESP_LOGI(TAG, "      PRINTOSK 2.0 KIOSK FIRMWARE        ");
    ESP_LOGI(TAG, " Target: ESP32-S3 N16R8 | Printer: L3115 ");
    ESP_LOGI(TAG, "=========================================");

    // 1. Initialize NVS Storage & Check Power-Loss Recovery
    nvs_storage_init();
    char last_job[32] = {0};
    nvs_job_state_t last_state = NVS_JOB_STATE_NONE;
    if (nvs_storage_get_last_job(last_job, sizeof(last_job), &last_state) == ESP_OK) {
        if (last_state == NVS_JOB_STATE_PRINTING) {
            ESP_LOGW(TAG, "REBOOT RECOVERY: Device restarted mid-print of job %s. Halting auto-reprint to avoid duplicate waste.", last_job);
            nvs_storage_save_job(last_job, NVS_JOB_STATE_CLAIMED);
        }
    }

    // 2. Initialize Visual (WS2812 RGB) & Audio (Buzzer)
    rgb_status_init();
    buzzer_init();
    rgb_status_set_state(DEVICE_STATE_BOOT);
    buzzer_play_beep(100);

    // 3. Initialize Station Wi-Fi
    rgb_status_set_state(DEVICE_STATE_CONNECTING_WIFI);
    wifi_manager_init();

    // 4. Initialize Native USB Host for Epson L3115
    esp_err_t ret = usb_printer_init();
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "USB Host init failed");
        rgb_status_set_state(DEVICE_STATE_ERROR_PRINTER);
        buzzer_play_error();
    } else {
        ESP_LOGI(TAG, "USB Host initialized");
    }

    // 5. Initialize Cloud Client
    cloud_client_init();

    // Transition to Ready / Idle
    rgb_status_set_state(DEVICE_STATE_READY_IDLE);
    buzzer_play_success();
    ESP_LOGI(TAG, "Printosk 2.0 Kiosk Node is READY and online");

    // Main telemetry & status loop
    printer_hardware_status_t status;
    uint32_t loop_counter = 0;

    while (1) {
        if (usb_printer_is_connected()) {
            usb_printer_get_status(&status);
            if (status.paper_empty) {
                rgb_status_set_state(DEVICE_STATE_ERROR_OUT_OF_PAPER);
            }
        }

        // Send periodic heartbeat every 15 seconds
        if (++loop_counter % 3 == 0) {
            int8_t rssi = wifi_manager_get_rssi();
            uint32_t free_heap = esp_get_free_heap_size();
            cloud_client_send_heartbeat(rssi, free_heap, &status);
        }

        vTaskDelay(pdMS_TO_TICKS(5000));
    }
}
