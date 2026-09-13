"""
dashboard_routes 回归测试
================================================
背景：dashboard 路由此前没有任何单元测试。本测试固化以下既有约定，
防止未来重构时破坏认证行为、数据形状和建议排序逻辑。

测试范围（全部使用 mock 隔离存储层，不触达 Firebase/MySQL）：
  · 认证：DEV_MODE 注入用户；非 DEV_MODE 缺 Authorization → 401
  · GET  /overview          → 200，返回 user_id / financial_health / active_goals_count 等字段
  · GET  /financial-health  → 200，返回 overall_score / level / trend
  · GET  /goals             → 200，支持 status 筛选，返回 goals + count
  · POST /goals             → 空 body 400；缺少必需字段 400；合法 payload 201
  · GET  /statistics        → 200，透传 user_data_service 统计
  · GET  /recommendations   → 200，按 priority high→medium→low 排序

运行：cd backend && python -m pytest tests/test_dashboard_routes.py -v
前置：DEV_MODE 由测试 fixture 通过 app.config 注入，无需真实 Firebase。
"""
import os
import sys
from unittest.mock import MagicMock

import pytest
from flask import Flask

# 确保 backend 包可导入
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.routes import dashboard_routes


@pytest.fixture
def app():
    """创建最小 Flask 应用并注册 dashboard_bp，DEV_MODE 注入以绕过鉴权。"""
    flask_app = Flask(__name__)
    flask_app.register_blueprint(dashboard_routes.dashboard_bp,
                                  url_prefix='/api/dashboard')
    flask_app.config['DEV_MODE'] = True
    flask_app.config['TESTING'] = True

    # 用 mock 替换两个模块级服务单例，隔离 memory/MySQL/Firestore 存储后端
    mock_profile = MagicMock()
    mock_data = MagicMock()
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(dashboard_routes, 'user_profile_service', mock_profile)
        mp.setattr(dashboard_routes, 'user_data_service', mock_data)
        flask_app.test_profile = mock_profile
        flask_app.test_data = mock_data
        yield flask_app


@pytest.fixture
def client(app):
    return app.test_client()


# ---------------------------------------------------------------------------
# 认证行为
# ---------------------------------------------------------------------------
class TestDashboardAuth:
    """dashboard 路由的认证装饰器行为。"""

    def test_dev_mode_allows_request(self, client, app):
        """DEV_MODE=True → 直接注入测试用户，返回 200。"""
        app.test_profile.build_user_profile.return_value = {
            'financial_health': {}, 'assessment_summary': {},
            'goals': [], 'recommendations': [], 'risk_profile': {},
        }
        app.test_data.get_user_statistics.return_value = {}
        resp = client.get('/api/dashboard/overview')
        assert resp.status_code == 200

    def test_non_dev_mode_without_token_returns_401(self, app):
        """非 DEV_MODE 且无 Authorization 头 → 401。"""
        app.config['DEV_MODE'] = False
        client = app.test_client()
        resp = client.get('/api/dashboard/overview')
        assert resp.status_code == 401
        assert 'error' in resp.get_json()
        app.test_profile.build_user_profile.assert_not_called()

    def test_non_dev_mode_with_bearer_token_attempts_verification(self, app):
        """非 DEV_MODE 且带 Bearer 头 → 调用 verify_firebase_token；伪造 token 失败 → 401。"""
        app.config['DEV_MODE'] = False
        client = app.test_client()

        with pytest.MonkeyPatch.context() as mp:
            mock_verify = MagicMock(return_value=(None, 'invalid token'))
            mp.setattr(dashboard_routes, 'verify_firebase_token', mock_verify)
            resp = client.get('/api/dashboard/overview',
                              headers={'Authorization': 'Bearer fake-token'})
        assert resp.status_code == 401
        assert '认证失败' in resp.get_json()['error']
        # 确认 token 确实传给了 verify 函数，而非在更早就被拦截
        mock_verify.assert_called_once_with('fake-token')


