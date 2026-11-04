#ifndef CLOUD_CLIENT_H
#define CLOUD_CLIENT_H

#include <stdbool.h>
#include <stdint.h>
#include "esp_err.h"
#include "status_types.h"

#define KIOSK_DEVICE_CODE "BBSR001"
#define SUPABASE_BASE_URL "https://printosk.vercel.app"

esp_err_t cloud_client_init(void);
esp_err_t cloud_client_send_heartbeat(int8_t rssi, uint32_t free_heap, const printer_hardware_status_t *status);
esp_err_t cloud_client_poll_job(char *out_job_id, size_t max_len, char *out_download_url, size_t max_url_len);
esp_err_t cloud_client_stream_print_data(const char *download_url);

#endif // CLOUD_CLIENT_H

