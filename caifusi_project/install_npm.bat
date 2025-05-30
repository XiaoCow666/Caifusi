@echo off
chcp 65001 >nul
cls
echo 正在打开npm安装指南...
echo.

python launcher.py --install-guide

echo.
echo 请按照安装指南安装Node.js和npm，安装完成后可以运行start.bat启动完整应用。
pause 