#include "rgb_status.h"
#include "esp_log.h"
#include "led_strip.h"

static const char *TAG = "RGB_STATUS";
static led_strip_handle_t led_strip;

esp_err_t rgb_status_init(void) {
    ESP_LOGI(TAG, "Initializing WS2812 RGB LED on GPIO %d", CONFIG_RGB_LED_GPIO);

    led_strip_config_t strip_config = {
        .strip_gpio_num = CONFIG_RGB_LED_GPIO,
        .max_leds = 1,
    };
    led_strip_rmt_config_t rmt_config = {
        .resolution_hz = 10 * 1000 * 1000, // 10MHz
        .flags.with_dma = false,
    };

    esp_err_t ret = led_strip_new_rmt_device(&strip_config, &rmt_config, &led_strip);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to create RMT device for LED strip");
        return ret;
    }

    led_strip_clear(led_strip);
    return ESP_OK;
}

void rgb_status_set_color(uint8_t r, uint8_t g, uint8_t b) {
    if (!led_strip) return;
    // Apply 30% brightness limit to protect LED and eyes
    uint8_t r_scaled = (r * 76) / 255;
    uint8_t g_scaled = (g * 76) / 255;
    uint8_t b_scaled = (b * 76) / 255;
    led_strip_set_pixel(led_strip, 0, r_scaled, g_scaled, b_scaled);
    led_strip_refresh(led_strip);
}

void rgb_status_set_state(device_state_t state) {
    switch (state) {
        case DEVICE_STATE_BOOT:
            rgb_status_set_color(255, 255, 255); // Solid White
            break;
        case DEVICE_STATE_CONNECTING_WIFI:
            rgb_status_set_color(255, 180, 0);   // Amber / Yellow
            break;
        case DEVICE_STATE_READY_IDLE:
            rgb_status_set_color(0, 255, 0);     // Green
            break;
        case DEVICE_STATE_JOB_CLAIMED:
        case DEVICE_STATE_DOWNLOADING:
            rgb_status_set_color(0, 200, 255);   // Cyan
            break;
        case DEVICE_STATE_PRINTING:
            rgb_status_set_color(180, 0, 255);   // Purple / Magenta
            break;
        case DEVICE_STATE_COMPLETED:
            rgb_status_set_color(0, 255, 120);   // Bright Mint Green
            break;
        case DEVICE_STATE_ERROR_OUT_OF_PAPER:
            rgb_status_set_color(255, 80, 0);    // Orange
            break;
        case DEVICE_STATE_ERROR_PRINTER:
        case DEVICE_STATE_ERROR_WIFI:
        default:
            rgb_status_set_color(255, 0, 0);     // Red
            break;
    }
}

