@echo off
rem Arranca Cromanenos en Windows e abre o navegador. Non precisa instalar nada.
rem A ultima orde vai enteira nunha soa lina para que unha actualizacion poida
rem substituir este ficheiro mentres esta en marcha.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\serve.ps1" & (if errorlevel 1 pause) & exit /b
