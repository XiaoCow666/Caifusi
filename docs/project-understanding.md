# Caifusi（财赋思）项目理解文档

> 阶段一：项目接管前基础理解与问题发现
> 撰写人：侯森宝（H1686hou）
> 日期：2026-09-07
> 仓库：https://github.com/XiaoCow666/Caifusi
> 版本：v0.1.0（main 分支）

---

## 1. 项目概述

### 1.1 项目定位

Caifusi（财赋思）是一款面向**个人财务学习与心智成长**的 AI 辅助 Web 应用。它不是传统的记账软件或投资工具，而是聚焦于"金融心智"——通过问卷评估用户的财务认知水平，结合 AI 教练提供个性化的财务教育与行为引导。

核心价值主张：**帮助用户建立健康的金钱观念和财务习惯**，而非直接管理资金或给出投资建议。

### 1.2 主要用户

- **个人理财初学者**：缺乏系统财务知识，希望从零建立理财认知的年轻人
- **有财务困惑的普通用户**：面临储蓄不足、债务压力、消费失控等问题，需要引导而非说教
- **自我提升导向者**：愿意通过问卷评估、AI 对话、目标追踪等方式持续改善财务行为的用户

### 1.3 核心问题

项目试图解决的核心问题是：**大多数人缺乏健康的"金融心智"，而传统理财教育要么过于专业晦涩，要么只给产品推荐不解决认知根源。**

Caifusi 的解法是：
1. 用结构化问卷量化用户的财务心智水平（10 个维度）
2. 用 AI 大模型基于评估结果提供个性化、有同理心的教练式对话
3. 用 Dashboard 追踪目标进度和财务健康度变化
4. 用知识库提供体系化的金融知识学习

---

## 2. 技术栈

| 层级 | 技术 | 版本/说明 |
|------|------|-----------|
| 前端框架 | React | 18.2.0 |
| 前端构建 | react-scripts | 5.0.1（CRA） |
| 路由 | react-router-dom | 6.28.0 |
| UI 框架 | Bootstrap | 5.3.3 |
| CSS 工具 | Tailwind CSS | 3.4.17 |
| HTTP 客户端 | axios | 1.7.9 |
| 后端框架 | Flask | 3.x（实际安装 3.1.3） |
| 后端 CORS | flask-cors | 4.x（实际安装 6.0.5） |
| AI 模型 | 智谱 GLM-4（glm-4-flash） | zhipuai SDK 2.1.5 |
| 可选 AI | Google Gemini | google-generativeai |
| 数据库（开发） | 内存 / localStorage | DB_TYPE=memory |
| 数据库（生产可选） | MySQL / Firebase Firestore | 需额外配置 |
| 认证（开发） | Mock Auth（前端本地） | 无真实后端认证 |
| 认证（生产可选） | Firebase Auth | firebase-admin |
| 包管理（前端） | npm | Node.js 18+ |
| 包管理（后端） | pip | Python 3.8+ |

---

## 3. 目录结构与模块职责

