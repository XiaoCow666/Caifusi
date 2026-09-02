@echo off
chcp 65001 >nul
cls
echo ================================================
echo   财赋思应用启动程序 (移动网络优化版-修复编码)
echo ================================================
echo.

set SCRIPT_DIR=%~dp0
set CPOLAR_PATH=E:\cpolar\cpolar\cpolar.exe

echo [1/7] 设置环境变量...
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

echo [2/7] 检查cpolar配置...
REM 确保cpolar目录存在
if not exist "E:\cpolar\cpolar\" (
    echo [错误] 未找到cpolar目录，请确保已正确安装cpolar!
    pause
    exit /b 1
)

REM 检查多个可能的cpolar配置文件位置
set CPOLAR_DIR=E:\cpolar\cpolar
set CPOLAR_CONFIG_DIR=%USERPROFILE%\.cpolar
set CPOLAR_LOCAL_CONFIG=%CPOLAR_DIR%\cpolar.yml
set CPOLAR_USER_CONFIG=%CPOLAR_CONFIG_DIR%\cpolar.yml
set CPOLAR_CONFIG_FILE=

REM 先检查cpolar安装目录
if exist "%CPOLAR_LOCAL_CONFIG%" (
    echo [发现] cpolar配置文件已存在于安装目录: %CPOLAR_LOCAL_CONFIG%
    set CPOLAR_CONFIG_FILE=%CPOLAR_LOCAL_CONFIG%
    goto CONFIG_FOUND
)

REM 再检查用户主目录
if exist "%CPOLAR_USER_CONFIG%" (
    echo [发现] cpolar配置文件已存在于用户目录: %CPOLAR_USER_CONFIG%
    set CPOLAR_CONFIG_FILE=%CPOLAR_USER_CONFIG%
    goto CONFIG_FOUND
)

REM 如果都不存在，则创建
if not exist "%CPOLAR_CONFIG_DIR%" (
    mkdir "%CPOLAR_CONFIG_DIR%"
)
set CPOLAR_CONFIG_FILE=%CPOLAR_USER_CONFIG%

echo [提示] 未找到cpolar配置文件，需要创建...
set /p CPOLAR_TOKEN="请输入您的cpolar authtoken (留空则跳过): "

if not "%CPOLAR_TOKEN%"=="" (
    echo 正在配置cpolar...
    echo authtoken: %CPOLAR_TOKEN% > "%CPOLAR_CONFIG_FILE%"
    echo server_addr: cn.cpolar.com:443 >> "%CPOLAR_CONFIG_FILE%"
    echo trust_host_root_certs: false >> "%CPOLAR_CONFIG_FILE%"
    echo web_addr: 127.0.0.1:4040 >> "%CPOLAR_CONFIG_FILE%"
    echo log_level: INFO >> "%CPOLAR_CONFIG_FILE%"
    echo update: false >> "%CPOLAR_CONFIG_FILE%"
    echo region: cn >> "%CPOLAR_CONFIG_FILE%"
    echo [成功] cpolar配置文件已更新!
) else (
    echo [警告] 已跳过cpolar配置，可能影响移动网络访问...
)

:CONFIG_FOUND
echo [信息] 将使用配置文件: %CPOLAR_CONFIG_FILE%

REM 确保没有旧的cpolar实例在运行
echo 结束可能存在的cpolar进程...
taskkill /f /im cpolar.exe 2>nul
timeout /t 1 >nul

echo [3/7] 安装后端依赖(修复版本)...
cd /d %SCRIPT_DIR%\backend
if exist "C:\Python313\python.exe" (
    C:\Python313\python.exe -m pip install -r requirements-fixed.txt
) else (
    echo [警告] 未找到Python 3.13，尝试使用默认Python...
    python -m pip install -r requirements-fixed.txt
)
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败，请查看错误信息。
    pause
    exit /b %errorlevel%
)

echo [4/7] 修复前端路径设置...
cd /d %SCRIPT_DIR%
if exist "node" (
    node fix-homepage.js
    if %errorlevel% neq 0 (
        echo [警告] 修复homepage可能失败，但将继续尝试构建。
    )
) else (
    echo [警告] 未找到Node.js，跳过修复前端路径...
)

echo [5/7] 构建前端生产版本...
cd /d %SCRIPT_DIR%\frontend
if exist "npm" (
    call npm run build
    if %errorlevel% neq 0 (
        echo [错误] 前端构建失败，请查看错误信息。
        pause
        exit /b %errorlevel%
    )
) else (
    echo [警告] 未找到npm，跳过前端构建...
)

echo [6/7] 启动服务...
cd /d %SCRIPT_DIR%
if exist "backend\run_dev.py" (
    start cmd /k "title 财赋思-后端服务 && color 0A && cd /d %SCRIPT_DIR% && python -m backend.run_dev"
) else (
    echo [警告] 未找到后端服务文件，跳过启动后端...
)

if exist "%SCRIPT_DIR%\frontend\build" (
    start cmd /k "title 财赋思-前端服务(移动网络优化) && color 0B && cd /d %SCRIPT_DIR%\frontend && npx http-server build -p %FRONTEND_PORT% --cors -a 0.0.0.0"
) else (
    echo [警告] 未找到前端构建文件，跳过启动前端...
)

echo [7/7] 启动内网穿透(优化全网络访问)...
echo 正在启动内网穿透，请稍候...
echo.

REM 获取本机IP地址用于日志
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r "IPv4.*172\."') do set LOCAL_IP=%%a
set LOCAL_IP=%LOCAL_IP:~1%
if "%LOCAL_IP%"=="" (
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r "IPv4.*192\."') do set LOCAL_IP=%%a
    set LOCAL_IP=%LOCAL_IP:~1%
)
echo 本机IP: %LOCAL_IP%

REM 直接启动cpolar前端穿透
echo 启动前端穿透 (%FRONTEND_PORT%端口)...
start cmd /k "title 财赋思-前端穿透 && color 0E && cd /d %CPOLAR_DIR% && %CPOLAR_PATH% http %FRONTEND_PORT%"

REM 等待5秒后启动后端穿透
timeout /t 5 >nul
echo 启动后端穿透 (%BACKEND_PORT%端口)...
start cmd /k "title 财赋思-后端穿透 && color 0D && cd /d %CPOLAR_DIR% && %CPOLAR_PATH% http %BACKEND_PORT%"

echo.
echo ================================================
echo                  启动完成!
echo ================================================
echo.
echo  本地前端: http://localhost:%FRONTEND_PORT%
echo  本地IP前端: http://%LOCAL_IP%:%FRONTEND_PORT%
echo  本地后端: http://localhost:%BACKEND_PORT%
echo  穿透地址: 请查看cpolar窗口显示的URL
echo          (通常格式为 https://xxxx.cpolar.cn)
echo.
echo ================================================
echo            移动网络访问优化说明
echo ================================================
echo.
echo  1. 已配置服务器监听所有网络接口 (0.0.0.0)
echo  2. 调整了cpolar配置，允许所有IP地址访问
echo  3. 添加了CORS支持，允许跨域请求
echo.
echo 如有问题，请联系技术支持
pause 