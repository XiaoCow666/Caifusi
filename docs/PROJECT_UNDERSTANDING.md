# Caifusi 财赋思 — 项目理解文档

> 本文档基于公开仓库代码和实际运行验证整理，用于项目定位、模块结构、核心流程、运行结果、风险疑问和改进方向的梳理。

---

## 文档元信息

| 项 | 内容 |
|---|---|
| AI 工具 | 豆包（Doubao）— 用于代码阅读、结构梳理、运行验证和文档撰写 |
| 阅读范围 | `README.md`、`package.json`、`backend/app/__init__.py`、`backend/app/routes/coach_routes.py`、`backend/app/services/zhipuai_service.py`、`backend/requirements.txt`、`src/App.js`、`src/services/api.js`、`src/contexts/AuthContext.js`、项目目录结构 |
| 验证环境 | Ubuntu 22.04 / Python 3.12.11（主验证环境）；另在 Windows 10 / Python 3.14 上做过依赖兼容性验证 |
| 验证时间 | 2026-09-07 |
| 事实与推断边界 | **事实**：来自代码阅读和实际运行输出的内容；**推断**：基于代码结构推测的设计意图和潜在问题，已在文中标注。本文不包含任何 API 密钥、数据库凭据或用户隐私数据。 |

---

## 1. 项目定位

### 1.1 一句话定位

**Caifusi（财赋思）是一个面向个人财务学习与复盘的 AI 辅助 Web 应用。**

### 1.2 核心价值

通过问卷评估、AI 对话、数据看板和知识库四大模块，帮助用户：
- 了解自身风险偏好、消费习惯和财务状态
- 学习基础金融知识
- 通过 AI 教练讨论财务问题并整理行动方案
- 在 Dashboard 中追踪预算、目标和进展

### 1.3 使用边界

- 用于**金融教育和个人决策复盘**，不替代投资、税务或法律专业意见
- 当前版本 `v0.1.0`，适合本地体验、功能验证和产品迭代
- AI 教练功能需要单独配置后端服务和智谱 AI API 密钥

### 1.4 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| 前端 | React + React Router + Bootstrap + Tailwind | React 18 |
| 后端 | Flask + Flask-CORS + python-dotenv | Flask 3.x |
| AI | 智谱 AI GLM-4（主）、Google Gemini（可选） | zhipuai 2.1.5 |
| 数据 | 开发态内存 / 可配置 MySQL 或 Firebase | — |
| 部署 | GitHub Pages（静态前端）/ Flask API / Nginx+Gunicorn | — |

---

## 2. 目录与模块

### 2.1 顶层目录结构

```
Caifusi/
├── backend/                    # Flask 后端
│   ├── app/
│   │   ├── __init__.py        # 应用工厂，路由注册，CORS 配置
│   │   ├── config.py          # 配置类（DB_TYPE、密钥等）
│   │   ├── routes/            # 路由蓝图
│   │   │   ├── coach_routes.py       # AI 教练对话接口
│   │   │   ├── dashboard_routes.py   # 数据看板接口
│   │   │   ├── assessment_routes.py  # 财务评估接口
│   │   │   └── auth_routes.py        # 认证接口
│   │   ├── services/          # 业务服务
│   │   │   ├── zhipuai_service.py    # 智谱 AI 封装
│   │   │   ├── auth_service.py       # 认证服务
│   │   │   ├── coach_service.py      # 教练业务逻辑
│   │   │   ├── user_data_service.py  # 用户数据服务
│   │   │   ├── firestore_service.py  # Firebase 存储
│   │   │   └── ...
│   │   └── utils/
│   │       └── db_mysql.py    # MySQL 辅助类
│   ├── services/              # ⚠️ 重复的服务目录（备用导入路径）
│   ├── routes/                # ⚠️ 重复的路由目录
│   ├── run_dev_enhanced.py    # 主启动入口（开发模式增强版）
│   ├── run_dev.py             # 开发模式入口
│   ├── run_dev_fixed.py       # 修复版入口
│   ├── run.py                 # 生产入口
│   ├── requirements.txt       # Python 依赖（版本范围）
│   ├── requirements-fixed.txt  # Python 依赖（固定版本，较旧）
│   └── schema.sql             # 数据库表结构
├── src/                        # React 前端
│   ├── App.js                 # 路由配置、受保护路由、API 状态指示
│   ├── index.js               # 应用入口
│   ├── pages/                 # 页面组件
│   │   ├── Home.js            # 首页（落地页）
│   │   ├── Login.js           # 登录页
│   │   ├── Register.js        # 注册页
│   │   ├── Dashboard.js       # 数据看板
│   │   ├── Assessment.js      # 财务评估问卷
│   │   ├── CoachChat.js       # AI 教练对话
│   │   ├── NotFound.js        # 404 页
│   │   └── info/              # 信息页（团队、联系、知识库、FAQ等）
│   ├── components/            # 通用组件（Layout、导航、粒子背景等）
│   ├── contexts/
│   │   └── AuthContext.js     # 认证上下文（⚠️ 当前为 mock auth）
│   ├── services/
│   │   ├── api.js             # API 服务封装（axios + fetch）
│   │   └── firebase.js        # Firebase 初始化
│   ├── firebase.js            # Firebase 配置（重复）
│   └── setupProxy.js          # 开发代理配置（→ localhost:5001）
├── docs/                       # 项目文档
├── assets/                     # 品牌资源和预览图
├── public/                     # 静态资源
├── .env.example               # 环境变量模板
├── package.json               # 前端依赖和脚本
├── DEPLOYMENT_GUIDE.md        # 部署指南
├── SECURITY_SETUP.md          # 安全配置指南
└── README.md                  # 项目说明
```

