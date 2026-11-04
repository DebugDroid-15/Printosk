#ifndef RGB_STATUS_H
#define RGB_STATUS_H

#include "status_types.h"
#include "esp_err.h"

// Default WS2812 pin for ESP32-S3 DevKitC-1
#define CONFIG_RGB_LED_GPIO 48

esp_err_t rgb_status_init(void);
void rgb_status_set_state(device_state_t state);
void rgb_status_set_color(uint8_t r, uint8_t g, uint8_t b);

#endif // RGB_STATUS_H

