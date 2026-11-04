#ifndef USB_PRINTER_H
#define USB_PRINTER_H

#include "status_types.h"
#include "esp_err.h"

// Seiko Epson Corp USB VID and L3110/L3115 PID
#define EPSON_USB_VID 0x04B8
#define EPSON_USB_PID 0x1137

// USB Printer Class
#define USB_CLASS_PRINTER 0x07
#define USB_SUBCLASS_PRINTER 0x01

esp_err_t usb_printer_init(void);
bool usb_printer_is_connected(void);
esp_err_t usb_printer_get_status(printer_hardware_status_t *status);
esp_err_t usb_printer_send_chunk(const uint8_t *data, size_t length);

#endif // USB_PRINTER_H