### 2.2 后端模块说明

| 模块 | 文件 | 职责 | 关键接口 |
|---|---|---|---|
| 应用工厂 | `backend/app/__init__.py` | 创建 Flask 应用、配置 CORS、注册所有路由蓝图、健康检查 | `create_app()` |
| AI 教练 | `backend/app/routes/coach_routes.py` | 接收对话请求，调用智谱 AI 服务，返回回复 | `POST /api/coach/chat`、`GET /api/coach/health` |
| 数据看板 | `backend/app/routes/dashboard_routes.py` | 财务概览、健康度、目标管理、统计、建议 | `GET/POST/PUT/DELETE /api/dashboard/*` |
| 财务评估 | `backend/app/routes/assessment_routes.py` | 提交评估、获取结果、历史记录、最新评估 | `POST /api/assessment/submit`、`GET /api/assessment/*` |
| 智谱 AI 服务 | `backend/app/services/zhipuai_service.py` | 封装智谱 AI SDK，构建 prompt，调用 GLM-4，解析响应 | `ZhipuAIService.get_chat_response(data)` |

### 2.3 前端模块说明

| 模块 | 文件 | 职责 |
|---|---|---|
| 路由配置 | `src/App.js` | HashRouter 路由表、受保护路由（`ProtectedRoute`）、API 连接状态指示 |
| API 服务 | `src/services/api.js` | axios 实例、请求/响应拦截器、AI 教练对话、Dashboard、Assessment 等 API 封装 |
| 认证上下文 | `src/contexts/AuthContext.js` | 用户登录状态管理（⚠️ 当前为 mock 实现，数据存 localStorage） |
| AI 教练页 | `src/pages/CoachChat.js` | 对话界面、消息列表、输入框、调用 `sendMessageToCoach()` |
| 数据看板页 | `src/pages/Dashboard.js` | 财务健康度、预算、目标列表、进度展示 |
| 评估问卷页 | `src/pages/Assessment.js` | 多步问卷、提交评估、查看结果 |

---

## 3. 核心流程

### 3.1 AI 教练对话流程（已验证）

```
用户输入消息
    ↓
CoachChat.js 组件收集 { message, user_id, chat_history, assessment_result }
    ↓
调用 sendMessageToCoach(data) [src/services/api.js]
    ↓
POST http://localhost:5001/api/coach/chat（前端直接请求后端绝对地址）
    ↓
coach_routes.py → chat() 处理请求
    ↓
参数校验（message 必填）
    ↓
zhipuai_service.get_chat_response(data)
    ↓
构建系统 prompt（金融教练角色设定）+ 用户消息 + 历史上下文
    ↓
调用智谱 AI SDK → GLM-4 模型
    ↓
解析响应，提取 reply 文本
    ↓
返回 JSON { status: "success", reply: "..." }
    ↓
前端渲染 Markdown 格式的 AI 回复
```

