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

### 问题
`filter_thinking_tags`（`backend/app/services/zhipuai_service.py`）旧实现：

```python
re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
```

只加了 `re.DOTALL`，**区分大小写**。当模型输出 `<THINK>` / `<Think>` 等大写或混合大小写思考标签时，标签不被剥离，内部推理过程会原样泄漏给用户——这正是该函数的唯一职责。

### 复现（输入 → 实际 / 预期输出）
- 输入：`"<THINK>推理过程</THINK>你好"`
- 旧实现实际输出：`"<THINK>推理过程</THINK>你好"`（标签未剥离，泄漏）
- 预期输出：`"你好"`
- 对应失败用例：`test_strips_uppercase_and_mixedcase_think_blocks`

### 修改位置
`backend/app/services/zhipuai_service.py` 第 14 行，flags 增加 `re.IGNORECASE`：

```python
re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL | re.IGNORECASE)
```

小写 `<think>` 行为完全不变；且模式要求 `think` 后紧跟 `>`，不会误伤 `thinking` 等普通单词（有用例断言保护）。

### 验证命令与真实输出记录
环境：仓库 `.venv`，Python 3.10.1，Windows。

1. 回归用例（修复后）：
   ```
   python -m unittest tests.test_zhipuai_service_pure.TestFilterThinkingTags.test_strips_uppercase_and_mixedcase_think_blocks -v
   ```
   → `Ran 1 test ... OK`

2. 同一用例在**临时回退旧正则**时：
   ```
   AssertionError: '<THINK>推理过程</THINK>你好' != '你好'
   Ran 1 test ... FAILED (failures=1)
   ```
   （跑完后已恢复 `re.IGNORECASE`。）

3. 全量：
   ```
   python -m unittest discover -s tests -t . -v
   ```
   → `Ran 13 tests ... OK`（修复前为 `FAILED (failures=1)`）。

### 两个 flag 各解决什么
- `re.DOTALL`：让 `.` 匹配换行，使 `<think>...</think>` 块内部跨行也能整体被删掉。
- `re.IGNORECASE`：让标签匹配不区分大小写，兼容 `<THINK>`/`<Think>` 等模型变体，堵住推理泄漏。

### 当前用例覆盖的边界
单行/多行 think 块、多个 think 块、大小写变体、无标签 Markdown 原样保留、块删除后连续空行压缩为单空行、首尾空白被 strip、普通单词 `thinking` 不误伤。

## 约定

- **离线可跑**：测试用 `patch.dict` 限定作用域置空 `ZHIPUAI_API_KEY`（自动恢复），实例化走 `client=None` 分支，不发起网络请求、不连接数据库。
- **其余用例锁定既有行为**：除本次 STAGE4-FIX-001 外，测试不改动生产实现，只把当前行为固化为断言；若故意修改了行为，请同步更新对应断言。
- **新增纯函数**：后续可离线判定的后端逻辑，请优先在此目录补 `test_*.py`，保持「零依赖、可重复运行」。
