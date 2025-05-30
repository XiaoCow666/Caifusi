@echo off
chcp 65001 >nul
cls

echo =================================================================
echo              财赋思 AI金融心智教练应用  一键启动工具
echo =================================================================
echo.

REM 设置工作目录
set SCRIPT_DIR=%~dp0
cd /d %SCRIPT_DIR%

REM 检查Python是否可用
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Python，请确保安装了Python并添加到PATH环境变量。
    goto :error
)

REM 检查npm是否可用
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到npm，请确保安装了Node.js和npm。
    goto :error
)

echo [1/4] 设置环境变量...
set DEV_MODE=true
set ZHIPUAI_API_KEY=d569cc60785b4cd8a9cc3c033ac5a72f.MmbuHzbqGEsGntG5

echo [2/4] 启动后端服务...
start cmd /k "title 财赋思-后端服务 && color 0A && cd /d %SCRIPT_DIR% && python -m backend.run_dev"

echo [3/4] 等待后端服务初始化 (5秒)...
timeout /t 5 >nul

echo [4/4] 启动前端服务...
start cmd /k "title 财赋思-前端服务 && color 0B && cd /d %SCRIPT_DIR%\frontend && npm start"

echo.
echo =================================================================
echo                      启动完成!
echo -----------------------------------------------------------------
echo  后端API: http://localhost:5001
echo  前端页面: http://localhost:3000
echo =================================================================
echo.
echo 提示:
echo  - 如果浏览器没有自动打开，请手动访问 http://localhost:3000
echo  - 关闭窗口不会停止服务，需要手动关闭服务窗口
echo  - 如有问题，请查看各个窗口中的日志输出
echo.
echo 按任意键关闭此窗口...
pause >nul
exit /b 0

:error
echo.
echo 启动失败，请检查以上错误信息。
echo 按任意键关闭此窗口...
pause >nul
exit /b 1 