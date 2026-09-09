<p align="center">
  <img src="assets/brand/Caifusi-logo-wordmark-v1.png" alt="财赋思 Caifusi" width="480">
</p>

<h1 align="center">Caifusi 财赋思</h1>

<p align="center">
  面向个人财务学习与复盘的 AI 辅助 Web 应用。
</p>

<p align="center">
  <a href="#快速开始">快速开始</a> ·
  <a href="#页面预览">页面预览</a> ·
  <a href="DEPLOYMENT_GUIDE.md">部署指南</a> ·
  <a href="https://github.com/XiaoCow666/Caifusi/issues">提交 Issue</a>
</p>

<p align="center">
  <a href="https://github.com/XiaoCow666/Caifusi/stargazers"><img src="https://img.shields.io/github/stars/XiaoCow666/Caifusi?style=flat-square&logo=github" alt="GitHub stars"></a>
  <a href="https://github.com/XiaoCow666/Caifusi/network/members"><img src="https://img.shields.io/github/forks/XiaoCow666/Caifusi?style=flat-square&logo=github" alt="GitHub forks"></a>
  <a href="https://github.com/XiaoCow666/Caifusi/blob/main/LICENSE"><img src="https://img.shields.io/github/license/XiaoCow666/Caifusi?style=flat-square" alt="License"></a>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 18">
  <img src="https://img.shields.io/badge/Flask-3.x-000000?style=flat-square&logo=flask&logoColor=white" alt="Flask">
</p>

> 当前发布：<a href="https://github.com/XiaoCow666/Caifusi/releases/tag/v0.1.0"><code>v0.1.0</code></a>。
>
> 这个仓库目前适合本地体验、功能验证和产品迭代。AI 教练需要单独配置后端服务和 API 密钥。

## 项目简介

Caifusi 是一个 React + Flask 应用，围绕个人财务学习、状态梳理和行动复盘提供几类工具：

- 用问卷了解自己的风险偏好、习惯和当前财务状态；
- 在金融知识库里查找基础概念；
- 通过 AI 教练讨论问题，整理下一步行动；
- 在 Dashboard 中查看预算、目标和进展。

它用于金融教育和决策复盘，不替代投资、税务或法律专业意见。

## 页面预览

下面的图片来自当前项目页面。

<p align="center">
  <img src="assets/readme/caifusi-home.png" alt="财赋思首页" width="100%">
</p>

<p align="center">
  <img src="assets/readme/caifusi-knowledge.png" alt="财赋思金融知识库" width="100%">
</p>

<details>
<summary>查看登录页</summary>

<p align="center">
  <img src="assets/readme/caifusi-login.png" alt="财赋思登录页" width="100%">
</p>
</details>

## 主要功能

| 功能 | 当前实现 |
| --- | --- |
| 金融心智评估 | 通过问卷梳理风险偏好、习惯和财务状态 |
| AI 金融心智教练 | 通过 Flask API 调用智谱 AI；Gemini 为可选接入 |
| Dashboard | 查看财务健康、预算、目标和进展 |
| 金融知识库 | 按主题浏览和搜索基础金融知识 |

默认开发状态还有两个边界：<code>AuthContext</code> 使用 mock auth，数据主要保存在内存或浏览器 <code>localStorage</code> 中。要接入真实账户和持久化数据，需要按部署环境配置 Firebase 或数据库服务。

## 快速开始

### 环境要求

- Node.js 18 或更高版本；
- Python 3.8 或更高版本；
- AI 教练需要智谱 AI API Key，Gemini Key 可选；
- Firebase 或其他后端存储按实际部署需求配置。

### 1. 配置后端环境

在仓库根目录创建 <code>.env</code>，不要把真实密钥提交到 Git：

~~~powershell
Copy-Item .env.example .env
~~~

至少填写 <code>ZHIPUAI_API_KEY</code> 和 <code>SECRET_KEY</code>。如果要启用 Gemini，再填写 <code>GEMINI_API_KEY</code>。前端使用 Firebase 时，按 <code>src/firebase.js</code> 中的变量名创建 <code>.env.local</code>。

