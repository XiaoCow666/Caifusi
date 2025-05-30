import os
from flask import Flask
from flask_cors import CORS
import sys

def create_app():
    """创建并配置Flask应用"""
    try:
        print("开始创建Flask应用...")
        app = Flask(__name__)
        
        # 配置跨域资源共享
        print("配置CORS...")
        CORS(app, resources={r"/api/*": {"origins": "*"}})
        
        # 加载配置
        try:
            print("尝试从config.py加载配置...")
            from .config import Config
            app.config.from_object(Config)
            print("配置加载成功")
        except ImportError as e:
            print(f"导入配置失败: {e}，使用默认配置")
            # 设置默认配置
            app.config['DEBUG'] = True
            app.config['API_PREFIX'] = '/api'
            app.config['CORS_ORIGINS'] = ["http://localhost:3000", "http://127.0.0.1:3000"]
        
        # 确保目录存在
        print("确保services目录存在...")
        os.makedirs(os.path.join(app.root_path, 'services'), exist_ok=True)
        
        # 注册蓝图 (routes)
        try:
            print("尝试注册coach_bp蓝图...")
            # 打印模块搜索路径
            print(f"模块搜索路径: {sys.path}")
            # 打印当前目录结构
            print(f"当前目录: {os.path.abspath('.')}")
            print(f"app目录: {app.root_path}")
            
            try:
                print("列出routes目录内容:")
                routes_dir = os.path.join(app.root_path, 'routes')
                if os.path.exists(routes_dir):
                    for item in os.listdir(routes_dir):
                        print(f" - {item}")
                else:
                    print(f" 目录不存在: {routes_dir}")
            except Exception as le:
                print(f"列出目录内容失败: {le}")
            
            # 创建一个简单的蓝图
            from flask import Blueprint, jsonify
            
            print("创建默认coach_bp蓝图...")
            coach_bp = Blueprint('coach', __name__)
            
            @coach_bp.route('/chat', methods=['POST'])
            def chat():
                return jsonify({
                    "status": "success", 
                    "reply": "这是一个测试回复。AI服务正在启动中..."
                })
                
            @coach_bp.route('/health', methods=['GET'])
            def health():
                return jsonify({
                    "status": "ok",
                    "message": "AI教练服务正在运行"
                })
                
            print("注册简单coach_bp蓝图...")
            app.register_blueprint(coach_bp, url_prefix='/api/coach')
            print("注册coach_bp成功")
        except Exception as e:
            print(f"注册coach_bp失败: {e}")
            import traceback
            traceback.print_exc()
        
        # 添加健康检查路由
        @app.route('/api/health', methods=['GET'])
        def health_check():
            return {"status": "healthy", "message": "API服务正常运行中"}, 200
        
        # 添加根路由
        @app.route('/')
        def index():
            return {"message": "欢迎使用财赋思 AI金融心智教练 API"}, 200
        
        # 打印已注册的路由（开发环境下有助于调试）
        print("已注册的路由:")
        for rule in app.url_map.iter_rules():
            print(f"{rule} - {rule.methods}")
        
        return app
        
    except Exception as e:
        print(f"创建应用时出现错误: {e}")
        import traceback
        traceback.print_exc()
        # 创建一个最小可用的应用
        minimal_app = Flask(__name__)
        
        @minimal_app.route('/')
        def minimal_index():
            return {"status": "error", "message": "应用初始化失败，请检查服务器日志"}, 500
            
        return minimal_app 