```
Caifusi/
├── backend/                          # 后端 Flask 应用
│   ├── app/                          # 应用工厂与核心模块
│   │   ├── __init__.py               # 应用工厂：创建 Flask 实例、配置 CORS、注册蓝图
│   │   ├── config.py                 # 配置类：SECRET_KEY、AI Key、DB_TYPE、MySQL 配置
│   │   ├── routes/                   # API 路由蓝图
│   │   │   ├── coach_routes.py       # AI 教练：/chat、/health、/models、/switch_model
│   │   │   ├── dashboard_routes.py   # 仪表盘：/overview、/financial-health、/goals、/statistics、/recommendations
│   │   │   ├── assessment_routes.py  # 评估问卷：/submit、/results、/history、/latest
│   │   │   └── auth_routes.py        # 认证路由（文件存在，但未在应用工厂注册！）
│   │   ├── services/                 # 业务服务层
│   │   │   ├── zhipuai_service.py    # 智谱 AI 服务：对话、系统提示词构建、历史记忆
│   │   │   ├── auth_service.py       # 认证服务：Firebase token 验证
│   │   │   ├── coach_service.py      # 教练业务逻辑
│   │   │   ├── user_profile_service.py  # 用户画像构建
│   │   │   ├── user_data_service.py  # 用户数据管理（强依赖 pymysql）
│   │   │   ├── firestore_service.py  # Firebase Firestore 数据服务
│   │   │   └── config.py             # 服务层配置
│   │   └── utils/
│   │       └── db_mysql.py           # MySQL 工具类（即使 memory 模式也会被导入）
│   ├── routes/                        # 备用路由目录（历史遗留，与 app/routes 重复）
│   │   └── coach_routes.py
│   ├── services/                      # 备用服务目录（历史遗留）
│   │   └── zhipuai_service.py
│   ├── run.py                         # 生产启动脚本
│   ├── run_dev.py                     # 开发启动脚本
│   ├── run_dev_enhanced.py            # 增强版开发启动脚本（README 推荐）
│   ├── run_dev_fixed.py               # 修复版开发启动脚本
│   ├── requirements.txt               # Python 依赖
│   ├── requirements-fixed.txt         # 固定版本依赖
│   └── schema.sql                     # MySQL 数据库建表脚本
├── src/                              # 前端 React 源码
│   ├── App.js                         # 根组件：路由配置、受保护路由、API 状态指示
│   ├── index.js                       # 入口文件
│   ├── firebase.js                    # Firebase 初始化配置
│   ├── setupProxy.js                  # 开发代理：/api → http://localhost:5001
│   ├── contexts/
│   │   └── AuthContext.js             # 认证上下文（完全 Mock：登录/注册生成本地随机用户）
│   ├── pages/
│   │   ├── Home.js                    # 首页：产品介绍、功能导航
│   │   ├── Login.js                   # 登录页（调用 Mock Auth）
│   │   ├── Register.js                # 注册页（调用 Mock Auth）
│   │   ├── Dashboard.js               # 仪表盘页（受保护路由）
│   │   ├── Assessment.js              # 金融心智评估问卷页（受保护路由）
│   │   ├── CoachChat.js               # AI 教练对话页（受保护路由）
│   │   ├── NotFound.js                # 404 页面
│   │   └── info/                      # 信息页面（7 个）
│   │       ├── TeamPage.js            # 团队介绍
│   │       ├── ContactPage.js         # 联系我们
│   │       ├── HistoryPage.js         # 项目历史
│   │       ├── KnowledgePage.js       # 金融知识库
│   │       ├── FAQPage.js             # 常见问题
│   │       ├── TutorialPage.js        # 使用教程
│   │       └── LegalPage.js           # 法律声明
│   ├── components/
│   │   ├── Layout.js                  # 布局组件：导航栏、页脚、内容区
│   │   ├── MobileNavBar.js            # 移动端底部导航栏
│   │   └── ParticleBackground.js      # 粒子背景动画
│   ├── services/
│   │   ├── api.js                     # API 服务：axios 实例 + fetch 封装（两种方式并存）
│   │   └── firebase.js                # Firebase 前端服务
│   └── utils/                         # 前端工具函数
├── public/                           # 静态资源
├── docs/                             # 项目文档（本文件所在目录）
├── scripts/                          # 启动/运维脚本（4 个版本并存，疑似历史遗留）
├── scripts_backup/                   # 脚本备份
├── scripts_new/                      # 新版脚本
├── scripts_old/                      # 旧版脚本
├── *.cmd                             # 大量一键启动脚本（one_click_start、fast_start、local_start 等）
├── package.json                       # 前端依赖与脚本
├── .env.example                       # 环境变量模板
└── README.md                          # 项目说明文档
```

### 关键模块职责说明

**后端应用工厂（`backend/app/__init__.py`）**：
- 创建 Flask 实例，配置 CORS（允许 localhost:3000、127.0.0.1:3000、GitHub Pages）
- 从 `config.py` 加载配置，支持 memory/mysql/firestore 三种数据库模式
- 注册 3 个蓝图：coach（/api/coach）、dashboard（/api/dashboard）、assessment（/api/assessment）
- **注意：auth_routes 蓝图未被注册**，尽管文件存在
- 提供 /api/health 健康检查和 / 根路由

