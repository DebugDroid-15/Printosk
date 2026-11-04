@echo off
setlocal

echo ========================================================
echo     PRINTOSK 2.0 - SAMPLE TEST FLASH TOOL (NO PRINTER)  
echo ========================================================
echo.

set PORT=%1
if "%PORT%"=="" (
    echo [!] Searching available serial ports...
    powershell -Command "[System.IO.Ports.SerialPort]::GetPortNames()"
    set /p PORT="Enter your ESP32-S3 COM Port (e.g. COM3, COM5): "
)

echo.
echo [*] Target Board: ESP32-S3 N16R8
echo [*] Selected Port: %PORT%
echo [*] Testing: Onboard WS2812 RGB LED + Wi-Fi (Manakusaku) + Supabase DB
echo.

echo [*] Step 1: Setting Target to ESP32-S3...
call idf.py set-target esp32s3
if %errorlevel% neq 0 (
    echo [ERROR] Failed to set target. Ensure ESP-IDF is installed and export.bat has been run.
    pause
    exit /b %errorlevel%
)

echo.
echo [*] Step 2: Compiling Sample Test Firmware...
call idf.py build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Check compiler logs.
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
echo  [SUCCESS] Test firmware uploaded successfully!        
echo ========================================================
echo.
echo Starting Serial Monitor (Press Ctrl+] to exit)...
call idf.py -p %PORT% monitor

