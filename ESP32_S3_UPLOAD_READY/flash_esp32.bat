@echo off
setlocal

echo ========================================================
echo     PRINTOSK 2.0 - ONE-CLICK ESP32-S3 FLASH TOOL       
echo ========================================================
echo.

set PORT=%1
if "%PORT%"=="" (
    echo [!] No COM port specified. Usage: flash_esp32.bat COM5
    echo [!] Searching available serial ports...
    powershell -Command "[System.IO.Ports.SerialPort]::GetPortNames()"
    set /p PORT="Enter your ESP32-S3 COM Port (e.g. COM3, COM5): "
)

echo.
echo [*] Target Board: ESP32-S3 N16R8 (16MB Flash, 8MB Octal PSRAM)
echo [*] Selected Port: %PORT%
echo.

echo [*] Step 1: Setting Target to ESP32-S3...
call idf.py set-target esp32s3
if %errorlevel% neq 0 (
    echo [ERROR] Failed to set target. Ensure ESP-IDF is installed and export.bat has been run.
    pause
    exit /b %errorlevel%
)

echo.
echo [*] Step 2: Compiling Firmware...
call idf.py build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Check terminal logs above.
    pause
    exit /b %errorlevel%
)

echo.
echo [*] Step 3: Flashing Firmware to %PORT%...
call idf.py -p %PORT% flash
if %errorlevel% neq 0 (
    echo [ERROR] Flash failed! Ensure board is plugged in and not opened in another serial monitor.
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo  [SUCCESS] Firmware uploaded successfully to ESP32-S3! 
echo ========================================================
echo.
echo Starting Serial Monitor (Press Ctrl+] to exit)...
call idf.py -p %PORT% monitor