**智谱 AI 服务（`backend/app/services/zhipuai_service.py`）**：
- 使用 `glm-4-flash` 模型（免费模型）
- 维护基于 user_id 的对话历史字典（内存态，最多 10 轮）
- 构建系统提示词：基础角色设定 + 用户评估结果（得分、强项、弱项、建议）
- 过滤 AI 回复中的 `<think>` 标签
- 支持延迟初始化（首次调用时检查 API Key）

**Dashboard 路由（`backend/app/routes/dashboard_routes.py`）**：
- 所有端点都有 `@authenticate` 装饰器
- 认证逻辑：检查 `DEV_MODE` 配置，若为 True 则直接使用测试用户；否则验证 Firebase ID Token
- 提供概览、财务健康度、目标 CRUD、统计数据、个性化建议等端点

**前端认证上下文（`src/contexts/AuthContext.js`）**：
- **完全是 Mock 实现**：login/signup 生成随机 uid，存储到 localStorage
- 不调用后端任何 auth API
- logout 清除 localStorage
- 受保护路由通过 `currentUser` 是否存在判断

---

## 4. 核心运行流程与数据流

### 4.1 应用启动流程

```
用户执行 npm start（前端）+ python backend/run_dev_enhanced.py（后端）
│
├─ 后端启动
│   ├─ 加载 .env 环境变量（ZHIPUAI_API_KEY、SECRET_KEY、DB_TYPE）
│   ├─ 创建 Flask 应用实例
│   ├─ 配置 CORS 白名单
│   ├─ 加载 Config 配置类
│   ├─ 注册 coach 蓝图 → 初始化 ZhipuAIService（需 ZHIPUAI_API_KEY）
│   ├─ 注册 dashboard 蓝图 → 导入 user_profile_service → user_data_service → db_mysql（需 pymysql）
│   ├─ 注册 assessment 蓝图
│   ├─ （auth 蓝图未注册）
│   └─ 启动 Flask 开发服务器（0.0.0.0:5001）
│
└─ 前端启动
    ├─ React 应用挂载（HashRouter 模式）
    ├─ AuthProvider 检查 localStorage 中的 dev_current_user
    ├─ 渲染路由（公共页面 + 受保护页面）
    └─ setupProxy 将 /api 请求代理到 http://localhost:5001
```

### 4.2 用户使用核心流程

```
用户访问首页 → 点击"开始评估"或"注册"
│
├─ 注册/登录（Mock Auth）
│   ├─ 前端生成随机用户对象 {uid, email, displayName}
│   ├─ 存储到 localStorage（dev_current_user、dev_user_profile）
│   └─ 设置 currentUser 状态 → 解锁受保护路由
│
├─ 金融心智评估（/assessment）
│   ├─ 用户回答 10 个维度的问卷题目
│   ├─ 前端计算得分（savings、risk、emergency、debt、knowledge、income、goals、tracking、insurance、pressure）
│   ├─ 调用 POST /api/assessment/submit 提交结果
│   ├─ 后端存储到内存/数据库
│   └─ 展示评估结果：财务状况等级、各维度得分、改进建议
│
├─ AI 教练对话（/coach）
│   ├─ 用户输入消息
│   ├─ 前端组装 {message, user_id, chat_history, assessment_results}
│   ├─ 调用 POST /api/coach/chat
│   ├─ 后端 ZhipuAIService：
│   │   ├─ 构建系统提示词（基础角色 + 用户评估数据）
│   │   ├─ 组装消息列表（system + 历史 + 当前消息）
│   │   ├─ 调用智谱 glm-4-flash API
│   │   ├─ 过滤 <think> 标签
│   │   └─ 更新对话历史（内存字典）
│   └─ 前端展示 AI 回复（Markdown 渲染）
│
└─ Dashboard（/dashboard）
    ├─ 调用 GET /api/dashboard/overview（需认证）
    ├─ 后端构建用户画像（财务健康度、评估摘要、目标进度、建议）
    ├─ 展示：财务健康评分、活跃目标数、评估历史、风险画像、个性化建议
    └─ 支持目标的创建、更新、删除（/api/dashboard/goals）
```

### 4.3 关键数据流