### 2. 安装依赖并启动

~~~powershell
# 终端 A：后端 API（核心依赖，包含智谱 AI）
python -m pip install -r backend/requirements.txt
python backend/run_dev_enhanced.py

# 终端 B：React 前端
npm install
npm start
~~~

`backend/requirements.txt` 只包含核心运行依赖。以下功能需要按需追加可选依赖文件：

| 需要的功能 | 追加安装命令 |
| --- | --- |
| Firebase 存储（<code>DB_TYPE=firebase</code>） | <code>pip install -r backend/requirements.txt -r backend/requirements-firebase.txt</code> |
| Google Gemini 模型 | <code>pip install -r backend/requirements.txt -r backend/requirements-gemini.txt</code> |
| 生产部署 WSGI（gunicorn，仅 Unix） | <code>pip install -r backend/requirements.txt -r backend/requirements-prod.txt</code> |

> <code>gunicorn</code> 仅支持 Unix 类系统，Windows 用户不需要也不应安装 <code>requirements-prod.txt</code>。

后端默认地址是 <http://localhost:5001>，前端默认地址是 <http://localhost:3000>。Windows 也可以运行 [快速启动.cmd](快速启动.cmd)；这个脚本会读取 <code>.env.local</code>。

### 3. 连接远程 API

开发环境会把 API 请求代理到 <code>http://localhost:5001</code>。如果前端部署到 GitHub Pages 或其他静态托管平台，构建时设置 <code>REACT_APP_API_URL</code>，并在后端的 <code>CORS_ALLOWED_ORIGINS</code> 中加入前端域名。没有远程 API 时，公开静态页面仍可以打开，但 AI 教练不能正常工作。

## 常见启动问题

### 推荐使用虚拟环境

为避免与系统 Python 环境冲突，推荐在项目根目录创建独立虚拟环境：

~~~powershell
# 创建虚拟环境（只需一次）
python -m venv .venv

# 激活虚拟环境
.venv\Scripts\Activate.ps1   # PowerShell
.venv\Scripts\activate.bat   # CMD

# 后续所有 pip / python 命令都在虚拟环境中执行
python -m pip install -r backend/requirements.txt
python backend/run_dev_enhanced.py
~~~

不激活虚拟环境时，也可以直接用虚拟环境的解释器执行：

~~~powershell
.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
.venv\Scripts\python.exe backend/run_dev_enhanced.py
~~~

### 问题排查

| 报错信息 | 原因 | 解决方法 |
| --- | --- | --- |
| `ModuleNotFoundError: No module named 'sniffio'` | 旧版 requirements.txt 未显式声明 zhipuai SDK 的传递依赖 | 确保使用最新版 `backend/requirements.txt`（已包含 `sniffio>=1.3.0`），重新执行 `pip install -r backend/requirements.txt` |
| `ModuleNotFoundError: No module named 'pymysql'` | MySQL 模式需要 pymysql 驱动 | 默认 `DB_TYPE=memory` 开发模式已不再硬依赖 pymysql（采用延迟导入），可直接启动；若使用 `DB_TYPE=mysql`，请执行 `pip install pymysql cryptography` |
| Dashboard API 返回 `401 需要授权令牌` | DEV_MODE 默认关闭，认证装饰器拒绝未认证请求 | 本地开发时在 `.env` 中设置 `DEV_MODE=true`；生产环境必须保持默认关闭（`false`），使用真实认证 |
| `Address already in use` / 端口 5001 被占用 | 其他进程占用了 5001 端口 | 执行 `netstat -ano | findstr :5001` 找到占用进程 PID，再执行 `taskkill /PID <PID> /F` 结束进程；或修改启动脚本中的端口号 |
| `ImportError: firebase_admin` | 未安装 Firebase Admin SDK（仅 Firebase 模式需要） | 默认 memory/mysql 模式不需要 firebase_admin；若使用 `DB_TYPE=firebase`，请执行 `pip install -r backend/requirements-firebase.txt` |
| AI 教练返回 API 调用错误 | 未配置有效智谱 API Key | 在 `.env` 中填写有效的 `ZHIPUAI_API_KEY`；确认 Key 未过期且有可用额度 |