**关键事实**：
- 后端启动日志显示 `✓ 使用智谱AI GLM-4模型`
- 实际对话测试中，AI 返回了包含 10 条理财策略、投资组合分配表格和风险提示的详细回复
- 响应时间约 3-8 秒（取决于网络和 API 负载）
- ⚠️ `src/setupProxy.js` 虽配置了 `/api` → `http://localhost:5001` 的开发代理，但 `api.js` 中实际使用绝对地址 `http://localhost:5001` 直接请求后端，**请求不经过前端开发服务器代理**；CORS 由后端 Flask-CORS 处理

### 3.2 用户认证流程（推断）

> ⚠️ 以下为基于代码结构的推断，`AuthContext.js` 为 mock 实现。

```
用户注册/登录
    ↓
AuthContext 处理（当前为本地 mock，不调用后端真实认证接口）
    ↓
用户信息和 token 存入 localStorage
    ↓
ProtectedRoute 检查 currentUser，未登录则重定向 /login
    ↓
API 请求拦截器自动添加 Authorization: Bearer <token>
```

**关键事实**：
- README 明确说明「`AuthContext` 使用 mock auth」
- `api.js` 中定义了 `registerUser()` 和 `loginUser()`，但实际是否调用后端 `auth_routes.py` 需进一步验证
- 受保护路由：`/dashboard`、`/assessment`、`/coach`

### 3.3 财务评估流程（推断）

```
用户在 Assessment 页填写多步问卷
    ↓
调用 submitAssessmentNew(assessmentData)
    ↓
POST /api/assessment/submit
    ↓
assessment_routes.py 处理，计算评估结果
    ↓
结果存入内存/MySQL（取决于 DB_TYPE 配置）
    ↓
前端可通过 /api/assessment/latest 和 /api/assessment/history 查询
```

### 3.4 Dashboard 数据流程（推断）

```
用户进入 Dashboard 页
    ↓
并行调用多个 API：
  - GET /api/dashboard/overview
  - GET /api/dashboard/financial-health
  - GET /api/dashboard/goals
  - GET /api/dashboard/recommendations
    ↓
dashboard_routes.py 返回数据（开发态为内存中的 mock 数据）
    ↓
前端渲染图表、进度条、目标列表
```

---

## 4. 运行 / 测试结果

### 4.1 环境要求与实际验证

| 项 | 文档要求 | 实际验证环境 | 结果 |
|---|---|---|---|
| Node.js | ≥ 18 | 20.x（Windows） | ✅ 通过 |
| Python | ≥ 3.8 | 3.12.11（Ubuntu，主验证）/ 3.14（Windows，依赖兼容验证） | ✅ 3.12 手动安装核心依赖成功；⚠️ 3.14 上完整 `pip install -r requirements.txt` 出现 `resolution-too-deep`（现象观察，根因待确认，见 §5.1.1） |
| 智谱 AI API Key | 必填 | 已配置（.env，未提交） | ✅ 正常调用，ZhipuAIService 初始化成功 |
| Gemini API Key | 可选 | 未配置 | ✅ 不影响主功能 |

### 4.2 启动命令与结果

#### 后端启动

**命令：**
```bash
python backend/run_dev_enhanced.py
```

**关键输出（事实）：**
```
=== 财赋思后端服务启动 (增强版) ===
✓ 系统路径设置成功
✓ 成功加载 .env 文件
✓ 环境变量设置完成
✓ 应用模块导入成功
配置CORS...
CORS 配置完成，允许的来源: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://xiaocow666.github.io']
✓ 成功注册真实的AI教练服务
✓ 成功注册Dashboard服务
✓ 成功注册Assessment服务
✓ 应用实例创建成功
✓ 开发模式已启用
✓ 使用智谱AI GLM-4模型
✓ API地址: http://localhost:5001
✓ AI模型初始化完成!
* Running on http://127.0.0.1:5001
```

**已注册路由（事实）：**
- `POST /api/coach/chat`
- `GET /api/coach/health`
- `GET /api/dashboard/overview`
- `GET /api/dashboard/financial-health`
- `GET/POST /api/dashboard/goals`
- `PUT/DELETE /api/dashboard/goals/<goal_id>`
- `GET /api/dashboard/statistics`
- `GET /api/dashboard/recommendations`
- `POST /api/assessment/submit`
- `GET /api/assessment/results`
- `GET /api/assessment/history`
- `GET /api/assessment/latest`
- `GET /api/health`

