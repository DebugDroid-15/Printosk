#ifndef STATUS_TYPES_H
#define STATUS_TYPES_H

#include <stdint.h>
#include <stdbool.h>

typedef enum {
    DEVICE_STATE_BOOT,
    DEVICE_STATE_CONNECTING_WIFI,
    DEVICE_STATE_READY_IDLE,
    DEVICE_STATE_JOB_CLAIMED,
    DEVICE_STATE_DOWNLOADING,
    DEVICE_STATE_PRINTING,
    DEVICE_STATE_COMPLETED,
    DEVICE_STATE_ERROR_PRINTER,
    DEVICE_STATE_ERROR_WIFI,
    DEVICE_STATE_ERROR_OUT_OF_PAPER
} device_state_t;

typedef struct {
    bool paper_empty;
    bool paper_jam;
    bool cover_open;
    bool low_ink;
    bool is_online;
} printer_hardware_status_t;

#endif // STATUS_TYPES_H

