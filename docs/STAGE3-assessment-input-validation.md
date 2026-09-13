# STAGE3：assessment 路由输入校验修复与回归测试

> 对应阶段三「低风险修复落地与回归验证」。与 PR #12（coach `/chat` 输入校验）同类：
> 畸形请求未被业务校验拦截，未捕获异常被外层兜成 **500 HTML**，而非语义正确的 **400 JSON**。
> 变更文件：`backend/app/routes/assessment_routes.py`、新增 `backend/tests/test_assessment_routes.py`、本文件。

## 一、背景

PR #12 已把 `/api/coach/chat` 的 malformed 输入（空 body、顶层非对象、`message` 非字符串等）
从 500 收敛为 400，并以 `test_coach_routes.py` 锁定。本次按同一口径审计
`/api/assessment/*`，发现两个同型缺口，均在未改业务评分/存储逻辑的前提下修复。

前端真实链路（`src/pages/Assessment.js` `handleSaveResult`）发送：

```js
submitAssessmentNew({ answers, scores: {category: a.score}, categoryScores, ... })
// api.js 包装为 POST /api/assessment/submit  { assessment: {...} }
// 其中 scores 值来自答题选项 a.score，恒为数值
```

因此「要求 scores 值为数值」不会误伤正常客户端；`getAssessmentHistory()` 不传 `limit`，
走默认值，也不受影响。

## 二、变更范围

| 文件 | 变更 | 说明 |
|---|---|---|
| `backend/app/routes/assessment_routes.py` | 修复（+25/-1） | ① `/history?limit=` 安全解析；② `/submit` scores 结构与取值校验 |
| `backend/tests/test_assessment_routes.py` | 新增 | 13 条用例，锁定 400 契约与「不触达数据服务」回归锁 |
| `docs/STAGE3-assessment-input-validation.md` | 新增 | 本文件（证据与口径） |

未改动：前端任何文件、coach/dashboard/auth 路由、存储层（memory/MySQL/Firestore）、
数据库结构、鉴权策略、CORS、部署配置。

## 三、事实与证据

### 3.1 修复前（基线 main，生产式 `TESTING=False`）

用 Flask `test_client` 实跑，未捕获异常被默认处理器转成 HTML 500：

| # | 请求 | 修复前 | 根因 |
|---|---|---|---|
| A | `GET /api/assessment/history?limit=abc` | **500 HTML** | `int('abc')` → `ValueError`（get_history） |
| C | `POST /submit` `scores:{savings:"five"}` | **500 HTML** | `sum(["five"])` → `TypeError`（submit_assessment） |
| C2 | `POST /submit` `scores:{savings:3, x:null}` | **500 HTML** | `3 + None` → `TypeError` |
| D | `POST /submit` 空 body | 400 HTML | `get_json()` 空 body 抛 BadRequest（既有行为，见 §六） |
| E | 缺 `scores` 字段 | 400 JSON | 既有契约，本 PR 回归锁定 |
| F | 合法 scores | 200 JSON | 既有正常路径，本 PR 回归锁定 |

### 3.2 修复后（同一探针）

| # | 请求 | 修复后 |
|---|---|---|
| A | `?limit=abc` | **400** `{"error":"limit 参数必须为整数"}` |
| C | `scores` 字符串值 | **400** `{"error":"scores 必须全部为数值字段: savings"}` |
| C2 | `scores` 含 null | **400** `{"error":"scores 必须全部为数值字段: x"}` |
| B | `?limit=-5` | 200，负数收敛为 1（`max(1, min(limit,100))`） |
| B2 | `?limit=99999` | 200，上界仍收敛为 100（与旧实现一致） |
| F | 合法 scores | 200，`total_score=(3+4)/2=3.5` |

### 3.3 回归锁有效性（非恒真）

修复前先写测试、对**未改动的旧代码**跑：

```
7 failed, 6 passed
```

