@echo off
REM MyOS Disk Analysis Launcher - anal_probe.bat
REM Launches the Analyze-DiskUsage.ps1 script in a new CMD window.
REM User can control the base path and view verbose output.

REM --- Configuration: Set the full path to your Analyze-DiskUsage.ps1 script ---
REM >>>>>>>>>>> ENSURE THIS PATH IS CORRECT FOR YOUR SYSTEM <<<<<<<<<<<
SET "PS_SCRIPT_PATH=C:\MyOS\int_libs\Scripts\Analyze-DiskUsage.ps1"
REM --- End Configuration ---

REM Launch PowerShell in a new CMD window
start "MyOS Disk Analyzer - anal_probe" powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT_PATH%"