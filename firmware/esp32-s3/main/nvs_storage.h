#ifndef NVS_STORAGE_H
#define NVS_STORAGE_H

#include <stdbool.h>
#include <stdint.h>
#include "esp_err.h"

#define NVS_JOB_NAMESPACE "print_job"
#define NVS_KEY_LAST_JOB  "last_job_id"
#define NVS_KEY_JOB_STATE "job_state"

typedef enum {
    NVS_JOB_STATE_NONE = 0,
    NVS_JOB_STATE_CLAIMED,
    NVS_JOB_STATE_PRINTING,
    NVS_JOB_STATE_COMPLETED
} nvs_job_state_t;

esp_err_t nvs_storage_init(void);
esp_err_t nvs_storage_save_job(const char *job_id, nvs_job_state_t state);
esp_err_t nvs_storage_get_last_job(char *out_job_id, size_t max_len, nvs_job_state_t *out_state);
esp_err_t nvs_storage_clear_job(void);

#endif // NVS_STORAGE_H

