"""
coach_routes /chat 接口输入验证回归测试
================================================
背景：/chat 接口原实现仅检查 'message' key 是否存在，未校验请求体类型与
      message 类型/非空。malformed 请求会在日志行或 data.get() 处抛异常，
      被外层 except 捕获后返回 500（而非语义正确的 400）。
本测试固化修复后的约定：
  · 空 body / 非法 JSON → 400
  · 顶层非对象 JSON（数组/字符串/数字/布尔）→ 400，且 AI 服务不被调用
  · message 非字符串 / 空 / 纯空白 → 400
  · 合法 message → 透传给 AI 服务并返回业务包络
运行：cd backend && python -m pytest tests/test_coach_routes.py -v
"""
import sys
import os
from unittest.mock import MagicMock, patch

import pytest
from flask import Flask

# 确保 backend 包可导入
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.routes import coach_routes


@pytest.fixture
def app():
    """创建最小 Flask 应用并注册 coach_bp，替换 AI 服务为 mock。"""
    flask_app = Flask(__name__)
    flask_app.register_blueprint(coach_routes.coach_bp, url_prefix='/api/coach')

    # 用 mock 替换模块级 zhipuai_service，隔离外部 AI 依赖
    mock_service = MagicMock()
    mock_service.get_chat_response.return_value = {
        'status': 'success',
        'reply': '这是一条测试回复',
    }
    coach_routes.zhipuai_service = mock_service

    flask_app.config['TESTING'] = True
    return flask_app


@pytest.fixture
def client(app):
    return app.test_client()


class TestChatInputValidation:
    """/chat 接口输入验证边界用例。"""

    def test_empty_body_returns_400(self, client):
        """空请求体 → 400 请求数据为空。"""
        resp = client.post('/api/coach/chat',
                           data=None, content_type='application/json')
        assert resp.status_code == 400
        body = resp.get_json()
        assert body['status'] == 'error'
        assert '请求数据为空' in body['message']

    def test_invalid_json_returns_400(self, client):
        """非法 JSON body → 400（修复前 get_json 抛 BadRequest 被吞成 500）。"""
        resp = client.post('/api/coach/chat',
                           data='{invalid json', content_type='application/json')
        assert resp.status_code == 400
        body = resp.get_json()
        assert body['status'] == 'error'
        assert '请求数据为空' in body['message']

    def test_top_level_array_returns_400(self, client, app):
        """顶层 JSON 数组 → 400，AI 服务不被调用（修复前 data.get 抛 AttributeError → 500）。"""
        resp = client.post('/api/coach/chat', json=['hello', 'world'])
        assert resp.status_code == 400
        body = resp.get_json()
        assert body['status'] == 'error'
        assert 'JSON对象' in body['message']
        coach_routes.zhipuai_service.get_chat_response.assert_not_called()

    def test_top_level_string_returns_400(self, client, app):
        """顶层 JSON 字符串 → 400，AI 服务不被调用。"""
        resp = client.post('/api/coach/chat', json='just a string')
        assert resp.status_code == 400
        body = resp.get_json()
        assert body['status'] == 'error'
        assert 'JSON对象' in body['message']
        coach_routes.zhipuai_service.get_chat_response.assert_not_called()

    def test_top_level_number_returns_400(self, client, app):
        """顶层 JSON 数字 → 400，AI 服务不被调用。"""
        resp = client.post('/api/coach/chat', json=42)
        assert resp.status_code == 400
        body = resp.get_json()
        assert body['status'] == 'error'
        assert 'JSON对象' in body['message']
        coach_routes.zhipuai_service.get_chat_response.assert_not_called()

    def test_top_level_boolean_returns_400(self, client, app):
        """顶层 JSON 布尔值 → 400，AI 服务不被调用。"""
        resp = client.post('/api/coach/chat', json=True)
        assert resp.status_code == 400
        body = resp.get_json()
        assert body['status'] == 'error'
        assert 'JSON对象' in body['message']
        coach_routes.zhipuai_service.get_chat_response.assert_not_called()

    def test_missing_message_key_returns_400(self, client):
        """缺少 message key → 400 消息内容必须为非空字符串。"""
        resp = client.post('/api/coach/chat',
                           json={'user_id': 'u1'})
        assert resp.status_code == 400
        body = resp.get_json()
        assert body['status'] == 'error'
        assert '非空字符串' in body['message']

    def test_message_none_returns_400(self, client):
        """message 为 null → 400（修复前会 500 TypeError）。"""
        resp = client.post('/api/coach/chat',
                           json={'message': None})
        assert resp.status_code == 400
        body = resp.get_json()
        assert body['status'] == 'error'
        assert '非空字符串' in body['message']

    def test_message_number_returns_400(self, client):
        """message 为数字 → 400（修复前会 500 TypeError）。"""
        resp = client.post('/api/coach/chat',
                           json={'message': 12345})
        assert resp.status_code == 400
        body = resp.get_json()
        assert body['status'] == 'error'
        assert '非空字符串' in body['message']

    def test_message_empty_string_returns_400(self, client):
        """message 为空字符串 → 400。"""
        resp = client.post('/api/coach/chat',
                           json={'message': ''})
        assert resp.status_code == 400
        body = resp.get_json()
        assert body['status'] == 'error'
        assert '非空字符串' in body['message']

    def test_message_whitespace_only_returns_400(self, client):
        """message 为纯空白 → 400。"""
        resp = client.post('/api/coach/chat',
                           json={'message': '   \t\n  '})
        assert resp.status_code == 400
        body = resp.get_json()
        assert body['status'] == 'error'
        assert '非空字符串' in body['message']

    def test_message_list_returns_400(self, client):
        """message 为数组 → 400（修复前会 500 TypeError）。"""
        resp = client.post('/api/coach/chat',
                           json={'message': ['a', 'b']})
        assert resp.status_code == 400
        body = resp.get_json()
        assert body['status'] == 'error'
        assert '非空字符串' in body['message']

    def test_valid_message_calls_ai_service(self, client, app):
        """合法 message → 调用 AI 服务并返回 200 业务包络。"""
        with app.app_context():
            coach_routes.zhipuai_service.get_chat_response.return_value = {
                'status': 'success',
                'reply': '你好，建议先做月度预算',
            }
        resp = client.post('/api/coach/chat',
                           json={'message': '你好', 'user_id': 'u1'})
        assert resp.status_code == 200
        body = resp.get_json()
        assert body['status'] == 'success'
        assert body['reply'] == '你好，建议先做月度预算'
        coach_routes.zhipuai_service.get_chat_response.assert_called_once()

    def test_ai_service_error_returns_500(self, client, app):
        """AI 服务返回 error 包络 → 500 并透传 message。"""
        with app.app_context():
            coach_routes.zhipuai_service.get_chat_response.return_value = {
                'status': 'error',
                'message': 'AI服务繁忙',
            }
        resp = client.post('/api/coach/chat',
                           json={'message': '你好'})
        assert resp.status_code == 500
        body = resp.get_json()
        assert body['status'] == 'error'
        assert body['message'] == 'AI服务繁忙'


class TestCoachHealth:
    """/coach/health 健康检查端点。"""

    def test_health_returns_200(self, client):
        resp = client.get('/api/coach/health')
        assert resp.status_code == 200
        body = resp.get_json()
        assert body['status'] == 'ok'