失败的 7 条恰好就是描述两个 bug 的用例（`limit` 非整数/浮点/负数收敛、`scores`
非对象/字符串/null/bool）。应用修复后同一批用例全绿，证明测试能真正抓住回归、
不是恒真断言。

## 四、修复内容

### 4.1 `/history?limit=` 安全解析

```python
limit_raw = request.args.get('limit', '50')
try:
    limit = int(limit_raw)
except (TypeError, ValueError):
    return jsonify({"error": "limit 参数必须为整数"}), 400
# 上界与旧实现一致收敛到 100；下界收敛到 1，避免负数透传到存储层
limit = max(1, min(limit, 100))
```

### 4.2 `/submit` scores 校验

```python
scores = assessment_data.get('scores', {})
if not isinstance(scores, dict):
    return jsonify({"error": "scores 必须为对象"}), 400

non_numeric = [
    key for key, value in scores.items()
    if isinstance(value, bool) or not isinstance(value, (int, float))  # bool 是 int 子类
]
if non_numeric:
    return jsonify({"error": f"scores 必须全部为数值字段: {', '.join(sorted(non_numeric))}"}), 400
```

## 五、验证命令与结果

环境：Windows、Python 3.14.7、Flask 3.1.3、pytest 9.1.1。

| 项 | 命令 | 结果 |
|---|---|---|
| 新增回归测试 | `cd backend && $env:DEV_MODE='true'; python -m pytest tests/test_assessment_routes.py -v` | 13 passed |
| 全量后端测试 | `cd backend && $env:DB_TYPE='memory'; $env:DEV_MODE='true'; python -m pytest tests/ -v` | **32 passed**（基线 19 + 新增 13），exit 0 |
| 旧代码回归锁 | 修复前对旧代码跑新测试 | 7 failed / 6 passed（见 3.3） |
| 语法编译 | `python -m compileall -q app` | exit 0 |
| 前端无回归 | 本 PR 未改 `src/`，前端测试/构建不涉及 | — |

测试不调用智谱、Firebase、MySQL：`DEV_MODE` 由 fixture 通过 `app.config` 注入以绕过
鉴权，`user_data_service` 以 `MagicMock` 替换，断言非法输入下 `save_user_data` /
`get_user_data` **未被调用**。

## 六、范围外残留（本 PR 未改，记录供后续）

1. **空 body 返回 HTML 400**（探针 D）：`request.get_json()` 对完全空 body 抛 BadRequest，
   走 Flask 默认处理器返回 HTML。它已经是 400（非 500），与 coach 路由返回 JSON 的口径
   不一致但不影响安全；统一为 JSON 属另一个小修，本 PR 不扩范围。
2. `/assessment/results`、`/latest`、dashboard/auth 路由的同类输入校验未审计——
   可作为下一轮候选，但不在本 PR。
3. 鉴权仍为开发态 mock（`DEV_MODE` 注入 `test_user_id`），这是已知架构边界，本 PR
   不触碰。

## 七、风险与回滚

- **风险等级：低。** 仅新增「拒绝畸形输入」分支；正常请求（探针 F）返回结构与数值
  不变。错误包络沿用 assessment 既有 `{"error": "..."}` 形态，不新增字段。
- **行为差异（需知悉）**：`?limit` 为负数时，旧行为是透传负数（返回空），新行为收敛为
  1；二者都不返回数据、不抛错，仅边界值不同。`limit=abc` 由 500 变为 400。
- **回滚**：`git revert <merge-commit>`；或文件级
  `git checkout <merge前> -- backend/app/routes/assessment_routes.py && rm backend/tests/test_assessment_routes.py`。

## 八、安全边界声明

本 PR 未涉及数据库结构、权限模型、认证/鉴权策略、CORS/安全响应头、生产部署架构或
对外接口的破坏性变更；未提交任何密钥。`DEV_MODE` 绕过鉴权为既有开发态行为，仅在测试
fixture 内开启，不改变运行时配置。
