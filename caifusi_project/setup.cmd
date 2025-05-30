@echo off
echo 正在初始化财赋思应用...

echo 1. 安装前端依赖
cd %~dp0frontend
call npm install
call npx tailwindcss init -p

echo 2. 生成Tailwind CSS
call npx tailwindcss -i src/index.css -o src/tailwind.css

echo 3. 安装后端依赖
cd %~dp0backend
pip install -r requirements.txt

echo 初始化完成!
echo.
echo 请运行以下命令启动应用:
echo 1. start-backend.cmd (启动后端)
echo 2. start-frontend.cmd (启动前端)
pause 