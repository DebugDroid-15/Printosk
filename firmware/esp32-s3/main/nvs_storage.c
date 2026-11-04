#include "nvs_storage.h"
#include "nvs_flash.h"
#include "esp_log.h"
#include <string.h>

static const char *TAG = "NVS_STORAGE";

esp_err_t nvs_storage_init(void) {
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_LOGW(TAG, "Erasing flash due to version mismatch or no free pages");
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    return ret;
}

esp_err_t nvs_storage_save_job(const char *job_id, nvs_job_state_t state) {
    nvs_handle_t handle;
    esp_err_t err = nvs_open(NVS_JOB_NAMESPACE, NVS_READWRITE, &handle);
    if (err != ESP_OK) return err;

    err = nvs_set_str(handle, NVS_KEY_LAST_JOB, job_id);
    if (err == ESP_OK) {
        err = nvs_set_u8(handle, NVS_KEY_JOB_STATE, (uint8_t)state);
    }

    if (err == ESP_OK) {
        err = nvs_commit(handle);
        ESP_LOGI(TAG, "Persisted job %s with state %d to NVS", job_id, state);
    }

    nvs_close(handle);
    return err;
}

esp_err_t nvs_storage_get_last_job(char *out_job_id, size_t max_len, nvs_job_state_t *out_state) {
    nvs_handle_t handle;
    esp_err_t err = nvs_open(NVS_JOB_NAMESPACE, NVS_READONLY, &handle);
    if (err != ESP_OK) return err;

    size_t required_size = max_len;
    err = nvs_get_str(handle, NVS_KEY_LAST_JOB, out_job_id, &required_size);
    if (err == ESP_OK) {
        uint8_t state_val = 0;
        err = nvs_get_u8(handle, NVS_KEY_JOB_STATE, &state_val);
        if (err == ESP_OK && out_state) {
            *out_state = (nvs_job_state_t)state_val;
        }
    }

    nvs_close(handle);
    return err;
}

esp_err_t nvs_storage_clear_job(void) {
    nvs_handle_t handle;
    esp_err_t err = nvs_open(NVS_JOB_NAMESPACE, NVS_READWRITE, &handle);
    if (err != ESP_OK) return err;

    nvs_erase_all(handle);
    nvs_commit(handle);
    nvs_close(handle);
    ESP_LOGI(TAG, "Cleared last job from NVS");
    return ESP_OK;
}

