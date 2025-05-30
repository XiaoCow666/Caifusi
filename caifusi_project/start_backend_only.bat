@echo off
chcp 65001 >nul
cls
echo 正在启动财赋思后端服务...
echo.

python launcher.py --backend-only

echo.
echo 启动器已退出。后端服务仍在后台运行。
pause 