**评估结果 → AI 教练个性化**：
```
Assessment.js 计算评估结果 → 存储到 localStorage/状态
    ↓
CoachChat.js 发送消息时携带 assessment_results
    ↓
zhipuai_service._build_system_prompt() 解析评估结果
    ↓
注入到 system prompt：用户姓名、财务状况、得分、强项/弱项、建议重点
    ↓
AI 基于用户画像给出个性化回复
```

**前端 Mock Auth → 后端认证缺口**：
```
前端 AuthContext 生成随机 uid → 存储 localStorage
    ↓
前端调用 Dashboard API 时不携带有效 JWT（或携带 mock token）
    ↓
后端 dashboard_routes.authenticate 装饰器检查 DEV_MODE
    ↓
若 DEV_MODE=False → 返回 401 "需要授权令牌"
若 DEV_MODE=True → 注入测试用户 {uid: 'test_user_id'}
    ↓
当前 config.py 未设置 DEV_MODE → Dashboard API 返回 401
```

---

## 5. 本地安装与运行验证

### 5.1 环境准备

- **操作系统**：Windows 11
- **Python**：3.10.1（系统自带，创建独立虚拟环境）
- **Node.js**：已安装（npm 可用）
- **网络**：需访问 PyPI、npm registry、智谱 AI API

### 5.2 后端安装与运行

**步骤 1：创建虚拟环境**
```bash
cd C:\Users\16564\Desktop\Caifusi
py -3.10 -m venv .venv
```

**步骤 2：安装核心依赖**
```bash
.venv\Scripts\python.exe -m pip install flask flask-cors python-dotenv requests zhipuai
```

**步骤 3：安装缺失的传递依赖（重要！）**
```bash
.venv\Scripts\python.exe -m pip install sniffio pymysql cryptography
```
> `sniffio` 是 zhipuai SDK 的传递依赖但未自动安装；`pymysql` 是 user_data_service 的硬依赖（即使 memory 模式也会导入）。

**步骤 4：配置 .env**
```bash
copy .env.example .env
# 编辑 .env：设置 SECRET_KEY（随机字符串），ZHIPUAI_API_KEY 可暂用占位符
```

**步骤 5：启动后端**
```bash
.venv\Scripts\python.exe backend/run_dev_enhanced.py
```

**运行结果**：
- 服务启动在 `http://0.0.0.0:5001`
- Debug 模式开启
- 成功注册 15 个 API 端点（coach 2 + dashboard 7 + assessment 4 + health + 根路由）
- ZhipuAIService 初始化成功（使用占位符 API Key，实际聊天会失败）

### 5.3 后端 API 测试结果

| 端点 | 方法 | 结果 | 状态码 | 说明 |
|------|------|------|--------|------|
| `/api/health` | GET | `{"status":"healthy"}` | 200 | 正常 |
| `/` | GET | 欢迎信息 | 200 | 正常 |
| `/api/coach/health` | GET | `{"status":"ok"}` | 200 | 服务初始化成功 |
| `/api/coach/chat` | POST | 未测试（无有效 API Key） | - | 预计返回 API 调用错误 |
| `/api/dashboard/overview` | GET | `{"error":"需要授权令牌"}` | 401 | 认证未通过（DEV_MODE 未启用） |
| `/api/dashboard/financial-health` | GET | 未测试 | - | 同样需要认证 |
| `/api/assessment/latest` | GET | `{"assessment":null}` | 200 | 正常，无数据 |
| `/api/assessment/submit` | POST | 未测试 | - | 需提交问卷数据 |
| `/api/auth/login` | POST | 404 Not Found | 404 | **auth 路由未注册** |

### 5.4 前端安装与构建

**步骤 1：安装依赖**
```bash
cd C:\Users\16564\Desktop\Caifusi
npm install
```
> 耗时较长（React 项目依赖较多），需耐心等待。

**步骤 2：生产构建验证**
```bash
npm run build
```

**构建结果**：
- 成功生成 `build/` 目录
- 包含 `static/css/main.xxx.css`（43.29 kB）和 JS bundle
- exit code 0，无编译错误
- 说明前端代码语法正确、依赖完整

### 5.5 验证中发现的问题

