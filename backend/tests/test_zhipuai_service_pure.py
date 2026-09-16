# -*- coding: utf-8 -*-
"""
后端纯函数回归测试（阶段四 · STAGE4-PURE-FN-001）
=================================================================
背景：本仓库此前后端（Python/Flask）无任何自动化测试，唯一的自动化回归
      是前端 src/services/api.test.js（jest）。本文件把后端 AI 教练服务里
      三个「无网络、无数据库、无外部副作用」的纯函数锁定为可重复执行的回归：

        · filter_thinking_tags(text)   —— 过滤 <think>...</think> 并压缩空行
        · ZhipuAIService._get_category_name(code) —— 分类代码 → 中文名
        · ZhipuAIService._build_system_prompt(assessment) —— 拼系统提示词

设计原则（与前端回归一致）：
  · 零新增依赖：仅用 Python 标准库 unittest，不引入 pytest；
  · 离线可跑：用 patch.dict 限定作用域置空密钥（自动恢复），实例化走
    client=None，不触发任何网络、不连数据库；
  · 一个真实修复（STAGE4-FIX-001）：filter_thinking_tags 旧实现区分大小写，
    模型输出 <THINK>/<Think> 时内部推理会泄漏给用户；已在生产代码加
    re.IGNORECASE，本文件 test_strips_uppercase... 即「修复前失败、修复后通过」的回归。
  · 其余用例锁定现状语义：不改动现有行为，只把当前输出固化为断言。

运行命令（仓库根目录）：
    cd backend
    python -m unittest discover -s tests -t . -v

验收：全部用例通过即代表这三个纯函数的行为未被后续改动破坏。
"""
import os
import sys
import unittest
from unittest.mock import patch

# 让本测试无论从哪个目录启动都能 import 到 app.services.*
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

# 注意：不在模块顶层永久改环境变量；改为在需要实例化服务的 TestCase 里
# 用 patch.dict 做「限定作用域、自动恢复」的密钥置空，避免依赖执行顺序。

from app.services.zhipuai_service import filter_thinking_tags, ZhipuAIService  # noqa: E402


class TestFilterThinkingTags(unittest.TestCase):
    """filter_thinking_tags：剥离思考标签、压缩空行，保留 Markdown。"""

    def test_strips_single_think_block(self):
        self.assertEqual(
            filter_thinking_tags("前<think>正在思考...</think>后"),
            "前后",
        )

    def test_strips_multiple_think_blocks(self):
        self.assertEqual(
            filter_thinking_tags("a<think>x</think>b<think>y</think>c"),
            "abc",
        )

    def test_strips_uppercase_and_mixedcase_think_blocks(self):
        # 回归（STAGE4-FIX-001）：模型偶尔输出大写/混合大小写的思考标签，
        # 旧实现区分大小写，会把内部推理原样泄漏给用户。修复后应一并剥离。
        self.assertEqual(
            filter_thinking_tags("<THINK>推理过程</THINK>你好"),
            "你好",
        )
        self.assertEqual(
            filter_thinking_tags("<Think>reasoning</Think>answer"),
            "answer",
        )
        # 不应误伤普通文本里的 "thinking" 字样（标签要求 think 后紧跟 >）
        self.assertIn("thinking", filter_thinking_tags("this is thinking text"))

    def test_dotall_matches_across_newlines(self):
        # <think> 块内部可以跨多行；块前后各留的换行被压缩为单个空行
        out = filter_thinking_tags("开始\n<think>行1\n行2\n</think>\n结束")
        self.assertEqual(out, "开始\n\n结束")

    def test_preserves_markdown_without_tags(self):
        md = "**粗体**\n- 项目一\n1. 有序项\n| 表 | 格 |"
        self.assertEqual(filter_thinking_tags(md), md)

    def test_collapses_three_or_more_blank_lines(self):
        # 剥离块后可能留下连续多个空行，应压缩为单个空行（两个换行）
        out = filter_thinking_tags("a<think>x</think>\n\n\n\nb")
        self.assertEqual(out, "a\n\nb")

    def test_strips_surrounding_whitespace(self):
        self.assertEqual(filter_thinking_tags("  hello<think>x</think>  "), "hello")


class TestCategoryName(unittest.TestCase):
    """_get_category_name：分类代码映射，未知代码原样返回。"""

    @classmethod
    def setUpClass(cls):
        # 限定作用域置空密钥（自动恢复），强制走 client=None 离线分支
        cls._patcher = patch.dict(os.environ, {"ZHIPUAI_API_KEY": ""})
        cls._patcher.start()
        cls.svc = ZhipuAIService()

    @classmethod
    def tearDownClass(cls):
        cls._patcher.stop()

    def test_known_categories(self):
        self.assertEqual(self.svc._get_category_name("savings"), "储蓄能力")
        self.assertEqual(self.svc._get_category_name("debt"), "债务管理")
        self.assertEqual(self.svc._get_category_name("pressure"), "应对能力")

    def test_unknown_code_passthrough(self):
        # 不在映射表里的代码不应被吞掉，原样返回便于排查
        self.assertEqual(self.svc._get_category_name("not_a_code"), "not_a_code")


class TestBuildSystemPrompt(unittest.TestCase):
    """_build_system_prompt：基础提示词 + 评估结果注入 + 畸形输入容错。"""

    @classmethod
    def setUpClass(cls):
        cls._patcher = patch.dict(os.environ, {"ZHIPUAI_API_KEY": ""})
        cls._patcher.start()
        cls.svc = ZhipuAIService()

    @classmethod
    def tearDownClass(cls):
        cls._patcher.stop()

    def test_no_results_returns_base_prompt(self):
        p = self.svc._build_system_prompt(None)
        self.assertIn("财赋思", p)
        self.assertNotIn("用户财务评估数据", p)

    def test_empty_dict_returns_base_prompt(self):
        # 空字典视为「无评估结果」
        p = self.svc._build_system_prompt({})
        self.assertNotIn("用户财务评估数据", p)

    def test_injects_assessment_results(self):
        assessment = {
            "score": 35,                 # 35/40 = 87.5% -> 88%
            "categoryScores": {"savings": 80, "debt": 20},  # 储蓄强 / 债务弱
            "resultMessage": {"title": "财务成长阶段"},
            "categoryAdvice": ["建预算", "增储蓄", "控支出", "多余建议"],
            "userName": "小明",
        }
        p = self.svc._build_system_prompt(assessment)
        self.assertIn("用户财务评估数据", p)
        self.assertIn("小明", p)
        self.assertIn("35/40", p)
        # 强项 >=70、弱项 <=40
        self.assertIn("储蓄能力", p)
        self.assertIn("债务管理", p)
        # 建议只取前 3 条：第 1/2/3 条保留，第 4 条被丢弃
        self.assertIn("建预算", p)
        self.assertIn("增储蓄", p)
        self.assertIn("控支出", p)
        self.assertNotIn("多余建议", p)

    def test_malformed_results_does_not_raise(self):
        # 畸形输入（字符串/数字）必须走既有容错分支：记录错误但返回基础提示词
        for bad in ("不是字典", 12345, ["列表"]):
            p = self.svc._build_system_prompt(bad)
            self.assertIn("财赋思", p)
            self.assertNotIn("用户财务评估数据", p)


if __name__ == "__main__":
    unittest.main(verbosity=2)
