@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0doc-thu.ps1" -Play
if errorlevel 1 pause