#### 前端启动

**命令：**
```bash
npm install
npm start
```

**关键输出（事实）：**
```
added 1731 packages in 35s
Compiled successfully!
```

- 前端地址：`http://localhost:3000`
- 浏览器自动打开，页面正常渲染（深色科技感主题 + 粒子网络动画背景）

### 4.3 功能验证结果

| 功能 | 验证方式 | 结果 |
|---|---|---|
| 首页渲染 | 浏览器访问 http://localhost:3000 | ✅ 正常显示财赋思落地页 |
| 注册/登录 | 点击注册按钮，填写信息 | ✅ 可注册并登录（mock auth） |
| AI 教练对话 | 登录后进入 /coach，发送消息 | ✅ 智谱 AI GLM-4 返回详细理财建议 |
| Dashboard 访问 | 登录后进入 /dashboard | ✅ 页面可访问（数据为开发态 mock） |
| 评估问卷 | 登录后进入 /assessment | ✅ 问卷页面可访问 |
| 后端健康检查 | `GET http://localhost:5001/api/health` | ✅ 返回 `{status: "healthy"}` |

#### Ubuntu 22.04 / Python 3.12.11 环境 API 实测（2026-09-07）

> ⚠️ **验证方式说明**：以下实测为**手动选择性安装核心依赖**后的运行结果，**不是**执行原始 `pip install -r backend/requirements.txt` 全量安装的结果。该实测验证了「核心依赖子集可运行」，但**不能证明原始安装流程已修复**，也不能替代 §6 中要求的干净环境全量验证。

**依赖安装方式（手动选择，非原始 requirements.txt — 不可复现）：** 当时手动选择性安装了部分核心依赖（包括 flask、flask-cors、zhipuai、sniffio、PyMySQL 等，列表不完整），跳过了 firebase-admin / gunicorn / google-generativeai，安装过程无报错。

> ⚠️ **可复现性声明**：该次手动安装的**精确命令、pip 版本、各包最终版本号均未留存记录**，且依赖列表使用"等"省略了实际安装的完整集合。因此以下 API 实测结果**仅为历史观察记录，不构成可复现的验证证据**，也无法据此判断 sniffio 缺失是来自原始依赖声明还是手动安装过程。如需可复现验证，请按 §6「验证方式」中的场景 A 在干净环境中重新执行。

**后端启动关键日志：**
```
✓ 成功加载 .env 文件
ZhipuAIService初始化成功，API密钥长度: 49
✓ 成功注册真实的AI教练服务
✓ 成功注册Dashboard服务
✓ 成功注册Assessment服务
✓ 使用智谱AI GLM-4模型
✓ AI模型初始化完成!
* Running on http://127.0.0.1:5001
```
> 注：启动时有 `firebase_admin could not be imported` 警告，属预期行为（未安装可选依赖），不影响核心功能。

**curl 实测结果：**
```bash
# 健康检查
$ curl -s http://localhost:5001/api/health
{"message":"API服务正常运行中","status":"healthy"}

# AI教练健康检查
$ curl -s http://localhost:5001/api/coach/health
{"message":"AI教练服务运行正常","status":"ok"}

# AI教练对话（复利概念）
$ curl -s -X POST http://localhost:5001/api/coach/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"用一句话说明什么是复利","user_id":"test_verify"}'
{"reply":"复利是指利息在计算时不仅包括本金产生的利息，还包括之前利息产生的利息，从而实现资金增值的加速效应。","status":"success"}
```

### 4.4 AI 教练实际响应示例（事实）

向 AI 教练发送理财规划请求后，返回内容包含：
1. 10 条理财策略（应急储备、预算管理、债务管理、投资分散、长期投资、定期复盘、保险保障、持续学习、避免冲动决策、咨询专业人士）
2. 投资组合分配示例表格（股票 50%、债券 30%、房地产 10%、其他 10%）
3. 风险提示（所有投资存在风险，包括本金损失可能性）

---

## 5. 风险与疑问

### 5.1 已确认风险（事实）

