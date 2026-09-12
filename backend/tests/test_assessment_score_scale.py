"""
assessment 得分率口径（total_score_percentage）跨模块回归测试
================================================================
背景：`/api/assessment/submit` 把 1~4 分制的**平均分**写进了语义为 0~100
**得分率**的字段，前端历史页又按 0~100 渲染，形成一条跨前后端的口径错配。

链路（用户入口 → 服务 → 数据 → 最终反馈）：

  src/pages/Assessment.js:431   totalPct = Math.round((score / (10 * 4)) * 100)   ← 0~100
  src/pages/Assessment.js:438   total_score_percentage: totalPct                  ← 随请求发出
  src/services/api.js:291       POST /assessment/submit { assessment: {...} }
  backend/.../assessment_routes.py:93   total_score = sum(scores)/len(scores)      ← 1~4 平均分
  backend/.../assessment_routes.py:102  'total_score_percentage': round(total_score, 1)
                                                                  ↑ 丢弃前端算好的百分比
  backend/schema.sql:37         `total_score_percentage` DOUBLE COMMENT '评分百分比/得分率'
  backend/.../assessment_routes.py:189  GET /history 原样透传该字段
  src/pages/Assessment.js:610   const pct = Number(record.total_score_percentage)
  src/pages/Assessment.js:238   Sparkline y 轴同样按 0~100 取值

后果：10 题全选最优档（前端期望 100%）落库为 4.0，历史卡片显示「4%」、进度条 4%、
趋势图折线贴底，且 Assessment.js:171 的配色档位把满分判成 danger（红）——
而同一条记录的 category_scores_percentage 仍是 100，自相矛盾。

本测试固化修复后的口径边界：

  1. 写入侧：0~100 得分率必须有 0~100 的值。
     · 前端已算好并随请求提交时，采信前端口径（跳题时前端分母固定为全部题数，
       与「按已答题求平均」不同，必须以前端为准）。
     · 未提交 / 非法时，按平均分换算成 0~100 回退，绝不写入 1~4 尺度的值。
  2. 读取侧：修复前已落库的记录（该字段恰等于 round(total_score, 1)）在
     /history、/latest 出口处换算回 0~100，且不修改底层存储。

刻意锁定的既有兼容行为（不得被本次改动破坏）：

  · total_score 必须保持 1~4 算术平均——它同时被
      user_profile_service._calculate_financial_health 的 3.5/2.5/1.5 分级、
      _extract_risk_profile 的 3.5/2.5/1.5 分档、
      dashboard_routes._calculate_health_trend 的 ±0.3 趋势阈值、
      get_user_context_for_ai 的「{:.1f}/4.0」文案消费。
      test_assessment_routes.py::test_valid_scores_succeeds_and_averages 亦已锁定。
  · category_scores_percentage 语义（已是 0~100）不变。
  · 响应包络与错误包络形态不变（submit {message,assessment,total_score}；
    history {history,total}；latest {assessment}；错误 {error}）。
  · PR #22 的 400 入参校验行为不变。

运行：cd backend && python -m pytest tests/test_assessment_score_scale.py -v
前置：DEV_MODE 由 fixture 注入 app.config，user_data_service 被 mock，无需真实 Firebase/MySQL。
"""
import os
import sys
from unittest.mock import MagicMock

import pytest
from flask import Flask

# 确保 backend 包可导入
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.routes import assessment_routes


# ── 前端常量（对照 src/pages/Assessment.js:15-126 的 questions）──
# 每题的最高选项分值为 4，共 10 题，故满分 40、单题满分 4。
FRONTEND_CATEGORIES = [
    'savings', 'risk', 'emergency', 'debt', 'knowledge',
    'income', 'goals', 'tracking', 'insurance', 'pressure',
]
MAX_OPTION_SCORE = 4


def frontend_payload(answered_scores, include_percentage=True):
    """构造与 src/pages/Assessment.js:432-439 完全一致的上报体。

    Args:
        answered_scores: {category: 该题所选选项分值(1~4)}，模拟用户实际作答的题目。
        include_percentage: 是否携带前端算好的 0~100 总分百分比
            （老客户端 / 直接调 API 的场景不携带）。
    """
    answers = {
        str(i): {'optionId': 'd', 'score': score, 'category': category}
        for i, (category, score) in enumerate(answered_scores.items(), start=1)
    }
    # 前端 calculateResults()：单维度百分制 = 该维度得分 / (该维度题数 * 4) * 100
    category_scores = {cat: round(score / MAX_OPTION_SCORE * 100)
                       for cat, score in answered_scores.items()}
    payload = {
        'answers': answers,
        'scores': dict(answered_scores),
        'categoryScores': category_scores,
    }
    if include_percentage:
        # Assessment.js:431 —— 分母固定为全部题数（跳过未答题目按 0 分计）
        payload['total_score_percentage'] = round(
            sum(answered_scores.values()) / (len(FRONTEND_CATEGORIES) * MAX_OPTION_SCORE) * 100
        )
    return payload


