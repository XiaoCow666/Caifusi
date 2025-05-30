import os
import sys
from pathlib import Path

print("=== 财赋思后端服务启动 ===")

# 添加项目根目录到系统路径
try:
    current_dir = Path(__file__).parent
    project_root = current_dir.parent
    sys.path.insert(0, str(project_root))
    print(f"✓ 系统路径设置成功")
except Exception as e:
    print(f"✕ 设置路径出错: {e}")

# 设置环境变量
os.environ["DEV_MODE"] = "true"
os.environ["ZHIPUAI_API_KEY"] = "d569cc60785b4cd8a9cc3c033ac5a72f.MmbuHzbqGEsGntG5"

# 导入和创建应用
try:
    # 方式1: 标准导入方式
    from backend.app import create_app
    print("✓ 应用模块导入成功")
    
    # 创建应用实例
    app = create_app()
    
    print("✓ 应用实例创建成功")
    print("✓ 开发模式已启用")
    print("✓ 使用智谱AI GLM-Z1-air模型")
    print(f"✓ API地址: http://localhost:5001")
    
    # 开发模式使用Flask内置服务器
    app.run(debug=True, port=5001)
    
except ImportError as e:
    print(f"✕ 导入错误: {e}")
    print("尝试备用导入方式...")
    
    try:
        # 方式2: 直接导入
        sys.path.append(str(current_dir))
        from app import create_app
        app = create_app()
        print("✓ 备用导入成功")
        app.run(debug=True, port=5001)
    except Exception as e:
        print(f"✕ 启动失败: {e}")
        print("\n请检查项目结构是否正确。")
        sys.exit(1) 