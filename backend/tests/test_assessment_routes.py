"""
assessment_routes 输入校验回归测试
================================================
背景：与 PR #12（coach /chat 输入校验）同一类缺陷。/assessment/* 路由在以下两类
畸形输入上未捕获异常，被外层兜成 500（生产环境返回 HTML 错误页，而非语义正确的
JSON 400）：

  1. GET  /api/assessment/history?limit=abc
       旧实现 `limit = min(int(request.args.get('limit', 50)), 100)`：
       非整数字符串使 int() 抛 ValueError（assessment_routes.py get_history）。
  2. POST /api/assessment/submit  body.assessment.scores 取值非数值
       旧实现 `total_score = sum(scores.values()) / len(scores)`：
       scores 里出现字符串 / null / bool 时 sum() 抛 TypeError；
       scores 本身不是 dict 时 .items() 抛 AttributeError。

本测试固化修复后约定（错误包络沿用 assessment 路由既有 `{"error": "..."}` 形态，
与 coach 路由的 `{"status":"error"}` 刻意区分）：
  · history.limit 非整数 → 400，且不触达数据服务
  · history.limit 越界 → 收敛到 [1, 100]，不抛错
  · submit: assessment 缺失 / scores 非对象 / scores 含非数值 → 400，且不写库
  · submit: 合法 scores → 200，total_score 为算术平均，并触达数据服务

运行：cd backend && python -m pytest tests/test_assessment_routes.py -v
前置：DEV_MODE 由测试 fixture 通过 app.config 注入（不依赖环境变量），无需真实 Firebase。
"""
import os
import sys
from unittest.mock import MagicMock

import pytest
from flask import Flask

# 确保 backend 包可导入
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.routes import assessment_routes


@pytest.fixture
def app():
    """创建最小 Flask 应用并注册 assessment_bp，DEV_MODE 注入以绕过鉴权。"""
    flask_app = Flask(__name__)
    flask_app.register_blueprint(assessment_routes.assessment_bp,
                                  url_prefix='/api/assessment')
    # authenticate() 在开发态直接注入 user_info，测试不需要真实 Firebase token
    flask_app.config['DEV_MODE'] = True
    flask_app.config['TESTING'] = True

    # 用 mock 替换 user_data_service，隔离 memory/MySQL/Firestore 存储后端
    mock_uds = MagicMock()
    mock_uds.save_user_data.return_value = (True, 'ok')
    mock_uds.get_user_data.return_value = ([], None)
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(assessment_routes, '_get_user_data_service', lambda: mock_uds)
        flask_app.test_uds = mock_uds
        yield flask_app


@pytest.fixture
def client(app):
    return app.test_client()


class TestHistoryLimitValidation:
    """/assessment/history 的 limit 查询参数解析。"""

    def test_non_integer_limit_returns_400(self, client, app):
        """limit=abc → 400，且不触达数据服务（修复前 int() 抛 ValueError → 500）。"""
        resp = client.get('/api/assessment/history?limit=abc')
        assert resp.status_code == 400
        body = resp.get_json()
        assert 'limit' in body['error']
        app.test_uds.get_user_data.assert_not_called()

    def test_float_limit_returns_400(self, client, app):
        """limit=3.5（浮点）→ 400（int('3.5') 同样抛 ValueError）。"""
        resp = client.get('/api/assessment/history?limit=3.5')
        assert resp.status_code == 400
        app.test_uds.get_user_data.assert_not_called()

    def test_negative_limit_is_clamped_to_one(self, client, app):
        """limit=-5 → 收敛到 1（修复前透传负数，依赖存储层行为不确定）。"""
        resp = client.get('/api/assessment/history?limit=-5')
        assert resp.status_code == 200
        # get_user_data(user_id, 'assessments', limit=limit) —— limit 是关键字
        assert app.test_uds.get_user_data.call_args.kwargs.get('limit') == 1

    def test_oversized_limit_is_clamped_to_100(self, client, app):
        """limit=99999 → 收敛到 100（与旧 min(...,100) 上界一致）。"""
        resp = client.get('/api/assessment/history?limit=99999')
        assert resp.status_code == 200
        called_args = app.test_uds.get_user_data.call_args
        # get_user_data(user_id, 'assessments', limit=limit) —— limit 是关键字
        assert called_args.kwargs.get('limit') == 100

    def test_default_limit_is_50(self, client, app):
        """不传 limit → 默认 50。"""
        resp = client.get('/api/assessment/history')
        assert resp.status_code == 200
        assert app.test_uds.get_user_data.call_args.kwargs.get('limit') == 50


class TestSubmitValidation:
    """/assessment/submit 入参校验。"""

    def _valid_payload(self):
        return {'assessment': {'answers': {'q1': 'a'},
                               'scores': {'savings': 3, 'debt': 4}}}

    def test_empty_body_returns_400(self, client, app):
        """空请求体 → 400，且不写库。"""
        resp = client.post('/api/assessment/submit',
                           data=None, content_type='application/json')
        assert resp.status_code == 400
        app.test_uds.save_user_data.assert_not_called()

    def test_missing_assessment_returns_400(self, client, app):
        """顶层不带 assessment → 400。"""
        resp = client.post('/api/assessment/submit', json={})
        assert resp.status_code == 400
        app.test_uds.save_user_data.assert_not_called()

    def test_missing_scores_returns_400(self, client, app):
        """assessment 缺 scores 字段 → 400（既有契约，回归锁定）。"""
        resp = client.post('/api/assessment/submit',
                           json={'assessment': {'answers': {'q1': 'a'}}})
        assert resp.status_code == 400
        app.test_uds.save_user_data.assert_not_called()

    def test_scores_not_object_returns_400(self, client, app):
        """scores 为数组 → 400（修复前 .items() 抛 AttributeError → 500）。"""
        resp = client.post('/api/assessment/submit',
                           json={'assessment': {'answers': {'q1': 'a'},
                                                'scores': [1, 2, 3]}})
        assert resp.status_code == 400
        app.test_uds.save_user_data.assert_not_called()

    def test_scores_string_value_returns_400(self, client, app):
        """scores 取值为字符串 → 400（修复前 sum() 抛 TypeError → 500）。"""
        resp = client.post('/api/assessment/submit',
                           json={'assessment': {'answers': {'q1': 'a'},
                                                'scores': {'savings': 'five'}}})
        assert resp.status_code == 400
        app.test_uds.save_user_data.assert_not_called()

    def test_scores_null_value_returns_400(self, client, app):
        """scores 取值为 null → 400（修复前 sum() 抛 TypeError → 500）。"""
        resp = client.post('/api/assessment/submit',
                           json={'assessment': {'answers': {'q1': 'a'},
                                                'scores': {'savings': 3, 'x': None}}})
        assert resp.status_code == 400
        app.test_uds.save_user_data.assert_not_called()

    def test_scores_bool_value_returns_400(self, client, app):
        """scores 取值为 bool → 400（isinstance(True, int) 为真，需显式排除）。"""
        resp = client.post('/api/assessment/submit',
                           json={'assessment': {'answers': {'q1': 'a'},
                                                'scores': {'savings': True}}})
        assert resp.status_code == 400
        app.test_uds.save_user_data.assert_not_called()

    def test_valid_scores_succeeds_and_averages(self, client, app):
        """合法 scores → 200，total_score 为算术平均，并写库。"""
        resp = client.post('/api/assessment/submit', json=self._valid_payload())
        assert resp.status_code == 200
        body = resp.get_json()
        # (3 + 4) / 2 == 3.5
        assert body['assessment']['total_score'] == 3.5
        app.test_uds.save_user_data.assert_called_once()
