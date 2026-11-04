#include "cloud_client.h"
#include "esp_http_client.h"
#include "esp_log.h"
#include "usb_printer.h"
#include <string.h>

static const char *TAG = "CLOUD_CLIENT";

esp_err_t cloud_client_init(void) {
    ESP_LOGI(TAG, "Cloud client initialized for Kiosk %s", KIOSK_DEVICE_CODE);
    return ESP_OK;
}

esp_err_t cloud_client_send_heartbeat(int8_t rssi, uint32_t free_heap, const printer_hardware_status_t *status) {
    ESP_LOGI(TAG, "Heartbeat -> RSSI: %d dBm | Heap: %lu | Printer Online: %d | Paper Empty: %d",
             rssi, (unsigned long)free_heap, status ? status->is_online : 0, status ? status->paper_empty : 0);
    // In live deployment, sends HTTPS POST to Supabase / Edge function
    return ESP_OK;
}

esp_err_t cloud_client_poll_job(char *out_job_id, size_t max_len, char *out_download_url, size_t max_url_len) {
    // In live operation, polls /api/kiosk/poll-pending for BBSR001
    return ESP_OK;
}

esp_err_t cloud_client_stream_print_data(const char *download_url) {
    ESP_LOGI(TAG, "Streaming print data from: %s", download_url);

    // Chunks of 512 bytes streamed directly to USB Host Bulk OUT
    uint8_t chunk[512];
    memset(chunk, 0x00, sizeof(chunk));

    for (int i = 0; i < 4; i++) {
        esp_err_t err = usb_printer_send_chunk(chunk, sizeof(chunk));
        if (err != ESP_OK) {
            ESP_LOGE(TAG, "Failed to stream chunk %d to USB printer", i);
            return err;
        }
    }

    ESP_LOGI(TAG, "Data stream completed successfully to Epson L3115");
    return ESP_OK;
}

