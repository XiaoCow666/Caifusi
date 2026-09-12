from flask import Blueprint, request, jsonify, current_app
import logging
import math

logger = logging.getLogger('assessment_routes')

assessment_bp = Blueprint('assessment_bp', __name__)

# 每题最高选项分值（src/pages/Assessment.js 的 questions：选项 score 取值 1~4）。
# total_score 是「1~4 平均分」，total_score_percentage 是「0~100 得分率」，
# 两者口径不同，换算基准由该常量给出。
MAX_OPTION_SCORE = 4.0


def _mean_to_percentage(total_score):
    """把 1~4 分制的平均分换算成 0~100 得分率；无法换算时返回 0.0。"""
    try:
        return round(float(total_score) / MAX_OPTION_SCORE * 100, 1)
    except (TypeError, ValueError):
        return 0.0


def _resolve_total_score_percentage(submitted, total_score):
    """解析本次提交的 0~100 得分率。

    优先采信前端随请求提交的 total_score_percentage：前端的分母固定为全部题数
    （Assessment.js:431，跳过未答题目按 0 分计），与后端「按已答题目求平均」不同，
    跳题时两者相差一个数量级，因此以前端为准。前端未提交或取值非法时，
    按平均分换算成 0~100 回退——修复前此处直接写入 round(total_score, 1)，
    使 1~4 尺度的值进入了语义为百分比（schema.sql:37「评分百分比/得分率」）的字段。
    """
    if isinstance(submitted, (int, float)) and not isinstance(submitted, bool):
        value = float(submitted)
        if math.isfinite(value) and 0.0 <= value <= 100.0:
            return round(value, 1)

    return _mean_to_percentage(total_score)


def _normalize_stored_percentage(record):
    """读取侧兼容：把历史上按 1~4 平均分错写的百分比字段换算回 0~100。

    修复前落库的记录中 total_score_percentage 恒等于 round(total_score, 1)。
    合法得分率的最小值受「每题至少 1 分」约束（10 题 → 不低于 25），而平均分不超过 4，
    两者不可能相等，故「两值相等」是旧记录的确定性特征，不会误判修复后的新记录。
    仅作用于响应出口，不修改底层存储，因此可随代码回滚。
    """
    stored = record.get('total_score_percentage')
    mean = record.get('total_score')

    if isinstance(stored, (int, float)) and not isinstance(stored, bool):
        stored = float(stored)
        if isinstance(mean, (int, float)) and not isinstance(mean, bool) \
                and abs(stored - round(float(mean), 1)) < 0.05:
            return _mean_to_percentage(mean)
        return stored

    return _mean_to_percentage(mean)


def _get_user_data_service():
    """Lazy-load user_data_service to avoid Python 3.14 metaclass issue at import time."""
    from app.services.user_data_service import user_data_service
    return user_data_service


def _verify_token(id_token):
    """Lazy-load and call verify_firebase_token."""
    from app.services.auth_service import verify_firebase_token
    return verify_firebase_token(id_token)


def authenticate(f):
    """Decorator to verify Firebase ID token."""
    from functools import wraps

    @wraps(f)
    def decorated_function(*args, **kwargs):
        import os
        is_dev = os.environ.get('DEV_MODE') == 'true' or current_app.config.get('DEV_MODE')
        
        if is_dev:
            kwargs['user_info'] = {'uid': 'test_user_id', 'email': 'test@example.com'}
            return f(*args, **kwargs)

        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization token is required"}), 401

        id_token = auth_header.split('Bearer ')[1]
        try:
            user_info, error = _verify_token(id_token)
        except Exception as e:
            return jsonify({"error": f"Authentication failed: {str(e)}"}), 401

        if error:
            return jsonify({"error": f"Authentication failed: {error}"}), 401

        kwargs['user_info'] = user_info
        return f(*args, **kwargs)

    return decorated_function


@assessment_bp.route('/submit', methods=['POST'])
@authenticate
def submit_assessment(user_info):
    """
    提交财务心智评估结果，支持多维度评分和详细分析
    """
    data = request.get_json()
    assessment_data = data.get('assessment') if data else None

    if not assessment_data:
        return jsonify({"error": "评估数据不能为空"}), 400

    required_fields = ['answers', 'scores']
    missing_fields = [field for field in required_fields if field not in assessment_data]

    if missing_fields:
        return jsonify({
            "error": f"缺少必需字段: {', '.join(missing_fields)}"
        }), 400

    user_id = user_info['uid']

    scores = assessment_data.get('scores', {})

    # 校验 scores 为「字段名 -> 数值」的对象：修复前 scores 为数组时 .values()
    # 抛 AttributeError，取值为字符串/None 时 sum() 抛 TypeError——均未被捕获，
    # 被外层兜成 500。与 coach /chat 输入校验（PR #12）一致：畸形输入返回 400。
    if not isinstance(scores, dict):
        return jsonify({"error": "scores 必须为对象"}), 400

    non_numeric = [
        key for key, value in scores.items()
        # bool 是 int 的子类，需显式排除 True/False
        if isinstance(value, bool) or not isinstance(value, (int, float))
    ]
    if non_numeric:
        return jsonify({
            "error": f"scores 必须全部为数值字段: {', '.join(sorted(non_numeric))}"
        }), 400

    total_score = sum(scores.values()) / len(scores) if scores else 0

    # Build complete assessment with percentage scores for history display
    category_scores_pct = assessment_data.get('categoryScores', {})

    complete_assessment = {
        'answers': assessment_data['answers'],
        'scores': scores,
        'total_score': total_score,
        'total_score_percentage': _resolve_total_score_percentage(
            assessment_data.get('total_score_percentage'), total_score
        ),
        'category_scores_percentage': category_scores_pct,
        'categories': assessment_data.get('categories', {}),
        'recommendations': _generate_recommendations(scores),
        'completed': True
    }

    try:
        uds = _get_user_data_service()
        success, message = uds.save_user_data(user_id, 'assessments', complete_assessment)
    except Exception as e:
        logger.error(f"save_user_data failed: {e}")
        return jsonify({"error": f"保存失败: {str(e)}"}), 500

    if not success:
        return jsonify({"error": message}), 500

    # Also save to legacy firestore service for compatibility (lazy import, non-critical)
    try:
        from app.services.firestore_service import save_assessment_results
        save_assessment_results(user_id, complete_assessment)
    except Exception:
        pass

    return jsonify({
        "message": "评估提交成功",
        "assessment": complete_assessment,
        "total_score": total_score
    }), 200


