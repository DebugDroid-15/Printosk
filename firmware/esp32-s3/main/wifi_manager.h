#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <stdbool.h>
#include "esp_err.h"

#define DEFAULT_WIFI_SSID "Printosk_Campus_Kiosk"
#define DEFAULT_WIFI_PASS "printosk2026"

esp_err_t wifi_manager_init(void);
bool wifi_manager_is_connected(void);
int8_t wifi_manager_get_rssi(void);

#endif // WIFI_MANAGER_H