def frontend_variant(percentage):
    """复刻 src/pages/Assessment.js:171-176 getCategoryVariant()：决定卡片配色。"""
    if percentage >= 75:
        return 'success'
    if percentage >= 50:
        return 'info'
    if percentage >= 25:
        return 'warning'
    return 'danger'


@pytest.fixture
def app():
    """最小 Flask 应用 + mock 数据服务（沿用 test_assessment_routes.py 的隔离方式）。"""
    flask_app = Flask(__name__)
    flask_app.register_blueprint(assessment_routes.assessment_bp,
                                 url_prefix='/api/assessment')
    flask_app.config['DEV_MODE'] = True
    flask_app.config['TESTING'] = True

    mock_uds = MagicMock()
    mock_uds.save_user_data.return_value = (True, 'ok')
    mock_uds.get_user_data.return_value = ([], None)
    mock_uds.get_latest_data.return_value = (None, None)
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(assessment_routes, '_get_user_data_service', lambda: mock_uds)
        flask_app.test_uds = mock_uds
        yield flask_app


@pytest.fixture
def client(app):
    return app.test_client()


def submitted_record(app):
    """取 submit 时实际写入存储层的那条记录。"""
    assert app.test_uds.save_user_data.call_args is not None
    return app.test_uds.save_user_data.call_args.args[2]


class TestSubmitPercentageScale:
    """写入侧：total_score_percentage 必须是 0~100 得分率。"""

    def test_full_marks_stores_100_percent(self, client, app):
        """10 题全选最优档 → 落库 100.0（修复前为 4.0，即 1~4 平均分）。"""
        payload = frontend_payload({cat: 4 for cat in FRONTEND_CATEGORIES})
        assert payload['total_score_percentage'] == 100

        resp = client.post('/api/assessment/submit', json={'assessment': payload})
        assert resp.status_code == 200

        record = submitted_record(app)
        assert record['total_score'] == 4.0          # 平均分口径保持不变
        assert record['total_score_percentage'] == 100.0

    def test_full_marks_renders_as_success_variant(self, client, app):
        """跨模块断言：后端落库的得分率喂给前端配色函数应是 success，而不是 danger。"""
        payload = frontend_payload({cat: 4 for cat in FRONTEND_CATEGORIES})
        client.post('/api/assessment/submit', json={'assessment': payload})

        percentage = submitted_record(app)['total_score_percentage']
        # 修复前 4.0 → 'danger'（满分被渲染成红色告警态）
        assert frontend_variant(percentage) == 'success'

    def test_skipped_questions_honor_frontend_denominator(self, client, app):
        """跳题场景：前端分母固定为全部 10 题，不以「按已答题目求平均」为准。

        只答最后一题（4 分）→ 前端 percent = 4/40 = 10%；若按平均分换算会得到 100%，
        二者相差一个数量级，故必须采信前端提交值。
        """
        payload = frontend_payload({'pressure': 4})
        assert payload['total_score_percentage'] == 10

        resp = client.post('/api/assessment/submit', json={'assessment': payload})
        assert resp.status_code == 200

        record = submitted_record(app)
        assert record['total_score'] == 4.0                  # 唯一作答题目得分即平均分
        assert record['total_score_percentage'] == 10.0      # 而非 100.0
        assert frontend_variant(record['total_score_percentage']) == 'danger'

    def test_missing_percentage_falls_back_to_percentage_scale(self, client, app):
        """兼容路径：不带 total_score_percentage 的旧客户端仍得到 0~100 的值。"""
        payload = frontend_payload({'savings': 3, 'debt': 4}, include_percentage=False)
        assert 'total_score_percentage' not in payload

        resp = client.post('/api/assessment/submit', json={'assessment': payload})
        assert resp.status_code == 200

        record = submitted_record(app)
        # 平均分 3.5 → 3.5 / 4 * 100 = 87.5（修复前会写入 3.5）
        assert record['total_score'] == 3.5
        assert record['total_score_percentage'] == 87.5
        assert frontend_variant(record['total_score_percentage']) == 'success'

    @pytest.mark.parametrize('bad_value', [None, 'abc', {}, [], -1, 100.5, float('nan')])
    def test_invalid_percentage_falls_back_to_percentage_scale(self, client, app, bad_value):
        """非法得分率一律回退到按平均分换算，不会写进 1~4 尺度的值。"""
        payload = frontend_payload({'savings': 4, 'debt': 4})
        payload['total_score_percentage'] = bad_value

        resp = client.post('/api/assessment/submit', json={'assessment': payload})
        assert resp.status_code == 200

        record = submitted_record(app)
        assert record['total_score_percentage'] == 100.0
        assert record['total_score'] == 4.0

    def test_total_score_scale_is_unchanged(self, client, app):
        """兼容路径：total_score 仍为 1~4 算术平均（财务健康度/趋势/AI 上下文的输入口径）。"""
        payload = frontend_payload({'savings': 3, 'debt': 4})
        resp = client.post('/api/assessment/submit', json={'assessment': payload})
        assert resp.status_code == 200
        assert resp.get_json()['total_score'] == 3.5
        assert submitted_record(app)['total_score'] == 3.5

    def test_category_percentage_semantics_unchanged(self, client, app):
        """兼容路径：category_scores_percentage 原样落库（本就是 0~100，不做换算）。"""
        payload = frontend_payload({'savings': 3, 'debt': 4})
        client.post('/api/assessment/submit', json={'assessment': payload})
        assert submitted_record(app)['category_scores_percentage'] == {'savings': 75, 'debt': 100}

    def test_response_envelope_is_unchanged(self, client, app):
        """兼容路径：submit 的响应包络形态保持 {message, assessment, total_score}。"""
        payload = frontend_payload({'savings': 3, 'debt': 4})
        body = client.post('/api/assessment/submit',
                           json={'assessment': payload}).get_json()
        assert set(body.keys()) == {'message', 'assessment', 'total_score'}
        # 该 payload 只答 2 题，前端 percent = round(7 / 40 * 100) = 18；
        # 响应中回显的得分率与提交值一致（而非按平均分 3.5 换算出的 87.5）
        assert body['assessment']['total_score_percentage'] == 18.0
        assert body['assessment']['total_score_percentage'] == float(
            payload['total_score_percentage'])