1. **zhipuai SDK 缺少 sniffio 依赖**：`pip install zhipuai` 不会自动安装 sniffio，导致 `import zhipuai` 时 `ModuleNotFoundError: No module named 'sniffio'`。需手动安装。
2. **Dashboard 路由强依赖 pymysql**：即使 `DB_TYPE=memory`，`user_data_service.py` 在模块导入时就 `import pymysql`，导致未安装 pymysql 时整个 dashboard 蓝图注册失败。
3. **auth 路由未注册**：`backend/app/routes/auth_routes.py` 文件存在，但 `app/__init__.py` 的 `create_app()` 中没有导入和注册 auth 蓝图。
4. **DEV_MODE 未配置**：`config.py` 中没有 `DEV_MODE` 配置项，导致 Dashboard 的认证装饰器走 Firebase token 验证路径，而前端使用 Mock Auth 不携带有效 token，所有 Dashboard API 返回 401。
5. **重复的目录结构**：`backend/app/routes/` 与 `backend/routes/`、`backend/app/services/` 与 `backend/services/` 内容重复，应用工厂有复杂的备用导入逻辑。
6. **多个启动脚本**：`run.py`、`run_dev.py`、`run_dev_enhanced.py`、`run_dev_fixed.py` 四个启动脚本并存，职责不清。

---

## 6. 风险与疑问

### 6.1 安全风险

| 风险 | 严重程度 | 说明 |
|------|----------|------|
| Mock Auth 无真实认证 | 高 | 前端登录/注册完全是本地随机生成，无密码验证、无 JWT、无会话管理。任何用户输入任意邮箱密码即可"登录" |
| SECRET_KEY 硬编码默认值 | 中 | `config.py` 中默认 `SECRET_KEY='caifusi-dev-secret-key-change-in-production'`，若生产环境未覆盖则存在安全隐患 |
| CORS 配置较宽 | 低 | 允许 localhost:3000、127.0.0.1:3000、GitHub Pages，开发环境可接受，生产需收紧 |
| API Key 明文存储 | 中 | `.env` 文件存储智谱 API Key，需确保不提交到版本库（.gitignore 已包含 .env） |
| 无输入校验 | 中 | coach/chat 接口仅检查 message 是否存在，无长度限制、无内容过滤，可能被滥用 |

### 6.2 架构风险

| 风险 | 严重程度 | 说明 |
|------|----------|------|
| 内存数据无持久化 | 高 | 开发模式下对话历史、评估结果、用户数据都存在内存中，服务重启即丢失。生产需接 MySQL/Firebase |
| 对话历史无隔离 | 中 | `zhipuai_service.chat_history` 是全局字典，按 user_id 隔离，但 user_id 来自前端可伪造 |
| 单文件服务无分层 | 中 | 业务逻辑集中在 service 层，但路由层直接调用 service，无 DTO/校验层，可维护性一般 |
| 前端 API 调用不一致 | 低 | `api.js` 中同时存在 axios 实例和原生 fetch 两种调用方式，部分函数用 axios、部分用 fetch |
| 无自动化测试 | 高 | 后端和前端均未发现测试目录或测试脚本，无法保证代码质量和回归安全 |
| 依赖版本不固定 | 中 | `requirements.txt` 使用 `>=` 版本范围，可能导致不同环境安装不同版本出现兼容性问题 |

### 6.3 工程化风险

| 风险 | 严重程度 | 说明 |
|------|----------|------|
| 脚本目录混乱 | 中 | `scripts/`、`scripts_backup/`、`scripts_new/`、`scripts_old/` 四个目录 + 大量 `.cmd` 启动脚本，疑似历史迭代遗留，新接手者难以判断哪个是正确的 |
| 重复代码目录 | 中 | `backend/app/routes/` 与 `backend/routes/` 重复，`backend/app/services/` 与 `backend/services/` 重复，增加维护成本 |
| 无 CI/CD | 中 | 未发现 GitHub Actions 或其他 CI 配置，代码合并无自动化检查 |
| 无代码规范 | 低 | 未发现 ESLint、Prettier、Black 等代码规范配置 |
| 内网穿透工具混入仓库 | 低 | `cpolar_proxy.js`、`ngrok.zip`、`setup_cpolar.cmd` 等开发工具在仓库根目录，不应提交 |

### 6.4 待确认疑问

