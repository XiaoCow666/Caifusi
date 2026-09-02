@echo off
chcp 65001 >nul
cls
echo ================================================
echo   财赋思应用启动程序 (本地网络版)
echo ================================================
echo.

set SCRIPT_DIR=%~dp0

echo [1/5] 设置环境变量...
set DEV_MODE=true
REM ZHIPUAI_API_KEY must be provided by the environment; never hard-code credentials here.
set PUBLIC_IP=true

REM 设置前端和后端端口，如果默认端口被占用可以修改这里
set FRONTEND_PORT=3000
set BACKEND_PORT=5001

REM 检查端口是否被占用，更严格的检测
echo 检查端口占用情况...
:CHECK_FRONTEND_PORT
netstat -ano | findstr ":%FRONTEND_PORT% " > nul
if %errorlevel% equ 0 (
    echo [提示] 端口 %FRONTEND_PORT% 已被占用，尝试使用下一个端口...
    set /a FRONTEND_PORT+=1
    if %FRONTEND_PORT% geq 3010 (
        echo [警告] 已尝试多个端口，全部被占用，将使用3099端口...
        set FRONTEND_PORT=3099
    ) else (
        goto CHECK_FRONTEND_PORT
    )
)
echo [成功] 将使用前端端口: %FRONTEND_PORT%

:CHECK_BACKEND_PORT
netstat -ano | findstr ":%BACKEND_PORT% " > nul
if %errorlevel% equ 0 (
    echo [提示] 端口 %BACKEND_PORT% 已被占用，尝试使用下一个端口...
    set /a BACKEND_PORT+=1
    if %BACKEND_PORT% geq 5010 (
        echo [警告] 已尝试多个端口，全部被占用，将使用5099端口...
        set BACKEND_PORT=5099
    ) else (
        goto CHECK_BACKEND_PORT
    )
)
echo [成功] 将使用后端端口: %BACKEND_PORT%

echo [2/5] 安装后端依赖(修复版本)...
cd /d %SCRIPT_DIR%\backend
C:\Python313\python.exe -m pip install -r requirements-fixed.txt
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败，请查看错误信息。
    pause
    exit /b %errorlevel%
)

echo [3/5] 修复前端路径设置...
cd /d %SCRIPT_DIR%
node fix-homepage.js
if %errorlevel% neq 0 (
    echo [警告] 修复homepage可能失败，但将继续尝试构建。
)

echo [4/5] 构建前端生产版本...
cd /d %SCRIPT_DIR%\frontend
call npm run build
if %errorlevel% neq 0 (
    echo [错误] 前端构建失败，请查看错误信息。
    pause
    exit /b %errorlevel%
)

echo [5/5] 启动服务...
start cmd /k "title 财赋思-后端服务 && color 0A && cd /d %SCRIPT_DIR% && C:\Python313\python.exe -m backend.run_dev"
rem 使用--listen 0.0.0.0确保监听所有网络接口，增加--public选项
start cmd /k "title 财赋思-前端服务(本地网络) && color 0B && cd /d %SCRIPT_DIR%\frontend && npx http-server build -p %FRONTEND_PORT% --cors -a 0.0.0.0"

REM 获取本机IP地址用于日志
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r "IPv4.*172\."') do set LOCAL_IP=%%a
set LOCAL_IP=%LOCAL_IP:~1%
echo 本机IP: %LOCAL_IP%

echo.
echo ================================================
echo                  启动完成!
echo ================================================
echo.
echo  本地前端: http://localhost:%FRONTEND_PORT%
echo  本地IP前端: http://%LOCAL_IP%:%FRONTEND_PORT%
echo  本地后端: http://localhost:%BACKEND_PORT%
echo.
echo ================================================
echo               本地网络访问说明
echo ================================================
echo.
echo  1. 已配置服务器监听所有网络接口 (0.0.0.0)
echo  2. 添加了CORS支持，允许跨域请求
echo  3. 可通过本地网络IP地址访问：http://%LOCAL_IP%:%FRONTEND_PORT%
echo.
pause 