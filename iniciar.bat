@echo off
rem Arranca Cromanenos en Windows e abre o navegador. Non precisa instalar nada.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\serve.ps1"
if errorlevel 1 pause
