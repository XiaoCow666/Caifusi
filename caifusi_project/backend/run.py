import os
import sys
from pathlib import Path

# 添加项目根目录到系统路径
current_dir = Path(__file__).parent
project_root = current_dir.parent
sys.path.insert(0, str(project_root))

try:
    # 尝试导入应用
    from backend.app import create_app
    
    # 创建应用实例
    app = create_app()
    
    if __name__ == '__main__':
        # 生产模式使用生产服务器
        print("Starting server in PRODUCTION mode")
        app.run(host='0.0.0.0', port=5001)
except ImportError as e:
    # 如果导入失败，尝试直接导入
    try:
        from app import create_app
        app = create_app()
        
        if __name__ == '__main__':
            app.run(host='0.0.0.0', port=5001)
    except Exception as e:
        print(f"启动失败: {e}")
        print("请检查项目结构和模块导入路径。")
        sys.exit(1) 