1. **生产环境认证方案**：当前前端 Mock Auth + 后端 Firebase token 验证的组合是否为最终方案？还是计划接入完整的后端 auth 系统？
2. **数据库选型**：README 提到支持 MySQL 和 Firebase Firestore，生产环境计划用哪个？`schema.sql` 是否为最新版本？
3. **智谱 API Key 有效性**：当前 `.env` 中使用占位符 Key，实际 AI 教练对话功能是否已在其他环境验证可用？
4. **auth_routes.py 的定位**：该文件已编写但未注册，是计划中的功能还是已废弃的代码？
5. **DEV_MODE 的预期行为**：已明确——DEV_MODE 必须默认关闭（`os.environ.get('DEV_MODE', 'false')`），只有本地开发时显式设置 `DEV_MODE=true` 才启用认证绕过；未设置时 Dashboard 和修改接口必须拒绝未认证请求。待确认的是项目维护者是否同意此安全边界作为最终方案。
6. **群内资料**：任务说明提到"基于公开仓库和群内可见资料"，是否有额外的设计文档、需求文档或会议记录需要参考？
7. **v0.1.0 之后的计划**：当前版本为 v0.1.0，后续迭代的优先级和路线图是什么？

---

## 7. 1-2 天改进方向（含安全边界项）

### 改进一：修复后端启动依赖问题，确保开箱即用（预计 0.5 天）

**问题**：按照 README 的 `pip install -r backend/requirements.txt` 安装后，后端无法正常启动，因为：
- zhipuai SDK 缺少 sniffio 传递依赖
- dashboard 路由强依赖 pymysql（即使 memory 模式）

**改进内容**：
1. 在 `requirements.txt` 中显式添加 `sniffio`（或升级 zhipuai SDK 到已修复的版本）
2. 修改 `backend/app/utils/db_mysql.py`，将 `import pymysql` 改为延迟导入（在实际连接 MySQL 时才导入），使 memory 模式不依赖 pymysql
3. 或者在 `requirements.txt` 中将 `pymysql` 和 `cryptography` 从可选改为必选
4. 更新 README，补充"常见启动问题"章节，记录 sniffio 和 pymysql 的解决方案

**风险**：极低。仅修改依赖声明和导入方式，不改变业务逻辑。

**验证**：在全新虚拟环境中按 README 步骤安装，确认后端能一键启动且所有路由注册成功。

### 改进二：注册 auth 路由并正确配置 DEV_MODE 安全边界，打通前端到后端的完整链路（预计 1 天）

**问题**：
- `auth_routes.py` 已编写但未在应用工厂注册，导致 `/api/auth/*` 全部 404
- `config.py` 未设置 `DEV_MODE`，导致 Dashboard API 全部返回 401，前端 Dashboard 页面无法获取数据
- 前端 Mock Auth 与后端认证完全脱节

**改进内容**：
1. 在 `backend/app/__init__.py` 的 `create_app()` 中注册 auth 蓝图（`/api/auth`）
2. 在 `config.py` 中添加 `DEV_MODE = os.environ.get('DEV_MODE', 'false').lower() == 'true'`，**默认关闭 DEV_MODE**；只有本地开发时显式设置环境变量 `DEV_MODE=true` 才启用开发模式绕过认证
3. **明确安全边界**：未设置 `DEV_MODE` 时（即默认状态），Dashboard 和所有修改类接口必须拒绝未认证请求，返回 401；不得在生产或未显式声明的环境中默认放行
4. 确保前端 `api.js` 在调用 Dashboard API 时携带正确的请求头（本地开发时 DEV_MODE=true 可绕过，其他环境必须携带有效认证）
5. 验证前端 Dashboard 页面在本地开发模式（DEV_MODE=true）下能正常获取后端数据

**风险说明**：这不是低风险改进，而是**安全边界，必须先验证**。DEV_MODE 的默认值直接决定认证是否生效，若默认开启会导致生产环境所有接口可被未认证访问。注册已有路由、添加配置项本身不改变业务逻辑，但 DEV_MODE 默认值必须为 false，且需在本地开发和生产两种场景下分别验证认证行为符合预期。