@assessment_bp.route('/results', methods=['GET'])
@authenticate
def get_results(user_info):
    """
    Retrieve the latest assessment result for the current user.
    """
    user_id = user_info['uid']

    try:
        from app.services.firestore_service import get_assessment_results
        results, error = get_assessment_results(user_id)
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve assessment results: {str(e)}"}), 500

    if error:
        return jsonify({"error": f"Failed to retrieve assessment results: {error}"}), 500

    if not results:
        return jsonify({"error": "No assessment results found"}), 404

    return jsonify({"results": results}), 200


@assessment_bp.route('/history', methods=['GET'])
@authenticate
def get_history(user_info):
    """
    Retrieve all historical assessment records for the current user,
    ordered by time (newest first). Used by the frontend history view.
    """
    user_id = user_info['uid']
    limit_raw = request.args.get('limit', '50')
    try:
        limit = int(limit_raw)
    except (TypeError, ValueError):
        # 修复前 int('abc') 抛 ValueError 未捕获 -> 500；畸形输入应返回 400
        return jsonify({"error": "limit 参数必须为整数"}), 400
    # 上界与旧实现一致收敛到 100；下界收敛到 1，避免负数透传到存储层
    limit = max(1, min(limit, 100))

    try:
        uds = _get_user_data_service()
        data_list, error = uds.get_user_data(user_id, 'assessments', limit=limit)
    except Exception as e:
        logger.error(f"get_user_data failed: {e}")
        return jsonify({"error": f"获取历史记录失败: {str(e)}"}), 500

    if error:
        return jsonify({"error": f"获取历史记录失败: {error}"}), 500

    # Normalize records
    history = []
    for record in data_list:
        history.append({
            'id': record.get('id', ''),
            'timestamp': record.get('timestamp', ''),
            'total_score_percentage': _normalize_stored_percentage(record),
            'category_scores_percentage': record.get('category_scores_percentage', {}),
            'recommendations': record.get('recommendations', []),
            'completed': record.get('completed', True),
        })

    # Sort newest first
    history.sort(key=lambda x: x.get('timestamp', ''), reverse=True)

    return jsonify({"history": history, "total": len(history)}), 200


@assessment_bp.route('/latest', methods=['GET'])
@authenticate
def get_latest(user_info):
    """
    Retrieve the most recent assessment record for the current user.
    """
    user_id = user_info['uid']

    try:
        uds = _get_user_data_service()
        data, error = uds.get_latest_data(user_id, 'assessments')
    except Exception as e:
        logger.error(f"get_latest_data failed: {e}")
        return jsonify({"error": f"获取最新评估失败: {str(e)}"}), 500

    if error:
        return jsonify({"error": f"获取最新评估失败: {error}"}), 500

    if not data:
        return jsonify({"assessment": None}), 200

    # 与 /history 同口径；拷贝后再换算，避免改动底层存储中的记录
    normalized = dict(data)
    normalized['total_score_percentage'] = _normalize_stored_percentage(data)

    return jsonify({"assessment": normalized}), 200


def _generate_recommendations(scores):
    """Generate simple recommendations based on category scores."""
    recommendations = []
    category_thresholds = {
        'savings': '增加储蓄比例：尝试使用50/30/20法则，将20%收入用于储蓄。',
        'emergency': '建立应急基金：目标覆盖3-6个月基本生活支出。',
        'debt': '管理债务：优先偿还高息债务，考虑债务合并降低利率。',
        'knowledge': '增加财务知识：阅读财经书籍，参加理财课程。',
        'tracking': '追踪收支：使用预算应用详细记录收入和支出。',
        'insurance': '完善保险计划：确保有足够的健康险和意外险保障。',
        'risk': '优化风险管理：根据自身情况配置合适的风险资产比例。',
        'income': '稳定收入：探索多元化收入来源，降低收入波动风险。',
        'goals': '设定财务目标：制定具体可行的短中长期财务目标。',
        'pressure': '提升应对能力：建立完善的财务缓冲机制。',
    }
    for category, advice in category_thresholds.items():
        score = scores.get(category, 4)
        if score < 3:
            recommendations.append(advice)

    if not recommendations:
        recommendations.append('继续保持良好的财务习惯，定期审视您的财务目标和计划。')

    return recommendations