class TestStoredPercentageReadCompat:
    """读取侧：历史记录在出口处把 1~4 错值换算回 0~100，且不污染存储。"""

    @staticmethod
    def legacy_record():
        """修复前落库的形态：total_score_percentage 恰等于 round(total_score, 1)。"""
        return {
            'id': 'assessments_0',
            'timestamp': '2026-09-12T21:00:00',
            'total_score': 4.0,
            'total_score_percentage': 4.0,
            'category_scores_percentage': {'savings': 100},
            'recommendations': [],
            'completed': True,
        }

    def test_history_normalizes_legacy_record(self, client, app):
        """旧记录：4.0 → 100.0（修复前原样透传，历史页显示 4%）。"""
        app.test_uds.get_user_data.return_value = ([self.legacy_record()], None)

        resp = client.get('/api/assessment/history')
        assert resp.status_code == 200
        percentage = resp.get_json()['history'][0]['total_score_percentage']
        assert percentage == 100.0
        assert frontend_variant(percentage) == 'success'

    def test_history_does_not_mutate_stored_record(self, client, app):
        """兼容路径：换算只发生在响应出口，底层记录保持原样（非破坏性，可回滚）。"""
        record = self.legacy_record()
        app.test_uds.get_user_data.return_value = ([record], None)

        client.get('/api/assessment/history')
        assert record['total_score_percentage'] == 4.0

    def test_history_passes_through_new_records(self, client, app):
        """兼容路径：修复后落库的记录（已等于 100.0）不会被二次换算。"""
        app.test_uds.get_user_data.return_value = ([{
            'id': 'assessments_1',
            'timestamp': '2026-09-12T21:00:00',
            'total_score': 4.0,
            'total_score_percentage': 100.0,
            'category_scores_percentage': {},
            'recommendations': [],
            'completed': True,
        }], None)

        resp = client.get('/api/assessment/history')
        assert resp.get_json()['history'][0]['total_score_percentage'] == 100.0

    def test_history_keeps_partial_percentage_untouched(self, client, app):
        """兼容路径：合法的小百分比（跳题场景）不会被误判成旧记录。"""
        app.test_uds.get_user_data.return_value = ([{
            'id': 'assessments_2',
            'timestamp': '2026-09-12T21:00:00',
            'total_score': 4.0,
            'total_score_percentage': 10.0,
            'category_scores_percentage': {},
            'recommendations': [],
            'completed': True,
        }], None)

        resp = client.get('/api/assessment/history')
        assert resp.get_json()['history'][0]['total_score_percentage'] == 10.0

    def test_history_derives_percentage_when_field_absent(self, client, app):
        """兼容路径：更早的 Firestore 文档缺该字段时按平均分换算，而不是回落到 1~4 尺度。"""
        app.test_uds.get_user_data.return_value = ([{
            'id': 'assessments_3',
            'timestamp': '2026-09-12T21:00:00',
            'total_score': 2.0,
            'category_scores_percentage': {},
            'recommendations': [],
            'completed': True,
        }], None)

        resp = client.get('/api/assessment/history')
        assert resp.get_json()['history'][0]['total_score_percentage'] == 50.0

    def test_latest_normalizes_legacy_record(self, client, app):
        """latest 出口与 history 同口径，且响应包络仍是 {assessment}。"""
        app.test_uds.get_latest_data.return_value = (self.legacy_record(), None)

        resp = client.get('/api/assessment/latest')
        assert resp.status_code == 200
        body = resp.get_json()
        assert set(body.keys()) == {'assessment'}
        assert body['assessment']['total_score_percentage'] == 100.0
        # 其余字段保持原样
        assert body['assessment']['total_score'] == 4.0
        assert body['assessment']['category_scores_percentage'] == {'savings': 100}

    def test_latest_empty_still_returns_null(self, client, app):
        """兼容路径：无记录时仍返回 {"assessment": null}。"""
        app.test_uds.get_latest_data.return_value = (None, None)
        resp = client.get('/api/assessment/latest')
        assert resp.status_code == 200
        assert resp.get_json() == {'assessment': None}