**验证**：
- 本地开发：设置 `DEV_MODE=true` 启动后端，前端登录后访问 Dashboard，确认能正常显示数据
- 默认安全：不设置 `DEV_MODE`（或设为 false）启动后端，直接调用 `/api/dashboard/overview`，确认返回 401 拒绝未认证请求

### 改进三（可选）：清理仓库根目录的历史遗留脚本（预计 0.5 天）

**问题**：根目录存在 4 个 scripts 目录版本 + 大量 `.cmd` 启动脚本 + 内网穿透工具，新接手者难以判断正确的启动方式。

**改进内容**：
1. 确认 `run_dev_enhanced.py` 为推荐启动脚本后，将其他 `run_dev*.py` 标记为废弃或删除
2. 将 `scripts_backup/`、`scripts_old/`、`scripts_new/` 归档或删除
3. 将 `cpolar_proxy.js`、`ngrok.zip`、`setup_cpolar.cmd` 等开发工具移到 `.gitignore` 或单独的 `tools/` 目录
4. 在 README 中明确唯一推荐的启动命令

**风险**：低。仅删除/移动非核心文件，不影响业务代码。需确认没有其他脚本被 CI 或部署流程引用。

---

## 8. 整体架构理解（个人总结）

Caifusi 的架构可以用一句话概括：**一个"前端重交互、后端薄 API、AI 做大脑"的个人财务教育应用。**

从分层来看，它是一个典型的前后端分离 SPA 架构：

- **前端（React SPA）** 承担了几乎所有的用户交互逻辑——页面路由、状态管理、表单验证、问卷评分、对话展示、数据可视化。AuthContext 的 Mock 实现说明当前阶段前端是"自给自足"的，不依赖后端做用户管理。
- **后端（Flask API）** 非常薄，核心职责只有三个：代理 AI 对话（coach）、存储评估结果（assessment）、提供仪表盘数据（dashboard）。没有用户认证、没有复杂业务逻辑、没有任务队列。Flask 应用工厂的设计是规范的，但蓝图注册不完整（auth 缺失）和导入路径的混乱（app/routes 与 routes 并存）暴露出这是一个快速迭代中的原型项目。
- **AI 层（智谱 GLM-4）** 是整个产品的"大脑"和差异化所在。`zhipuai_service.py` 的设计思路是正确的——通过系统提示词将用户的评估结果注入 AI 上下文，实现个性化教练。但当前实现还比较初级：对话历史存在内存字典里（重启丢失）、没有用户隔离的安全机制、模型固定为 glm-4-flash（虽然有 switch_model 接口但前端未使用）。

从数据流向来看，最核心的链路是：**用户问卷 → 评估结果 → AI 系统提示词 → 个性化教练对话**。这条链路在代码中是完整的，Assessment.js 计算结果后传递给 CoachChat.js，再通过 API 传给后端注入 system prompt。这是 Caifusi 最有价值的产品设计——不是简单的 AI 聊天机器人，而是"先评估、再教练"的闭环。

从成熟度来看，Caifusi 目前处于 **v0.1.0 原型验证阶段**：
- 产品定位清晰，核心功能（评估 + AI 教练 + Dashboard）的骨架已搭好
- 但工程化程度较低：无测试、无 CI、依赖有缺失、脚本混乱、认证未打通
- 数据层是内存态，无法支撑真实用户
- AI 功能依赖外部 API Key，当前未验证实际对话效果

对于接手者来说，**第一优先级应该是"让它能完整跑通"**——修复依赖问题、注册 auth 路由、正确配置 DEV_MODE 安全边界（默认关闭，本地开发显式开启）、验证 AI 对话实际效果。在此基础上，再考虑数据持久化、真实认证、测试覆盖等工程化改进。

---

## 9. 事实与推断边界

### 已查证事实（有代码或运行结果支撑）