# ---------------------------------------------------------------------------
# GET /overview
# ---------------------------------------------------------------------------
class TestDashboardOverview:
    """GET /api/dashboard/overview"""

    def _setup_profile(self, app):
        app.test_profile.build_user_profile.return_value = {
            'financial_health': {'overall_score': 3.2, 'level': '良好'},
            'assessment_summary': {'total_score': 3.2},
            'goals': [
                {'status': 'active', 'title': '应急基金'},
                {'status': 'completed', 'title': '旧目标'},
                {'status': 'active', 'title': '储蓄'},
            ],
            'recommendations': [
                {'text': '建议1', 'priority': 'high'},
                {'text': '建议2', 'priority': 'low'},
                {'text': '建议3', 'priority': 'medium'},
                {'text': '建议4', 'priority': 'high'},
                {'text': '建议5', 'priority': 'low'},
                {'text': '建议6-不应出现', 'priority': 'low'},  # 只返回前5条
            ],
            'risk_profile': {'level': '平衡型'},
        }
        app.test_data.get_user_statistics.return_value = {
            'total_assessments': 3,
            'last_assessment_date': '2026-09-01',
        }

    def test_overview_returns_200_and_expected_fields(self, client, app):
        self._setup_profile(app)
        resp = client.get('/api/dashboard/overview')
        assert resp.status_code == 200
        body = resp.get_json()
        assert body['status'] == 'success'
        data = body['data']
        # DEV_MODE 注入的固定测试用户
        assert data['user_id'] == 'test_user_id'
        assert data['email'] == 'test@example.com'
        # 活跃目标数 = 2（两个 active，一个 completed）
        assert data['active_goals_count'] == 2
        assert data['total_assessments'] == 3
        assert data['last_assessment_date'] == '2026-09-01'
        # recommendations 截断为前 5 条
        assert len(data['recommendations']) == 5
        assert data['risk_profile'] == {'level': '平衡型'}

    def test_overview_service_error_returns_500(self, client, app):
        """build_user_profile 抛异常 → 500 错误包络。"""
        app.test_profile.build_user_profile.side_effect = RuntimeError('boom')
        resp = client.get('/api/dashboard/overview')
        assert resp.status_code == 500
        assert resp.get_json()['status'] == 'error'


# ---------------------------------------------------------------------------
# GET /financial-health
# ---------------------------------------------------------------------------
class TestFinancialHealth:
    """GET /api/dashboard/financial-health"""

    def test_health_returns_data_with_trend(self, client, app):
        app.test_profile.build_user_profile.return_value = {
            'financial_health': {
                'overall_score': 3.5,
                'level': '优秀',
                'strengths': ['储蓄能力'],
                'weaknesses': [],
            },
            'assessment_summary': {'scores': {'savings': 3.5}},
        }
        # _calculate_health_trend 内部调用 get_user_data；返回不足 2 条 → stable
        app.test_data.get_user_data.return_value = ([], None)

        resp = client.get('/api/dashboard/financial-health')
        assert resp.status_code == 200
        body = resp.get_json()
        assert body['status'] == 'success'
        data = body['data']
        assert data['overall_score'] == 3.5
        assert data['level'] == '优秀'
        assert data['strengths'] == ['储蓄能力']
        # 历史不足 2 条时 trend 为 stable
        assert data['trend']['direction'] == 'stable'

    def test_health_trend_improving(self, client, app):
        """多次评估且分数上升 → direction=improving。"""
        app.test_profile.build_user_profile.return_value = {
            'financial_health': {'overall_score': 3.0, 'level': '良好',
                                 'strengths': [], 'weaknesses': []},
            'assessment_summary': {'scores': {}},
        }
        app.test_data.get_user_data.return_value = (
            [
                {'timestamp': '2026-01-01', 'total_score': 2.0},
                {'timestamp': '2026-06-01', 'total_score': 3.5},
            ],
            None,
        )
        resp = client.get('/api/dashboard/financial-health')
        assert resp.status_code == 200
        trend = resp.get_json()['data']['trend']
        assert trend['direction'] == 'improving'
        assert trend['change'] == 1.5


# ---------------------------------------------------------------------------
# GET /goals
# ---------------------------------------------------------------------------
class TestGetGoals:
    """GET /api/dashboard/goals"""

    def test_get_all_goals(self, client, app):
        goals = [
            {'id': 'g1', 'title': '应急基金', 'status': 'active'},
            {'id': 'g2', 'title': '旅游', 'status': 'completed'},
        ]
        app.test_profile.get_user_goals.return_value = (goals, None)

        resp = client.get('/api/dashboard/goals')
        assert resp.status_code == 200
        body = resp.get_json()
        assert body['status'] == 'success'
        assert body['data']['count'] == 2
        assert len(body['data']['goals']) == 2
        # 未传 status → 第二个位置参数应为 None
        called_args = app.test_profile.get_user_goals.call_args
        assert called_args[0][1] is None

    def test_get_goals_with_status_filter(self, client, app):
        app.test_profile.get_user_goals.return_value = (
            [{'id': 'g1', 'status': 'active'}], None,
        )
        resp = client.get('/api/dashboard/goals?status=active')
        assert resp.status_code == 200
        assert resp.get_json()['data']['count'] == 1
        # 验证 status 透传
        called_args = app.test_profile.get_user_goals.call_args
        assert called_args[0][1] == 'active'

    def test_get_goals_service_error_returns_500(self, client, app):
        app.test_profile.get_user_goals.return_value = ([], 'db unavailable')
        resp = client.get('/api/dashboard/goals')
        assert resp.status_code == 500
        assert resp.get_json()['status'] == 'error'


