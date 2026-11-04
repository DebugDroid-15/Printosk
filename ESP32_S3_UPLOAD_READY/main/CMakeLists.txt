idf_component_register(
    SRCS "main.c"
         "wifi_manager.c"
         "rgb_status.c"
         "buzzer.c"
         "cloud_client.c"
         "usb_printer.c"
         "nvs_storage.c"
    INCLUDE_DIRS "."
    REQUIRES esp_wifi esp_event nvs_flash esp_http_client led_strip usb
)

