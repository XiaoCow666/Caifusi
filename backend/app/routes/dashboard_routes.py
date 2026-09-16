"""
Dashboard数据API路由
提供用户仪表盘所需的各类数据
"""
from flask import Blueprint, request, jsonify, current_app
from app.services.auth_service import verify_firebase_token
from app.services.user_profile_service import user_profile_service
from app.services.user_data_service import user_data_service
from functools import wraps

dashboard_bp = Blueprint('dashboard_bp', __name__)

# 认证装饰器
def authenticate(f):
    """验证Firebase ID token"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 检查是否处于开发模式
        if current_app.config.get('DEV_MODE'):
            kwargs['user_info'] = {'uid': 'test_user_id', 'email': 'test@example.com'}
            return f(*args, **kwargs)
        
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "需要授权令牌"}), 401
        
        id_token = auth_header.split('Bearer ')[1]
        user_info, error = verify_firebase_token(id_token)
        
        if error:
            return jsonify({"error": f"认证失败: {error}"}), 401
        
        kwargs['user_info'] = user_info
        return f(*args, **kwargs)
    
    return decorated_function

@dashboard_bp.route('/overview', methods=['GET'])
@authenticate
def get_dashboard_overview(user_info):
    """
    获取仪表盘概览数据
    包括用户画像、财务健康度、目标进度等
    """
    try:
        user_id = user_info['uid']
        
        # 构建用户画像
        profile = user_profile_service.build_user_profile(user_id)
        
        # 获取统计数据
        statistics = user_data_service.get_user_statistics(user_id)
        
        # 构建概览数据
        overview = {
            'user_id': user_id,
            'email': user_info.get('email', ''),
            'financial_health': profile.get('financial_health', {}),
            'assessment_summary': profile.get('assessment_summary', {}),
            'active_goals_count': len([g for g in profile.get('goals', []) if g.get('status') == 'active']),
            'total_assessments': statistics.get('total_assessments', 0),
            'last_assessment_date': statistics.get('last_assessment_date'),
            'recommendations': profile.get('recommendations', [])[:5],  # 只返回前5条建议
            'risk_profile': profile.get('risk_profile', {})
        }
        
        return jsonify({
            'status': 'success',
            'data': overview
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'获取概览数据失败: {str(e)}'
        }), 500

@dashboard_bp.route('/financial-health', methods=['GET'])
@authenticate
def get_financial_health(user_info):
    """
    获取详细的财务健康度数据
    """
    try:
        user_id = user_info['uid']
        profile = user_profile_service.build_user_profile(user_id)
        
        financial_health = profile.get('financial_health', {})
        assessment_summary = profile.get('assessment_summary', {})
        
        # 构建详细的健康度数据
        health_data = {
            'overall_score': financial_health.get('overall_score', 0),
            'level': financial_health.get('level', '待评估'),
            'strengths': financial_health.get('strengths', []),
            'weaknesses': financial_health.get('weaknesses', []),
            'category_scores': assessment_summary.get('scores', {}),
            'trend': _calculate_health_trend(user_id)
        }
        
        return jsonify({
            'status': 'success',
            'data': health_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'获取财务健康度失败: {str(e)}'
        }), 500

@dashboard_bp.route('/goals', methods=['GET'])
@authenticate
def get_user_goals(user_info):
    """
    获取用户的财务目标列表
    支持按状态筛选
    """
    try:
        user_id = user_info['uid']
        status = request.args.get('status')  # active, completed, cancelled
        
        goals, error = user_profile_service.get_user_goals(user_id, status)
        
        if error:
            return jsonify({
                'status': 'error',
                'message': error
            }), 500
        
        return jsonify({
            'status': 'success',
            'data': {
                'goals': goals,
                'count': len(goals)
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'获取目标列表失败: {str(e)}'
        }), 500

@dashboard_bp.route('/goals', methods=['POST'])
@authenticate
def create_goal(user_info):
    """
    创建新的财务目标
    """
    try:
        user_id = user_info['uid']
        # silent=True：空 body / 非法 JSON 返回 None 而非抛 BadRequest，
        # 与 coach /chat、assessment /submit 输入校验保持一致（畸形请求 → 400 而非 500）
        goal_data = request.get_json(silent=True)
        
        if not goal_data:
            return jsonify({
                'status': 'error',
                'message': '目标数据不能为空'
            }), 400
        
        success, message = user_profile_service.update_user_goal(user_id, goal_data)
        
        if not success:
            return jsonify({
                'status': 'error',
                'message': message
            }), 400
        
        return jsonify({
            'status': 'success',
            'message': '目标创建成功',
            'data': goal_data
        }), 201
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'创建目标失败: {str(e)}'
        }), 500

@dashboard_bp.route('/goals/<goal_id>', methods=['PUT'])
@authenticate
def update_goal(user_info, goal_id):
    """
    更新财务目标
    """
    try:
        user_id = user_info['uid']
        updates = request.get_json()
        
        if not updates:
            return jsonify({
                'status': 'error',
                'message': '更新数据不能为空'
            }), 400
        
        success, message = user_data_service.update_user_data(
            user_id,
            'goals',
            goal_id,
            updates
        )
        
        if not success:
            return jsonify({
                'status': 'error',
                'message': message
            }), 400
        
        return jsonify({
            'status': 'success',
            'message': '目标更新成功'
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'更新目标失败: {str(e)}'
        }), 500

@dashboard_bp.route('/goals/<goal_id>', methods=['DELETE'])
@authenticate
def delete_goal(user_info, goal_id):
    """
    删除财务目标
    """
    try:
        user_id = user_info['uid']
        
        success, message = user_data_service.delete_user_data(
            user_id,
            'goals',
            goal_id
        )
        
        if not success:
            return jsonify({
                'status': 'error',
                'message': message
            }), 400
        
        return jsonify({
            'status': 'success',
            'message': '目标删除成功'
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'删除目标失败: {str(e)}'
        }), 500

@dashboard_bp.route('/statistics', methods=['GET'])
@authenticate
def get_statistics(user_info):
    """
    获取用户统计数据
    """
    try:
        user_id = user_info['uid']
        statistics = user_data_service.get_user_statistics(user_id)
        
        return jsonify({
            'status': 'success',
            'data': statistics
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'获取统计数据失败: {str(e)}'
        }), 500

@dashboard_bp.route('/recommendations', methods=['GET'])
@authenticate
def get_recommendations(user_info):
    """
    获取个性化建议
    """
    try:
        user_id = user_info['uid']
        profile = user_profile_service.build_user_profile(user_id)
        
        recommendations = profile.get('recommendations', [])
        
        # 按优先级排序
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        sorted_recommendations = sorted(
            recommendations,
            key=lambda x: priority_order.get(x.get('priority', 'low'), 3)
        )
        
        return jsonify({
            'status': 'success',
            'data': {
                'recommendations': sorted_recommendations,
                'count': len(sorted_recommendations)
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'获取建议失败: {str(e)}'
        }), 500

def _calculate_health_trend(user_id: str) -> dict:
    """
    计算财务健康度趋势
    """
    try:
        # 获取历史评估数据
        assessments, error = user_data_service.get_user_data(user_id, 'assessments', limit=10)
        
        if error or len(assessments) < 2:
            return {'direction': 'stable', 'change': 0}
        
        # 按时间排序
        sorted_assessments = sorted(assessments, key=lambda x: x.get('timestamp', ''))
        
        # 计算趋势
        first_score = sorted_assessments[0].get('total_score', 0)
        latest_score = sorted_assessments[-1].get('total_score', 0)
        change = latest_score - first_score
        
        if change > 0.3:
            direction = 'improving'
        elif change < -0.3:
            direction = 'declining'
        else:
            direction = 'stable'
        
        return {
            'direction': direction,
            'change': round(change, 2),
            'first_score': round(first_score, 2),
            'latest_score': round(latest_score, 2)
        }
        
    except Exception as e:
        print(f"计算趋势失败: {str(e)}")
        return {'direction': 'stable', 'change': 0}
