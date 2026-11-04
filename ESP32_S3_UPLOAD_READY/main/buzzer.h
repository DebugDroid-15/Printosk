#ifndef BUZZER_H
#define BUZZER_H

#include "esp_err.h"

#define CONFIG_BUZZER_GPIO 4

esp_err_t buzzer_init(void);
void buzzer_play_beep(uint32_t duration_ms);
void buzzer_play_success(void);
void buzzer_play_error(void);

#endif // BUZZER_H