| # | 风险 | 严重程度 | 说明 | 证据 |
|---|---|---|---|---|
| R3 | **认证为 mock 实现** | 高 | `AuthContext.js` 使用本地 mock auth，用户数据存 localStorage，无真实后端认证，不可用于生产 | README 明确说明 |
| R4 | **数据持久化缺失** | 中 | 开发态数据主要在内存中，服务重启后数据丢失；MySQL/Firebase 需额外配置 | README 和代码结构 |
| R5 | **重复代码目录** | 低 | `backend/app/services/` 和 `backend/services/`、`backend/app/routes/` 和 `backend/routes/` 并存，代码维护混乱 | 目录结构观察 |
| R6 | **多个启动脚本并存** | 低 | `run.py`、`run_dev.py`、`run_dev_enhanced.py`、`run_dev_fixed.py` 四个启动入口，职责不清晰 | 目录结构观察 |
| R7 | **前端 API 地址硬编码占位符** | 低 | `src/services/api.js` 中 GitHub Pages 环境的 API 地址硬编码为 `'https://你的API服务器地址'` | 代码阅读 |
| R8 | **gunicorn 不支持 Windows 运行** | 低 | `requirements.txt` 包含 `gunicorn`，而 gunicorn 官方仅支持 Unix 类系统运行；**但"放入默认依赖会导致 Windows 上 pip install 失败"尚未有直接报错证据**，当前观察到的 Windows 安装故障为 `resolution-too-deep`，未指向 gunicorn | 运行限制：gunicorn 官方文档 + requirements.txt；安装失败：待验证 |

### 5.1.1 观察到的依赖故障现象（根因待确认）

> ⚠️ 以下为实际运行中观察到的报错现象，**根因尚未经隔离实验确认**。当前归因仅为基于现象的推测，不作为已证实结论。

| # | 观察到的现象 | 推测归因（待确认） | 验证环境与命令 | 缺失的验证 |
|---|---|---|---|---|
| R1 | 完整执行 `pip install -r backend/requirements.txt` 时出现 `error: resolution-too-deep`，pip 依赖解析失败 | 推测与 `firebase-admin>=6.5.0` 在 Python 3.14 上的依赖图有关，但**未通过单独安装 firebase-admin 复现**，不能排除其他依赖组合触发 | Windows 10 / Python 3.14 / pip 版本待补充；命令：`pip install -r backend/requirements.txt`；完整错误日志待补充 | 需在干净环境中单独安装 firebase-admin 验证是否复现；需确认 pip 版本及 `--resolution` 参数；需对比 Python 3.12 下完整安装是否成功 |
| R2 | 后端首次启动时出现 `ModuleNotFoundError: No module named 'sniffio'`，AI 服务初始化受影响 | 推测 `zhipuai` SDK 依赖 `sniffio` 但 `requirements.txt` 未显式声明；但**同一文档后文又称 SDK 已隐式安装 sniffio**，两种描述未区分，需确认报错发生时的依赖安装方式 | 报错环境与精确安装命令待补充；后端启动日志完整片段待补充 | 需确认报错时是否执行了完整 `pip install -r requirements.txt`；需验证 `pip show zhipuai` 的依赖列表是否包含 sniffio；需区分「全新安装后首次启动」与「手动补装部分依赖后启动」两种场景 |

### 5.2 待确认疑问（推断）

| # | 疑问 | 说明 | 需要进一步验证 |
|---|---|---|---|
| Q1 | 前端注册/登录是否真的调用后端 `auth_routes.py`？ | `api.js` 定义了 `registerUser()` 和 `loginUser()`，但 `AuthContext.js` 为 mock，需确认实际调用链 | 阅读 `AuthContext.js` 和 `Login.js` 完整代码 |
| Q2 | Dashboard 数据是真实计算还是纯 mock？ | `dashboard_routes.py` 返回的数据来源需确认 | 阅读 `dashboard_routes.py` 完整代码 |
| Q3 | 评估结果的计算逻辑是什么？ | `assessment_routes.py` 中评估算法需确认 | 阅读 `assessment_routes.py` 完整代码 |
| Q4 | MySQL 模式是否可直接使用？ | `schema.sql` 和 `db_mysql.py` 存在，但需确认完整性 | 阅读 `schema.sql` 和 `config.py` |
| Q5 | Firebase 集成的完整度如何？ | 前端和后端都有 Firebase 相关代码，但实际功能覆盖需确认 | 阅读 `firebase.js` 和 `firestore_service.py` |

