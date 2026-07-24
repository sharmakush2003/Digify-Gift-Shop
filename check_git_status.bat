@echo off
title Git Sync - Digify-Gift-Shop
powershell -ExecutionPolicy Bypass -File "%~dp0check_git_status.ps1"
pause