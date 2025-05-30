from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import re

# 尝试导入本地服务
try:
    from ..services.zhipuai_service import ZhipuAIService
    zhipuai_service = ZhipuAIService()
    print("成功导入ZhipuAIService")
except ImportError as e:
    print(f"导入ZhipuAIService失败: {e}")
    # 尝试使用备选导入路径
    try:
        import sys
        import os
        # 获取当前目录路径
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # 添加项目根目录到系统路径
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
        sys.path.insert(0, project_root)
        from backend.services.zhipuai_service import ZhipuAIService
        zhipuai_service = ZhipuAIService()
        print("通过备选路径导入ZhipuAIService成功")
    except ImportError as e:
        print(f"备选导入ZhipuAIService也失败: {e}")
        # 创建一个简单的模拟服务
        class MockZhipuAIService:
            def get_chat_response(self, data):
                return {"status": "success", "reply": "服务加载失败，请联系管理员"}
        zhipuai_service = MockZhipuAIService()
        print("使用模拟服务")

coach_bp = Blueprint('coach', __name__)

@coach_bp.route('/chat', methods=['POST'])
@cross_origin()
def chat():
    data = request.get_json()
    
    if not data or 'message' not in data:
        return jsonify({'status': 'error', 'message': '缺少必要的消息内容'}), 400
    
    # 使用智谱AI服务获取回复
    print(f"正在处理聊天请求: {data.get('message')[:20]}...")
    response = zhipuai_service.get_chat_response(data)
    
    if response.get('status') == 'success':
        return jsonify(response), 200
    else:
        return jsonify(response), 500

@coach_bp.route('/health', methods=['GET'])
def health():
    """健康检查端点"""
    return jsonify({'status': 'ok', 'message': 'AI教练服务运行正常'}), 200 