---

## 6. 改进方向：后端依赖声明拆分（方案待验证）

### 改进项：拆分可选依赖，显式声明 sniffio，提升环境兼容性

**优先级：高 | 预估工作量：0.5-1 天 | 风险：待评估（原文档标注为"极低"，但尚未在干净环境完成全量验证，以下保证在验证完成前不成立）**

#### 问题描述

当前 `backend/requirements.txt` 存在以下待处理项：

1. **观察到的现象（根因待确认）**：在 Windows 10 / Python 3.14 上完整执行 `pip install -r backend/requirements.txt` 出现 `error: resolution-too-deep`。推测可能与 `firebase-admin>=6.5.0` 的依赖图有关，但未通过单独安装复现，不能排除其他依赖组合触发。
2. **观察到的现象（根因待确认）**：后端首次启动时出现 `ModuleNotFoundError: No module named 'sniffio'`。推测 `zhipuai` SDK 依赖 `sniffio` 但顶层 `requirements.txt` 未显式声明；但同一环境下 `zhipuai` 安装时是否已隐式拉取 `sniffio` 尚未验证，两种可能性未区分。
3. **已确认的设计问题（运行限制）**：`gunicorn` 官方仅支持 Unix 类系统运行，放入默认 `requirements.txt` 意味着 Windows 用户即使安装成功也无法在本地运行 gunicorn；**但"放入默认依赖会导致 Windows 上 pip install 直接失败"尚未有独立报错证据**，当前观察到的 Windows 安装故障为 `resolution-too-deep`，未指向 gunicorn。此外，`firebase-admin` 和 `google-generativeai` 属于可选功能依赖，不应阻塞核心功能安装。

#### 改进方案

**第一步：修改 `backend/requirements.txt`（核心依赖）**

将可选依赖从默认安装中移除，显式添加 `sniffio`：

```diff
  # Flask 框架及扩展
  flask>=3.0.0
  flask-cors>=4.0.0

  # 环境变量管理
  python-dotenv>=1.0.0

- # Firebase Admin SDK
- firebase-admin>=6.5.0
+ # Firebase Admin SDK → 见 requirements-firebase.txt（可选）

  # Google Generative AI (如果使用 Gemini)
- google-generativeai>=0.3.1
+ # Google Generative AI → 见 requirements-gemini.txt（可选）

  # HTTP 请求库
  requests>=2.31.0

- # WSGI 服务器
- gunicorn>=21.2.0
+ # WSGI 服务器 → 见 requirements-prod.txt（Unix 生产环境可选）

  # 智谱 AI SDK
  zhipuai>=2.1.5
+ # zhipuai SDK 运行时依赖（显式声明，避免隐式依赖缺失）
+ sniffio>=1.3.0

  # MySQL 数据库驱动及加密支持
  PyMySQL>=1.1.0
  cryptography>=41.0.0
```

**第二步：按功能拆分可选依赖文件（不再合并为单一 optional 文件）**

新增 `backend/requirements-firebase.txt`：
```txt
# 可选依赖 — Firebase 存储功能
# 仅当 DB_TYPE=firebase 或使用 firestore_service.py 时安装
firebase-admin>=6.5.0
```

新增 `backend/requirements-gemini.txt`：
```txt
# 可选依赖 — Google Gemini AI 模型
# 仅当配置 GEMINI_API_KEY 并使用 Gemini 时安装
google-generativeai>=0.3.1
```

新增 `backend/requirements-prod.txt`：
```txt
# 可选依赖 — Unix 生产环境 WSGI 服务器
# 仅在 Linux/macOS 生产部署时安装；Windows 不支持
gunicorn>=21.2.0
```

**第三步：各环境安装命令矩阵**

