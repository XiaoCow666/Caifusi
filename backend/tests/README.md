# 后端回归测试

本目录存放 Python 后端的自动化回归测试，**仅使用标准库 `unittest`，零新增依赖**。

## 运行方法

在仓库根目录下：

```bash
cd backend
python -m unittest discover -s tests -t . -v
```

或直接运行单个文件：

```bash
cd backend
python -m unittest tests.test_zhipuai_service_pure -v
```

## 覆盖范围

| 模块 | 锁定的纯函数 | 说明 |
| --- | --- | --- |
| `app.services.zhipuai_service` | `filter_thinking_tags` | 过滤 `<think>...</think>`、压缩空行、保留 Markdown |
| `app.services.zhipuai_service` | `ZhipuAIService._get_category_name` | 财务分类代码 → 中文名，未知代码原样返回 |
| `app.services.zhipuai_service` | `ZhipuAIService._build_system_prompt` | 基础提示词、评估结果注入、畸形输入容错 |

## 本次行为修正（STAGE4-FIX-001）

`filter_thinking_tags` 旧实现用 `re.DOTALL` 但**区分大小写**，当模型输出 `<THINK>` / `<Think>` 等大写或混合大小写思考标签时，内部推理过程不会被过滤，会原样泄漏给用户。已在生产代码 `backend/app/services/zhipuai_service.py` 给正则加上 `re.IGNORECASE`。

回归用例 `test_strips_uppercase_and_mixedcase_think_blocks` 即「修正前失败、修正后通过」：

- 修正前：`'<THINK>推理过程</THINK>你好' != '你好'`（FAIL）
- 修正后：`Ran 13 tests ... OK`

小写 `<think>` 行为不变，且不会误伤普通单词 `thinking`（标签要求 `think` 后紧跟 `>`）。

## 约定

- **离线可跑**：测试不读取真实 `ZHIPUAI_API_KEY`，实例化走 `client=None` 分支，不发起任何网络请求、不连接数据库。
- **锁定现状语义**：测试不改动生产实现，只把当前行为固化为断言；若故意修改了行为，请同步更新对应断言。
- **新增纯函数**：后续可离线判定的后端逻辑，请优先在此目录补 `test_*.py`，保持「零依赖、可重复运行」。
