#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
财赋思应用启动器
这个脚本提供了简单的方式启动财赋思应用的前后端服务
可以在任何IDE中直接运行此文件来启动应用
"""

import os
import sys
import subprocess
import time
import webbrowser
from pathlib import Path
import threading
import platform
import shutil
import argparse
import re

# 设置控制台颜色（仅Windows）
if platform.system() == "Windows":
    os.system("color")
    # 彩色输出
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    RED = "\033[91m"
    ENDC = "\033[0m"
else:
    # 默认颜色
    GREEN = ""
    YELLOW = ""
    BLUE = ""
    RED = ""
    ENDC = ""

def print_colored(text, color):
    """打印彩色文本"""
    print(f"{color}{text}{ENDC}")

def print_header():
    """打印启动器标题"""
    print("\n" + "=" * 65)
    print_colored("               财赋思 AI金融心智教练应用启动器", BLUE)
    print("=" * 65)
    print()

def get_project_root():
    """获取项目根目录"""
    return Path(__file__).parent

def open_npm_install_guide():
    """打开npm安装指南"""
    project_root = get_project_root()
    guide_path = project_root / "npm_install_guide.md"
    
    if not guide_path.exists():
        print_colored("错误: npm安装指南文件不存在", RED)
        return False
    
    try:
        # 尝试用默认应用打开markdown文件
        if platform.system() == "Windows":
            os.startfile(guide_path)
        elif platform.system() == "Darwin":  # macOS
            subprocess.Popen(["open", guide_path])
        else:  # Linux
            subprocess.Popen(["xdg-open", guide_path])
        
        print_colored("已打开npm安装指南，请按照指南安装Node.js和npm", GREEN)
        return True
    except Exception as e:
        print_colored(f"无法打开npm安装指南: {e}", RED)
        print_colored(f"请手动打开文件: {guide_path}", YELLOW)
        return False

def find_npm_in_common_paths():
    """在常见路径中查找npm"""
    common_paths = []
    
    # Windows常见路径
    if platform.system() == "Windows":
        program_files = [
            os.environ.get("ProgramFiles", "C:\\Program Files"),
            os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)"),
            os.environ.get("APPDATA", "") + "\\npm",
            os.environ.get("LOCALAPPDATA", "") + "\\npm"
        ]
        
        # 添加Node.js常见安装路径
        for pf in program_files:
            for version in ["", "\\nodejs", "\\nodejs\\node_modules\\npm\\bin"]:
                common_paths.append(os.path.join(pf, version))
                
        # 检查用户目录下的AppData
        user_profile = os.environ.get("USERPROFILE", "")
        if user_profile:
            for path in [
                "\\AppData\\Roaming\\npm",
                "\\AppData\\Local\\npm",
                "\\AppData\\Roaming\\nodejs",
                "\\scoop\\apps\\nodejs\\current"
            ]:
                common_paths.append(user_profile + path)
    
    # Unix/Mac常见路径
    else:
        common_paths.extend([
            "/usr/local/bin",
            "/usr/bin",
            "/opt/homebrew/bin",  # Mac Homebrew
            "/opt/local/bin",     # Mac MacPorts
            "/opt/node/bin",
            "/usr/local/nodejs/bin",
            os.path.expanduser("~/.npm-global/bin"),
            os.path.expanduser("~/.nvm/versions/node/current/bin"),
        ])
    
    # 搜索npm可执行文件
    npm_names = ["npm", "npm.cmd", "npm.exe"]
    
    for path in common_paths:
        if os.path.exists(path):
            for name in npm_names:
                npm_path = os.path.join(path, name)
                if os.path.exists(npm_path):
                    return npm_path
    
    return None

def check_node_version_via_python():
    """尝试通过JavaScript执行获取Node.js版本"""
    try:
        # 尝试检查Node.js是否安装
        node_check_script = """
        try {
            const fs = require('fs');
            const path = require('path');
            console.log("node:" + process.version);
            console.log("node_path:" + process.execPath);
            process.exit(0);
        } catch (e) {
            console.error("不能导入Node.js模块:", e.message);
            process.exit(1);
        }
        """
        
        # 保存临时脚本
        temp_script = os.path.join(os.getcwd(), "temp_node_check.js")
        with open(temp_script, "w") as f:
            f.write(node_check_script)
        
        try:
            # 尝试执行脚本
            output = subprocess.check_output(["node", temp_script], 
                                           stderr=subprocess.STDOUT,
                                           text=True)
            
            # 解析输出
            node_version = None
            node_path = None
            
            for line in output.splitlines():
                if line.startswith("node:"):
                    node_version = line.replace("node:", "")
                elif line.startswith("node_path:"):
                    node_path = line.replace("node_path:", "")
            
            if node_version and node_path:
                return True, node_version, node_path
        except:
            pass
        finally:
            # 清理临时文件
            if os.path.exists(temp_script):
                os.remove(temp_script)
    except:
        pass
    
    return False, None, None

def check_npm():
    """检查npm是否可用"""
    # 方法1: 直接使用which/where查找npm
    npm_cmd = shutil.which("npm")
    if npm_cmd:
        try:
            npm_version = subprocess.check_output([npm_cmd, "--version"], text=True, stderr=subprocess.DEVNULL).strip()
            print_colored(f"✓ npm版本: {npm_version} ({npm_cmd})", GREEN)
            return True, npm_version, npm_cmd
        except:
            pass

    # 方法2: 在常见路径中查找npm
    npm_path = find_npm_in_common_paths()
    if npm_path:
        try:
            npm_version = subprocess.check_output([npm_path, "--version"], text=True, stderr=subprocess.DEVNULL).strip()
            print_colored(f"✓ npm版本: {npm_version} ({npm_path})", GREEN)
            return True, npm_version, npm_path
        except:
            pass

    # 方法3: 尝试通过Node.js检查
    node_available, node_version, node_path = check_node_version_via_python()
    if node_available:
        print_colored(f"✓ Node.js版本: {node_version}", GREEN)
        
        # 确定npm位置
        node_dir = os.path.dirname(node_path)
        possible_npm_paths = [
            os.path.join(node_dir, "npm"),
            os.path.join(node_dir, "npm.cmd"),
            os.path.join(node_dir, "npm.exe")
        ]
        
        for npm_path in possible_npm_paths:
            if os.path.exists(npm_path):
                try:
                    npm_version = subprocess.check_output([npm_path, "--version"], text=True, stderr=subprocess.DEVNULL).strip()
                    print_colored(f"✓ npm版本: {npm_version} ({npm_path})", GREEN)
                    return True, npm_version, npm_path
                except:
                    pass
    
    # 提供安装npm的指南
    print_colored("✗ 未检测到npm", YELLOW)
    print_colored("提示: 如需使用前端功能，请安装Node.js，它包含npm工具", YELLOW)
    print_colored("下载地址: https://nodejs.org/", YELLOW)
    
    # 询问用户是否查看npm安装指南
    try:
        print()
        user_input = input("是否查看npm安装指南? (y/n): ").strip().lower()
        if user_input == 'y' or user_input == 'yes':
            open_npm_install_guide()
    except:
        pass
    
    print_colored("现在将只启动后端服务", YELLOW)
    return False, None, None

def check_environment(backend_only=False):
    """检查环境是否符合要求"""
    print_colored("检查环境...", YELLOW)
    
    errors = []
    warnings = []
    
    # 检查Python版本
    py_version = sys.version_info
    py_version_str = f"{py_version.major}.{py_version.minor}.{py_version.micro}"
    print_colored(f"✓ Python版本: {py_version_str}", GREEN)
    if py_version.major < 3 or (py_version.major == 3 and py_version.minor < 8):
        errors.append(f"Python版本过低: {py_version_str}，需要3.8或更高版本")
    
    # 检查Node.js和npm（如果不是仅后端模式）
    npm_available = False
    npm_cmd = None
    if not backend_only:
        npm_available, npm_version, npm_cmd = check_npm()
        if not npm_available:
            warnings.append("未检测到npm，将只启动后端服务")
    
    # 检查必要的目录
    project_root = get_project_root()
    
    # 检查backend目录
    backend_dir = project_root / "backend"
    if not backend_dir.exists():
        errors.append(f"后端目录不存在: {backend_dir}")
    else:
        print_colored(f"✓ 后端目录: {backend_dir}", GREEN)
    
    # 检查前端目录（如果需要启动前端且npm可用）
    if not backend_only and npm_available:
        frontend_dir = project_root / "frontend"
        if not frontend_dir.exists():
            warnings.append(f"前端目录不存在: {frontend_dir}，将只启动后端服务")
        else:
            print_colored(f"✓ 前端目录: {frontend_dir}", GREEN)
            # 检查package.json
            package_json = frontend_dir / "package.json"
            if not package_json.exists():
                warnings.append(f"前端package.json不存在: {package_json}，将只启动后端服务")
            else:
                print_colored(f"✓ package.json文件: {package_json}", GREEN)
                # 检查是否有start脚本
                import json
                try:
                    with open(package_json, 'r', encoding='utf-8') as f:
                        pkg_data = json.load(f)
                    if "scripts" in pkg_data and "start" in pkg_data["scripts"]:
                        print_colored(f"✓ npm start脚本: {pkg_data['scripts']['start']}", GREEN)
                    else:
                        warnings.append("前端package.json中未找到'start'脚本，将只启动后端服务")
                except Exception as e:
                    warnings.append(f"无法解析package.json: {str(e)}，将只启动后端服务")
    
    # 返回结果
    if errors:
        print_colored("\n检测到严重问题:", RED)
        for error in errors:
            print_colored(f"  ✗ {error}", RED)
        
    if warnings:
        print_colored("\n注意事项:", YELLOW)
        for warning in warnings:
            print_colored(f"  ! {warning}", YELLOW)
    
    should_continue = len(errors) == 0
    should_start_frontend = npm_available and not backend_only and len(warnings) == 0
    
    if should_continue:
        print_colored("\n环境检查完成!", GREEN)
    
    return should_continue, should_start_frontend, npm_cmd

def run_command(command, cwd=None):
    """运行Shell命令"""
    if cwd is None:
        cwd = get_project_root()
    
    print_colored(f"执行命令: {command}", YELLOW)
    print_colored(f"工作目录: {cwd}", YELLOW)
    
    # 根据操作系统创建正确的启动命令
    if platform.system() == "Windows":
        try:
            process = subprocess.Popen(
                command, cwd=cwd, shell=True,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            return process
        except Exception as e:
            print_colored(f"命令执行失败: {e}", RED)
            return None
    else:
        try:
            process = subprocess.Popen(
                command, cwd=cwd, shell=True,
                preexec_fn=os.setsid
            )
            return process
        except Exception as e:
            print_colored(f"命令执行失败: {e}", RED)
            return None

def start_backend():
    """启动后端服务"""
    print_colored("[1/3] 启动后端服务...", GREEN)
    
    # 设置环境变量
    os.environ["DEV_MODE"] = "true"
    os.environ["ZHIPUAI_API_KEY"] = "d569cc60785b4cd8a9cc3c033ac5a72f.MmbuHzbqGEsGntG5"
    
    project_root = get_project_root()
    
    # 检查后端文件是否存在
    backend_module = project_root / "backend" / "run_dev.py"
    if not backend_module.exists():
        print_colored(f"错误: 后端入口文件不存在: {backend_module}", RED)
        return None
    
    # 根据操作系统选择不同的启动命令
    if platform.system() == "Windows":
        # 尝试使用直接方式运行Python脚本而不是模块
        python_cmd = shutil.which("python")
        if not python_cmd:
            python_cmd = "python"
        
        backend_script = str(backend_module).replace("\\", "\\\\")
        command = f"start cmd /k \"title 财赋思-后端服务 && cd /d {project_root} && {python_cmd} {backend_script}\""
    else:
        command = f"cd {project_root} && python3 {backend_module}"
    
    process = run_command(command, project_root)
    if process:
        print_colored("      ✓ 后端服务启动中...", GREEN)
    return process

def start_frontend(npm_cmd=None):
    """启动前端服务"""
    print_colored("[2/3] 启动前端服务...", GREEN)
    
    project_root = get_project_root()
    frontend_dir = project_root / "frontend"
    
    # 检查前端目录是否存在
    if not frontend_dir.exists():
        print_colored(f"错误: 前端目录不存在: {frontend_dir}", RED)
        return None
    
    # 检查package.json是否存在
    package_json = frontend_dir / "package.json"
    if not package_json.exists():
        print_colored(f"错误: package.json不存在: {package_json}", RED)
        return None
    
    # 使用提供的npm命令或寻找可用的npm
    if not npm_cmd:
        npm_cmd = shutil.which("npm")
        if not npm_cmd:
            npm_cmd = "npm"  # 默认命令，可能会失败
    
    # 根据操作系统选择不同的启动命令
    if platform.system() == "Windows":
        frontend_path = str(frontend_dir).replace("\\", "\\\\")
        command = f"start cmd /k \"title 财赋思-前端服务 && cd /d {frontend_path} && \"{npm_cmd}\" start\""
    else:
        command = f"cd {frontend_dir} && \"{npm_cmd}\" start"
    
    process = run_command(command, frontend_dir)
    if process:
        print_colored("      ✓ 前端服务启动中...", GREEN)
    return process

def open_browser():
    """打开浏览器访问应用"""
    print_colored("[3/3] 打开应用...", GREEN)
    time.sleep(8)  # 等待前端服务启动
    
    try:
        webbrowser.open("http://localhost:3000")
        print_colored("      ✓ 已在浏览器中打开应用", GREEN)
    except Exception as e:
        print_colored(f"      ✗ 无法自动打开浏览器: {e}", RED)
        print_colored("      请手动访问: http://localhost:3000", YELLOW)

def parse_args():
    """解析命令行参数"""
    parser = argparse.ArgumentParser(description="财赋思应用启动器")
    parser.add_argument('--backend-only', action='store_true', help='只启动后端服务')
    parser.add_argument('--skip-checks', action='store_true', help='跳过环境检查')
    parser.add_argument('--install-guide', action='store_true', help='打开npm安装指南')
    return parser.parse_args()

def main():
    """主函数"""
    # 解析命令行参数
    args = parse_args()
    
    # 如果用户请求打开npm安装指南
    if args.install_guide:
        open_npm_install_guide()
        return
    
    print_header()
    
    # 检查环境
    should_continue = True
    should_start_frontend = not args.backend_only
    npm_cmd = None
    
    if not args.skip_checks:
        should_continue, should_start_frontend, npm_cmd = check_environment(args.backend_only)
    
    if not should_continue:
        print_colored("\n环境检查未通过，请解决上述问题后重试。", RED)
        print_colored("如果要跳过检查强制启动，请使用 --skip-checks 参数。", YELLOW)
        print_colored("如需查看npm安装指南，请使用 --install-guide 参数。", YELLOW)
        input("按Enter键退出...")
        return
    
    try:
        # 启动后端
        backend_process = start_backend()
        if not backend_process:
            print_colored("启动后端失败，请检查错误信息", RED)
            input("按Enter键退出...")
            return
        
        # 等待后端初始化
        print_colored("等待后端服务初始化 (5秒)...", YELLOW)
        time.sleep(5)
        
        # 如果需要，启动前端
        if should_start_frontend:
            frontend_process = start_frontend(npm_cmd)
            if not frontend_process:
                print_colored("启动前端失败，请检查错误信息", RED)
                print_colored("只使用后端服务继续运行...", YELLOW)
                should_start_frontend = False
        else:
            print_colored("跳过前端服务启动，仅使用后端服务", YELLOW)
            # 如果是因为npm不可用导致的，提示可以查看安装指南
            if not args.backend_only and not npm_cmd:
                print_colored("提示：您可以使用 'python launcher.py --install-guide' 查看npm安装指南", YELLOW)
        
        # 如果前端启动成功，自动打开浏览器
        if should_start_frontend:
            browser_thread = threading.Thread(target=open_browser)
            browser_thread.daemon = True
            browser_thread.start()
        
        print("\n" + "=" * 65)
        print_colored("                      启动完成!", GREEN)
        print("-" * 65)
        print_colored("  后端API: http://localhost:5001", BLUE)
        if should_start_frontend:
            print_colored("  前端页面: http://localhost:3000", BLUE)
        else:
            print_colored("  前端未启动，可以稍后手动启动：cd frontend && npm start", YELLOW)
        print("=" * 65)
        print()
        print_colored("提示:", YELLOW)
        print("  - 关闭此窗口不会停止服务，需要手动关闭服务窗口")
        print("  - 如有问题，请查看各个窗口中的日志输出")
        print()
        
        # 在IDE中运行时保持脚本运行
        if not sys.stdout.isatty():
            print_colored("IDE环境运行中，保持启动器活动状态...", YELLOW)
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print_colored("\n检测到Ctrl+C，启动器已停止", YELLOW)
        else:
            input("按Enter键退出启动器 (服务将继续在后台运行)...")
            
    except Exception as e:
        print_colored(f"启动过程中出错: {e}", RED)
        import traceback
        traceback.print_exc()
    
    print_colored("启动器已退出，服务继续在后台运行", YELLOW)

if __name__ == "__main__":
    main() 