| 环境 | 用途 | 安装命令 |
|---|---|---|
| 本地开发（Windows/macOS/Linux） | 核心功能 + 智谱 AI | `pip install -r backend/requirements.txt` |
| 使用 Firebase 存储 | 核心 + Firebase | `pip install -r backend/requirements.txt -r backend/requirements-firebase.txt` |
| 使用 Gemini 模型 | 核心 + Gemini | `pip install -r backend/requirements.txt -r backend/requirements-gemini.txt` |
| 生产部署（Linux） | 核心 + WSGI 服务器 | `pip install -r backend/requirements.txt -r backend/requirements-prod.txt` |
| 生产部署 + Firebase（Linux） | 全量 | `pip install -r backend/requirements.txt -r backend/requirements-firebase.txt -r backend/requirements-prod.txt` |

> ⚠️ 注意：Windows 用户即使需要 Firebase，也只安装 `requirements-firebase.txt`，不会引入 `gunicorn`（因为 gunicorn 已独立到 `requirements-prod.txt`）。

**第四步：需要同步修改的部署入口与文档位置**

依赖拆分后，以下文件中引用 `requirements.txt` 或 `gunicorn` 的位置必须同步更新，否则生产部署会缺少 gunicorn：

| 文件 | 行号/位置 | 当前内容 | 需要修改为 |
|---|---|---|---|
| `README.md` | 第 95 行 | `pip install -r backend/requirements.txt` | 补充说明：核心依赖安装命令；生产环境需追加 `-r backend/requirements-prod.txt` |
| `DEPLOYMENT_GUIDE.md` | 第 37 行（Windows） | `pip install -r backend\requirements.txt` | 保持核心安装命令，补充可选依赖说明 |
| `DEPLOYMENT_GUIDE.md` | 第 46 行（Linux） | `pip install -r backend/requirements.txt` | 生产部署应改为 `pip install -r backend/requirements.txt -r backend/requirements-prod.txt` |
| `DEPLOYMENT_GUIDE.md` | 第 184-185 行 | `pip install --upgrade pip` + `pip install -r backend/requirements.txt` | 生产环境追加 prod 依赖 |
| `DEPLOYMENT_GUIDE.md` | 第 223 行 | `.venv/bin/gunicorn ...` | gunicorn 调用保持不变，但需确认 prod 依赖已安装 |
| `DEPLOYMENT_GUIDE.md` | 第 248 行（systemd） | `ExecStart=.../gunicorn ...` | 同上，systemd 服务定义保持不变 |
| `DEPLOYMENT_GUIDE.md` | 第 312 行 | `pip install -r backend/requirements.txt` | 根据部署场景追加对应可选依赖 |

#### 风险评估（待验证，原"低风险"保证暂撤回）

> ⚠️ 以下为原文档给出的"低风险"理由，**在完成干净环境全量验证前，不作为已确认结论**。

1. **只改依赖声明，不碰业务逻辑** — 所有 Python 代码文件不做任何修改（✅ 已确认：方案仅涉及 requirements 文件）
2. **核心功能不受影响** — ⚠️ 待验证：需在干净环境中仅安装核心依赖后，确认 AI 教练、Dashboard、Assessment 等接口均正常运行；当前 Ubuntu 实测为手动安装部分依赖，不能证明原始安装流程已修复
3. **可选依赖不删除** — 移到独立的功能文件，需要时仍可安装（✅ 方案设计层面成立）
4. **新增 `sniffio` 是补全缺失依赖** — ⚠️ 待验证：需确认 `zhipuai>=2.1.5` 的实际依赖树是否包含 `sniffio`；若 SDK 已隐式安装，则显式声明仅为规范加固，不改变行为；若 SDK 未声明，则此修改确实修复缺失
5. **可回滚** — 如果有问题，恢复原 `requirements.txt` 并删除新增的可选文件即可（✅ 已确认）

#### 验证方式（必须全部完成后才能宣称"低风险"）

> ⚠️ 以下验证分为两类：**修复后冒烟验证**（确认拆分方案本身可运行）和**根因验证**（确认原始依赖声明的问题归因）。两类验证目的不同，不可互相替代。

**【修复后冒烟验证】**

**场景 A：干净环境核心依赖安装 + 功能验证**
```bash
# 1. 新建虚拟环境（Python 3.12 和 3.14 各一次）
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. 仅安装修改后的核心依赖（应无报错）
pip install -r backend/requirements.txt

# 3. 冒烟验证：sniffio 可导入（因已显式声明，此步仅确认安装成功，不验证根因）
python -c "import sniffio; print('sniffio:', sniffio.__version__)"

# 4. 启动后端，确认 AI 服务初始化成功（无 ModuleNotFoundError）
python backend/run_dev_enhanced.py

# 5. 测试核心功能
curl -s http://localhost:5001/api/health
curl -s -X POST http://localhost:5001/api/coach/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"你好","user_id":"test"}'
```