### 验证后端是否正常启动

启动后端后，在浏览器或终端访问以下地址验证：

~~~powershell
# 健康检查（应返回 200 + {"status":"healthy"}）
curl http://127.0.0.1:5001/api/health

# AI 教练服务状态（应返回 200 + {"status":"ok"}）
curl http://127.0.0.1:5001/api/coach/health

# 评估接口（应返回 200 + {"assessment":null}）
curl http://127.0.0.1:5001/api/assessment/latest
~~~

## 部署路线

| 目标 | 方式 | 说明 |
| --- | --- | --- |
| 只展示前端 | GitHub Pages <code>/docs</code> | 发布静态构建产物，不包含后端和 AI 能力 |
| 完整产品体验 | 静态前端 + Flask API | API 使用 HTTPS，并配置 <code>REACT_APP_API_URL</code> 和 CORS |
| 单机试点 | Nginx + Gunicorn + MySQL/Firebase | 后端只监听本机端口，关闭开发服务器和默认密钥 |

Pages、Gunicorn、Systemd、Nginx、HTTPS、数据库和故障排查步骤见 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)。

## 技术结构

~~~mermaid
flowchart LR
    User[用户] --> Web[React 18 + HashRouter]
    Web --> API[Flask API :5001]
    API --> AI[智谱 GLM-4 / Gemini]
    API --> Store[Memory / MySQL / Firebase]
~~~

| 层 | 当前实现 |
| --- | --- |
| Web | React 18、React Router、Bootstrap、Tailwind、React Icons |
| API | Flask、Flask-CORS、python-dotenv |
| AI | 智谱 AI GLM-4；Gemini 可选 |
| 数据 | 开发态内存数据；可配置 MySQL 或 Firebase |

## 安全与使用边界

- 当前认证流程是开发态 mock auth，不应直接用于正式账户系统。
- 不要把 API Key、Firebase 私钥或数据库凭据放进 README、截图、Issue 或提交记录。
- GitHub Pages 只提供静态前端；完整 AI 功能需要一个可访问、且正确配置 CORS 的后端。
- Caifusi 用于金融教育和个人复盘，不构成投资、税务、法律或其他专业建议。重要决定请咨询持牌专业人士。

密钥配置见 [SECURITY_SETUP.md](SECURITY_SETUP.md)，部署说明见 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)。

## 文档入口

| 需要了解的内容 | 文档 |
| --- | --- |
| 第一次使用 | [使用说明.md](使用说明.md) |
| 部署前端和后端 | [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) |
| 配置密钥 | [SECURITY_SETUP.md](SECURITY_SETUP.md) |
| 启动异常排查 | [启动问题排查.md](启动问题排查.md) |
| 智谱 API 配置 | [docs/智谱API密钥获取与配置指南.md](docs/智谱API密钥获取与配置指南.md) |

## 发布

当前公开版本是 [v0.1.0](https://github.com/XiaoCow666/Caifusi/releases/tag/v0.1.0)。后续发布会在 GitHub Release 中记录，并同步更新项目文档。

## Star History

顶部徽章显示当前 star 数。这里没有嵌入第三方历史图，因为 GitHub 对公开 stargazers 时间线接口的限制会让 Star History 返回错误页面。等仓库自己的趋势数据生成流程准备好后，再把图放回 README。

- [查看 Caifusi 仓库](https://github.com/XiaoCow666/Caifusi)
- [Star History 官方说明](https://www.star-history.com/blog/github-stargazer-api-restriction/)

## 参与贡献

欢迎通过 [Issues](https://github.com/XiaoCow666/Caifusi/issues) 提交体验反馈、产品想法和可复现的问题。提交代码前，请在 Pull Request 中说明改动原因、验证方式，以及是否涉及密钥或数据结构。

## License

本项目采用 [MIT License](LICENSE)。