# ---------------------------------------------------------------------------
# POST /goals
# ---------------------------------------------------------------------------
class TestCreateGoal:
    """POST /api/dashboard/goals"""

    def test_empty_body_returns_400(self, client, app):
        """空请求体 → 400 目标数据不能为空。"""
        resp = client.post('/api/dashboard/goals',
                           data=None, content_type='application/json')
        assert resp.status_code == 400
        assert resp.get_json()['status'] == 'error'
        app.test_profile.update_user_goal.assert_not_called()

    def test_invalid_json_returns_400(self, client, app):
        """非法 JSON body（如 `{`）→ 400 而非 500（修复前 get_json() 抛 BadRequest）。"""
        resp = client.post('/api/dashboard/goals',
                           data='{', content_type='application/json')
        assert resp.status_code == 400
        assert resp.get_json()['status'] == 'error'
        app.test_profile.update_user_goal.assert_not_called()

    def test_missing_required_fields_returns_400(self, client, app):
        """缺少必需字段（title/target_amount/deadline）→ 400。"""
        app.test_profile.update_user_goal.return_value = (
            False, '缺少必需字段: title, target_amount, deadline',
        )
        resp = client.post('/api/dashboard/goals', json={'foo': 'bar'})
        assert resp.status_code == 400
        assert '缺少必需字段' in resp.get_json()['message']

    def test_valid_goal_returns_201(self, client, app):
        """合法 payload → 201，透传 goal_data。"""
        app.test_profile.update_user_goal.return_value = (True, 'ok')
        payload = {
            'title': '应急基金',
            'target_amount': 50000,
            'deadline': '2026-12-31',
        }
        resp = client.post('/api/dashboard/goals', json=payload)
        assert resp.status_code == 201
        body = resp.get_json()
        assert body['status'] == 'success'
        assert body['message'] == '目标创建成功'
        # 断言 user_id 和 payload 完整透传到服务层
        called_args = app.test_profile.update_user_goal.call_args
        assert called_args[0][0] == 'test_user_id'  # DEV_MODE 注入的 uid
        assert called_args[0][1] == payload


# ---------------------------------------------------------------------------
# GET /statistics
# ---------------------------------------------------------------------------
class TestStatistics:
    """GET /api/dashboard/statistics"""

    def test_statistics_returns_data(self, client, app):
        app.test_data.get_user_statistics.return_value = {
            'total_assessments': 5,
            'last_assessment_date': '2026-08-15',
        }
        resp = client.get('/api/dashboard/statistics')
        assert resp.status_code == 200
        body = resp.get_json()
        assert body['status'] == 'success'
        assert body['data']['total_assessments'] == 5

    def test_statistics_service_error_returns_500(self, client, app):
        app.test_data.get_user_statistics.side_effect = RuntimeError('db down')
        resp = client.get('/api/dashboard/statistics')
        assert resp.status_code == 500
        assert resp.get_json()['status'] == 'error'


# ---------------------------------------------------------------------------
# GET /recommendations
# ---------------------------------------------------------------------------
class TestRecommendations:
    """GET /api/dashboard/recommendations —— 按优先级排序。"""

    def test_recommendations_sorted_by_priority(self, client, app):
        """high → medium → low → 未知优先级排最后。"""
        app.test_profile.build_user_profile.return_value = {
            'recommendations': [
                {'text': '低优先', 'priority': 'low'},
                {'text': '高优先A', 'priority': 'high'},
                {'text': '中优先', 'priority': 'medium'},
                {'text': '高优先B', 'priority': 'high'},
                {'text': '无优先级字段'},  # 默认按 low 处理，priority.get → 'low' → 3
            ],
        }
        resp = client.get('/api/dashboard/recommendations')
        assert resp.status_code == 200
        items = resp.get_json()['data']['recommendations']
        # 排序后前两条应为 high
        assert items[0]['priority'] == 'high'
        assert items[1]['priority'] == 'high'
        # 第三条为 medium
        assert items[2]['priority'] == 'medium'
        # 后两条为 low / 无优先级
        assert items[3]['priority'] == 'low'
        assert 'priority' not in items[4] or items[4].get('priority', 'low') == 'low'
        # count 字段
        assert resp.get_json()['data']['count'] == 5

    def test_recommendations_empty_list(self, client, app):
        app.test_profile.build_user_profile.return_value = {'recommendations': []}
        resp = client.get('/api/dashboard/recommendations')
        assert resp.status_code == 200
        body = resp.get_json()
        assert body['data']['count'] == 0
        assert body['data']['recommendations'] == []


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
