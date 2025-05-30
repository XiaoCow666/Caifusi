# 财赋思应用 - PowerShell启动脚本
# 设置控制台输出编码为UTF-8以避免中文乱码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# 清空控制台
Clear-Host

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "              财赋思 AI金融心智教练应用  一键启动工具" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

# 设置工作目录为脚本所在位置
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptPath

# 检查Python是否可用
try {
    $pythonVersion = python --version 2>&1
    Write-Host "检测到Python: " -NoNewline
    Write-Host $pythonVersion -ForegroundColor Green
}
catch {
    Write-Host "[错误] 未检测到Python，请确保安装了Python并添加到PATH环境变量。" -ForegroundColor Red
    Write-Host "按任意键退出..." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# 检查npm是否可用
try {
    $npmVersion = npm --version 2>&1
    Write-Host "检测到npm: v" -NoNewline
    Write-Host $npmVersion -ForegroundColor Green
}
catch {
    Write-Host "[错误] 未检测到npm，请确保安装了Node.js和npm。" -ForegroundColor Red
    Write-Host "按任意键退出..." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# 设置环境变量
Write-Host "[1/4] 设置环境变量..." -ForegroundColor Yellow
$env:DEV_MODE = "true"
$env:ZHIPUAI_API_KEY = "d569cc60785b4cd8a9cc3c033ac5a72f.MmbuHzbqGEsGntG5"

# 启动后端服务
Write-Host "[2/4] 启动后端服务..." -ForegroundColor Yellow
$backendCmd = "Set-Location '$ScriptPath'; `$env:DEV_MODE='true'; `$env:ZHIPUAI_API_KEY='d569cc60785b4cd8a9cc3c033ac5a72f.MmbuHzbqGEsGntG5'; python -m backend.run_dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd, "-WindowStyle", "Normal" -WindowStyle Normal

# 等待后端服务启动
Write-Host "[3/4] 等待后端服务初始化 (5秒)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 切换到前端目录并启动前端服务
Write-Host "[4/4] 启动前端服务..." -ForegroundColor Yellow
$frontendCmd = "Set-Location '$ScriptPath\frontend'; npm start"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd, "-WindowStyle", "Normal" -WindowStyle Normal

# 完成启动
Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "                      启动完成!" -ForegroundColor Green
Write-Host "-----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  后端API: " -NoNewline; Write-Host "http://localhost:5001" -ForegroundColor White
Write-Host "  前端页面: " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor White
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "提示:" -ForegroundColor Yellow
Write-Host "  - 如果浏览器没有自动打开，请手动访问 http://localhost:3000"
Write-Host "  - 关闭此窗口不会停止服务，需要手动关闭服务窗口"
Write-Host "  - 如有问题，请查看各个窗口中的日志输出"
Write-Host ""
Write-Host "按任意键关闭此窗口..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 