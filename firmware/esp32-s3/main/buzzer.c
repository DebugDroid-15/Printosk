#include "buzzer.h"
#include "driver/gpio.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

static const char *TAG = "BUZZER";

esp_err_t buzzer_init(void) {
    gpio_config_t io_conf = {
        .pin_bit_mask = (1ULL << CONFIG_BUZZER_GPIO),
        .mode = GPIO_MODE_OUTPUT,
        .pull_down_en = 0,
        .pull_up_en = 0,
        .intr_type = GPIO_INTR_DISABLE,
    };
    gpio_config(&io_conf);
    gpio_set_level(CONFIG_BUZZER_GPIO, 0);
    ESP_LOGI(TAG, "Buzzer initialized on GPIO %d", CONFIG_BUZZER_GPIO);
    return ESP_OK;
}

void buzzer_play_beep(uint32_t duration_ms) {
    gpio_set_level(CONFIG_BUZZER_GPIO, 1);
    vTaskDelay(pdMS_TO_TICKS(duration_ms));
    gpio_set_level(CONFIG_BUZZER_GPIO, 0);
}

void buzzer_play_success(void) {
    buzzer_play_beep(100);
    vTaskDelay(pdMS_TO_TICKS(50));
    buzzer_play_beep(100);
    vTaskDelay(pdMS_TO_TICKS(50));
    buzzer_play_beep(250);
}

void buzzer_play_error(void) {
    buzzer_play_beep(500);
    vTaskDelay(pdMS_TO_TICKS(100));
    buzzer_play_beep(500);
}

