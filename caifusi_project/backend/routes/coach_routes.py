from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from services.zhipuai_service import ZhipuAIService

coach_bp = Blueprint('coach', __name__)
zhipuai_service = ZhipuAIService()

@coach_bp.route('/chat', methods=['POST'])
@cross_origin()
def chat():
    data = request.get_json()
    
    if not data or 'message' not in data:
        return jsonify({'status': 'error', 'message': '缺少必要的消息内容'}), 400
    
    # 使用智谱AI服务获取回复
    response = zhipuai_service.get_chat_response(data)
    
    if response.get('status') == 'success':
        return jsonify(response), 200
    else:
        return jsonify(response), 500 