class TestEndToEndWithRealMemoryStore:
    """端到端复核：真实应用工厂 + 真实内存存储（不 mock 数据服务）。

    上方两个测试类在存储边界上用了 mock；本类走完整的
    「HTTP 请求 → 路由 → user_data_service → 内存存储 → 路由 → HTTP 响应」链路，
    确保 mock 没有掩盖真实存储往返中的问题。
    """

    USER_ID = 'test_user_id'  # DEV_MODE 下 authenticate 注入的 uid

    @pytest.fixture
    def e2e(self):
        """按 test_app_smoke.py 的方式构建真实应用，并在用例后还原内存存储。"""
        from importlib import import_module
        from pathlib import Path

        backend_root = Path(__file__).resolve().parents[1]
        with pytest.MonkeyPatch.context() as mp:
            mp.setenv('DB_TYPE', 'memory')
            mp.setenv('DEV_MODE', 'true')   # 供 assessment authenticate() 绕过 Firebase
            mp.syspath_prepend(str(backend_root))

            app = import_module('app').create_app()
            app.config['TESTING'] = True

            firestore_service = import_module('app.services.firestore_service')
            saved = firestore_service._dev_db['users'].get(self.USER_ID)
            try:
                yield app.test_client(), firestore_service._dev_db
            finally:
                if saved is None:
                    firestore_service._dev_db['users'].pop(self.USER_ID, None)
                else:
                    firestore_service._dev_db['users'][self.USER_ID] = saved

    def test_full_round_trip_full_marks(self, e2e):
        """满分提交经真实存储往返后，/history 与 /latest 的得分率均为 100.0。"""
        client, _ = e2e
        payload = frontend_payload({cat: 4 for cat in FRONTEND_CATEGORIES})

        resp = client.post('/api/assessment/submit', json={'assessment': payload})
        assert resp.status_code == 200
        assert resp.get_json()['assessment']['total_score'] == 4.0
        assert resp.get_json()['assessment']['total_score_percentage'] == 100.0

        history = client.get('/api/assessment/history').get_json()
        assert history['total'] == 1
        assert history['history'][0]['total_score_percentage'] == 100.0

        latest = client.get('/api/assessment/latest').get_json()
        assert latest['assessment']['total_score_percentage'] == 100.0

    def test_legacy_rows_are_normalized_over_real_store(self, e2e):
        """兼容路径：存储中已存在的修复前记录，经真实读链路出口换算为 0~100。"""
        client, dev_db = e2e
        dev_db['users'].setdefault(self.USER_ID, {})['assessments'] = [
            {   # 修复前：平均分 4.0 被错写进百分比字段
                'id': 'legacy_full', 'timestamp': '2026-09-01T10:00:00',
                'total_score': 4.0, 'total_score_percentage': 4.0,
                'category_scores_percentage': {}, 'recommendations': [], 'completed': True,
            },
            {   # 修复后：同一字段已是合法得分率，不应被二次换算
                'id': 'new_full', 'timestamp': '2026-09-02T10:00:00',
                'total_score': 3.5, 'total_score_percentage': 87.5,
                'category_scores_percentage': {}, 'recommendations': [], 'completed': True,
            },
        ]

        history = client.get('/api/assessment/history').get_json()
        by_id = {r['id']: r['total_score_percentage'] for r in history['history']}
        assert by_id['legacy_full'] == 100.0
        assert by_id['new_full'] == 87.5

        # 换算只发生在响应出口：底层存储保持原值，删除本次改动即可完全回滚
        stored = {r['id']: r['total_score_percentage']
                  for r in dev_db['users'][self.USER_ID]['assessments']}
        assert stored['legacy_full'] == 4.0
        assert stored['new_full'] == 87.5