**场景 B：Windows 环境验证可选依赖不再阻塞**
```bash
# Windows 10 / Python 3.14
pip install -r backend\requirements.txt
# 确认：默认依赖安装成功；firebase-admin 和 gunicorn 均不在默认依赖中
```

**场景 C：生产环境验证 gunicorn 可选安装**
```bash
# Linux 生产环境
pip install -r backend/requirements.txt -r backend/requirements-prod.txt
gunicorn --version  # 确认已安装
```

**场景 D：可选依赖独立安装验证**
```bash
# 验证 Firebase 可选文件不引入 gunicorn
pip install -r backend/requirements.txt -r backend/requirements-firebase.txt
pip list | grep -i gunicorn  # 应为空
```

**【根因验证 — 确认原始依赖声明为何缺失 sniffio】**

> ⚠️ 场景 A 中显式声明 sniffio 后可导入，**不能证明原始环境缺失 sniffio 的原因**。以下根因验证必须在**未修改的原始 `requirements.txt`** 上执行。

**场景 E：原始依赖声明的 sniffio 传递依赖验证**
```bash
# 1. 新建干净虚拟环境（与原始报错环境一致的 Python/pip 版本）
python -m venv venv-original
source venv-original/bin/activate

# 2. 安装原始（未修改的）requirements.txt，记录完整输出
pip install -r backend/requirements.txt 2>&1 | tee install_log.txt

# 3. 记录实际安装的 zhipuai 版本及完整传递依赖树
pip show zhipuai
pip install pipdeptree
pipdeptree -p zhipuai  # 查看 zhipuai 的完整传递依赖，确认 sniffio 是否在其中

# 4. 检查 sniffio 是否实际被安装（可能由其他间接依赖引入）
pip show sniffio
python -c "import sniffio; print('sniffio available')" 2>&1

# 5. 若 sniffio 未安装，确认是哪个环节缺失：
#    - zhipuai 的 Requires 字段是否声明 sniffio？
#    - 若 zhipuai 未声明，是否有其他包传递引入了 sniffio？
#    - 若都没有，则确认原始 requirements.txt 确实缺少 sniffio 声明
```

**根因验证需记录的信息：**
- Python 版本、pip 版本
- 原始 `requirements.txt` 安装的完整包列表及版本（`pip freeze`）
- `pipdeptree -p zhipuai` 的完整输出
- `pip show sniffio` 的结果（已安装/未安装）
- 若已安装，是哪个包作为直接/间接依赖引入的
- 若未安装，确认 `zhipuai>=2.1.5` 的 `Requires` 字段是否包含 sniffio

#### 预期收益（待验证后确认）

- 新用户按照 README 执行 `pip install -r backend/requirements.txt` 不再因可选依赖报错（需场景 A/B 验证）
- 首次启动不再出现 `sniffio` 缺失导致的 AI 服务初始化问题（需场景 A 验证）
- Windows 用户不再被 `gunicorn` 安装问题阻塞（需场景 B 验证）
- 可选依赖可按功能独立安装，不会因安装 Firebase 而引入 gunicorn（需场景 D 验证）

---

## 7. 总结

Caifusi 财赋思是一个结构清晰的 React + Flask AI 金融教育应用，核心功能（AI 教练对话）已验证可正常运行。项目当前处于 `v0.1.0` 早期阶段，认证和数据持久化仍为开发态 mock，依赖管理存在一些兼容性问题。

**最优先的改进方向**是拆分 `requirements.txt` 的可选依赖（将 `firebase-admin`、`google-generativeai`、`gunicorn` 按功能独立为可选文件，并显式声明 `sniffio`）。该方案设计上能显著提升新用户的上手体验，但**风险等级和实际收益需在完成 §6 所列的干净环境全量验证后才能确认**，当前不宜宣称"风险极低"。

---

*本文档由 AI 辅助整理，所有事实性内容均来自代码阅读和实际运行验证，推断性内容已明确标注。不包含任何密钥、凭据或用户隐私数据。*