1. 项目默认分支为 main，最新 tag 为 v0.1.0
2. 技术栈为 React 18 + Flask 3.x + 智谱 GLM-4，已通过 package.json 和 requirements.txt 确认
3. 后端应用工厂注册了 coach、dashboard、assessment 三个蓝图，未注册 auth 蓝图（通过 `app/__init__.py` 源码和运行时路由列表确认）
4. Dashboard API 有 `@authenticate` 装饰器，DEV_MODE 未配置时返回 401（通过源码和 API 测试确认）
5. zhipuai SDK 缺少 sniffio 传递依赖，需手动安装（通过运行时 `ModuleNotFoundError` 确认）
6. user_data_service 在模块导入时依赖 pymysql，即使 memory 模式也需要安装（通过运行时蓝图注册失败确认）
7. 前端 AuthContext 是完全的 Mock 实现，不调用后端 API（通过 `AuthContext.js` 源码确认）
8. 前端 `npm run build` 成功，无编译错误（通过构建结果确认）
9. 后端启动成功，15 个 API 端点可访问（通过运行日志和 curl 测试确认）
10. 仓库存在 scripts/、scripts_backup/、scripts_new/、scripts_old/ 四个脚本目录（通过目录列表确认）

### 合理推断（基于代码结构但未完全验证）

1. **AI 教练实际对话功能未验证**：当前使用占位符 API Key，虽然服务初始化成功，但实际调用智谱 API 会失败。推断需要真实 API Key 才能验证对话效果。
2. **生产环境计划使用 Firebase Auth**：后端有 `auth_service.py`（Firebase token 验证）、前端有 `firebase.js` 配置，推断最终认证方案是 Firebase Auth，但当前开发阶段用 Mock 替代。
3. **MySQL 是主要生产数据库**：存在 `schema.sql` 和 `db_mysql.py`，且 user_data_service 强依赖 pymysql，推断 MySQL 是首选生产数据库，Firestore 是备选。
4. **项目曾经历多次重构**：多个启动脚本版本、重复的 routes/services 目录、scripts 的四个版本，推断项目在快速迭代中经历过架构调整，遗留了未清理的代码。
5. **前端 Dashboard 页面当前无法正常显示数据**：由于 Dashboard API 返回 401 且前端 Mock Auth 不携带有效 token，推断前端 Dashboard 页面会显示错误或空数据。但未实际启动前端开发服务器验证。

### 未确认事项（需要项目维护者或额外资料确认）

1. 群内是否有额外的设计文档、需求文档或会议记录
2. 智谱 API Key 的实际配置和 AI 对话效果
3. auth_routes.py 是计划中功能还是已废弃代码
4. 生产环境的部署方式和服务器配置
5. v0.1.0 之后的产品路线图

---

## 10. 参考文件与验证命令

### 查阅的核心文件

| 文件路径 | 内容 |
|----------|------|
| `README.md` | 项目介绍、功能说明、安装步骤 |
| `package.json` | 前端依赖、脚本、代理配置 |
| `.env.example` | 环境变量模板 |
| `backend/app/__init__.py` | 应用工厂、蓝图注册 |
| `backend/app/config.py` | 配置类 |
| `backend/app/routes/coach_routes.py` | AI 教练路由 |
| `backend/app/routes/dashboard_routes.py` | Dashboard 路由与认证装饰器 |
| `backend/app/routes/assessment_routes.py` | 评估路由 |
| `backend/app/services/zhipuai_service.py` | 智谱 AI 服务 |
| `backend/requirements.txt` | Python 依赖 |
| `src/App.js` | 前端路由配置 |
| `src/contexts/AuthContext.js` | 前端 Mock 认证 |
| `src/services/api.js` | 前端 API 服务 |

### 执行的验证命令

```bash
# 后端依赖安装
py -3.10 -m venv .venv
.venv\Scripts\python.exe -m pip install flask flask-cors python-dotenv requests zhipuai
.venv\Scripts\python.exe -m pip install sniffio pymysql cryptography

# 后端启动
.venv\Scripts\python.exe backend/run_dev_enhanced.py

# API 测试
curl http://127.0.0.1:5001/api/health
curl http://127.0.0.1:5001/api/coach/health
curl http://127.0.0.1:5001/api/dashboard/overview
curl http://127.0.0.1:5001/api/assessment/latest
curl -X POST http://127.0.0.1:5001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"123456\"}"

# 前端依赖安装与构建
npm install
npm run build
```

### 使用的 AI 工具

- 豆包 AI 助手（代码阅读、架构分析、文档撰写）

---

*本文档为阶段一项目理解产出，仅作文档型 PR 提交，不修改任何业务逻辑。如有事实性错误或遗漏，请在 PR 评审中指出。*
