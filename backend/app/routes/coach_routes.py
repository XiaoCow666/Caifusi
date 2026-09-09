from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import re
import logging
import traceback

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('coach_routes')

# 尝试导入本地服务
try:
    from ..services.zhipuai_service import ZhipuAIService
    zhipuai_service = ZhipuAIService()
    logger.info("成功导入ZhipuAIService")
except Exception as e:
    logger.error(f"导入或初始化ZhipuAIService失败: {e}")
    logger.error(traceback.format_exc())
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
        logger.info("通过备选路径导入ZhipuAIService成功")
    except Exception as e:
        logger.error(f"备选导入ZhipuAIService也失败: {e}")
        logger.error(traceback.format_exc())
        # 创建一个简单的模拟服务
        class MockZhipuAIService:
            def get_chat_response(self, data):
                return {"status": "success", "reply": "服务加载失败，请联系管理员"}
        zhipuai_service = MockZhipuAIService()
        logger.info("使用模拟服务")

coach_bp = Blueprint('coach', __name__)

@coach_bp.route('/chat', methods=['POST'])
@cross_origin()
def chat():
    try:
        logger.info("收到聊天请求")
        # silent=True：空请求体或非法 JSON 时返回 None（而非抛 BadRequest 被外层 except 吞成 500）
        data = request.get_json(silent=True)
        
        if not data:
            logger.error("请求数据为空")
            return jsonify({'status': 'error', 'message': '请求数据为空'}), 400

        message = data.get('message')
        if not isinstance(message, str) or not message.strip():
            logger.error("消息内容必须为非空字符串")
            return jsonify({'status': 'error', 'message': '消息内容必须为非空字符串'}), 400

        # 记录请求内容
        logger.info(f"用户ID: {data.get('user_id', 'guest')}")
        logger.info(f"消息内容: {message[:50]}...")
        
        # 使用智谱AI服务获取回复
        logger.info(f"正在处理聊天请求...")
        response = zhipuai_service.get_chat_response(data)
        
        if response.get('status') == 'success':
            logger.info("成功获取AI回复")
            return jsonify(response), 200
        else:
            logger.error(f"AI回复错误: {response.get('message')}")
            return jsonify(response), 500
    except Exception as e:
        error_message = f"处理聊天请求时出错: {str(e)}"
        logger.error(error_message)
        logger.error(traceback.format_exc())
        return jsonify({'status': 'error', 'message': error_message}), 500

@coach_bp.route('/health', methods=['GET'])
def health():
    """健康检查端点"""
    try:
        # 检查智谱AI服务是否可用
        if zhipuai_service:
            return jsonify({'status': 'ok', 'message': 'AI教练服务运行正常'}), 200
        else:
            return jsonify({'status': 'error', 'message': 'AI教练服务不可用'}), 500
    except Exception as e:
        error_message = f"健康检查失败: {str(e)}"
        logger.error(error_message)
        return jsonify({'status': 'error', 'message': error_message}), 500 