@echo off
echo Stopping IIoT Demo...
taskkill /f /im node.exe > nul 2>&1
taskkill /f /im python.exe > nul 2>&1
echo Demo stopped successfully! 