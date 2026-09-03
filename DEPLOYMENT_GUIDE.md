# 财赋思部署指南

这份文档按当前仓库结构编写。财赋思由两个运行面组成：React 前端和 Flask API。前端可以放到 GitHub Pages 等静态托管平台；后端必须部署到能运行 Python 的服务器，不能把 API 密钥或数据库凭据放进静态前端。

## 先选部署方式

| 场景 | 前端 | 后端 | 适合谁 |
| --- | --- | --- | --- |
| 本地开发 | `npm start` | Flask 开发服务器，5001 端口 | 产品体验、调试、截图 |
| 静态展示 | GitHub Pages `/docs` | 不部署或单独提供 API | 展示首页和公开内容 |
| 完整体验 | GitHub Pages / Nginx | Gunicorn + Nginx + 数据库 | AI 教练、评估、Dashboard |
| 单机试点 | Nginx 提供前端 | 同一台机器运行 Flask API | 小规模内测 |

## 0. 安全底线

- `.env`、`.env.local`、Firebase Admin 私钥、数据库密码和 AI API Key 只放在本机或服务器密钥管理中。
- `REACT_APP_*` 会被打包进浏览器资源，只能放公开前端配置；不要把后端密钥改名成 `REACT_APP_*`。
- 生产环境不要使用开发态默认 `SECRET_KEY`、内存数据或 mock auth。
- GitHub Pages 和静态资源是公开的。发布前检查 `docs/`、截图和构建产物中没有敏感信息。

## 1. 本地开发

### 环境要求

- Node.js 18+
- Python 3.8+
- npm
- AI 教练需要智谱 AI Key；Gemini 为可选集成

### 安装依赖

PowerShell：

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
npm ci
```

macOS / Linux：

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r backend/requirements.txt
npm ci
```

### 配置环境变量

后端脚本会读取仓库根目录的 `.env`：

```powershell
Copy-Item .env.example .env
```

至少设置：

```dotenv
ZHIPUAI_API_KEY=your_key
SECRET_KEY=replace_with_a_random_secret
```

前端 Firebase 配置使用 `.env.local`，变量名以 [`src/firebase.js`](src/firebase.js) 为准。如果只是查看公开页面或使用开发态 mock 登录，可以先不接入真实 Firebase。

### 启动

终端 A：

```bash
python backend/run_dev_enhanced.py
```

终端 B：

```bash
npm start
```

- 前端：<http://localhost:3000>
- 后端健康检查：<http://localhost:5001/api/health>

Windows 也可以使用 [`快速启动.cmd`](快速启动.cmd)。这个脚本读取 `.env.local`，因此使用一键脚本时要准备该文件；手动启动后端则使用 `.env`。

## 2. 发布 React 前端到 GitHub Pages

仓库当前使用根目录 `docs/` 作为已提交的静态发布目录，并且前端使用 `HashRouter`，不需要服务器端 SPA 回退。

### 构建

GitHub Pages 的项目地址通常位于 `/仓库名/` 子路径。构建时使用相对资源路径：

PowerShell：

```powershell
$env:PUBLIC_URL='.'
# 如果需要连接独立 API，再在构建前设置：
$env:REACT_APP_API_URL='https://api.example.com'
npm ci
npm run build
```

macOS / Linux：

```bash
PUBLIC_URL=. REACT_APP_API_URL=https://api.example.com npm ci
PUBLIC_URL=. REACT_APP_API_URL=https://api.example.com npm run build
```

如果只发布公开静态页面，可以不设置 `REACT_APP_API_URL`；但 AI 教练、评估和 Dashboard 的请求需要一个真实可访问的 API 地址。

### 同步到 `/docs`

确认 `build/` 构建成功后，将内容同步到 `docs/`，不要把 `node_modules/` 或根目录 `.env` 一起复制：

PowerShell：

```powershell
Get-ChildItem -LiteralPath 'build' -Force |
  Copy-Item -Destination 'docs' -Recurse -Force
```

同步后确认：

```powershell
Test-Path docs/index.html
Test-Path docs/.nojekyll
Select-String -Path docs/index.html -Pattern 'static/'
```

`docs/index.html`、`docs/static/` 和 manifest 是发布产物；每次前端代码变化都要重新构建并同步，不能只修改源码后期待 Pages 自动重新打包。

### GitHub Pages 设置

1. 打开仓库 `Settings` → `Pages`。
2. `Build and deployment` 的 Source 选择 `Deploy from a branch`。
3. 选择包含最新 `docs/` 的分支，目录选择 `/docs`。
4. 保存后，以 Pages 页面显示的地址为准。

GitHub 官方说明了 branch + `/docs` 和 Actions 两种发布方式；如果后续希望自动构建，建议迁移到 Actions，而不是手工提交构建产物：[Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site?apiVersion=2022-11-28)。

### GitHub Pages + 独立 API

推荐拓扑：

```text
浏览器 → https://<owner>.github.io/<repo>/   (React 静态前端)
浏览器 → https://api.example.com/api/*       (Flask API)
                                      ↓
                           MySQL / Firebase / AI Provider
```

后端根目录的 [`backend/app/__init__.py`](backend/app/__init__.py) 已允许本地前端和 GitHub Pages 来源，并支持通过 `CORS_ALLOWED_ORIGINS` 增加来源：

```dotenv
CORS_ALLOWED_ORIGINS=https://<owner>.github.io,https://your-domain.example
```

API 域名必须使用 HTTPS；前端构建时设置同一个域名的 `REACT_APP_API_URL`。Firebase Web 配置可以进入前端，但 Firebase Admin 私钥只能留在后端服务器。

## 3. 部署 Flask API 到 Linux 单机

下面是适合小规模试点的 Gunicorn + Nginx 路线。仓库没有提供 Docker 镜像；如果使用 Docker，需要自行把 API、数据库、密钥和代码执行隔离一起设计。

### 安装系统依赖

以 Ubuntu/Debian 为例：

```bash
sudo apt update
sudo apt install -y python3-venv nginx
```

### 安装 Python 依赖

```bash
sudo mkdir -p /srv/caifusi
sudo chown "$USER":"$USER" /srv/caifusi
git clone https://github.com/XiaoCow666/Caifusi.git /srv/caifusi
cd /srv/caifusi
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
```

### 准备生产环境变量

创建 `/etc/caifusi.env`，并限制文件权限：

```bash
sudo install -m 600 /dev/null /etc/caifusi.env
sudoedit /etc/caifusi.env
```

示例：

```dotenv
SECRET_KEY=use_python_secrets_token_hex_32_here
ZHIPUAI_API_KEY=your_server_side_key
GEMINI_API_KEY=
DB_TYPE=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=caifusi
MYSQL_PASSWORD=replace_me
MYSQL_DB=caifusi
CORS_ALLOWED_ORIGINS=https://<owner>.github.io,https://your-domain.example
```

如果使用 Firebase，请额外设置 `FIREBASE_ADMIN_SDK_PATH`，并把 JSON 私钥放在服务器受限目录，而不是仓库里。生产数据库、备份和迁移策略需要先确定，再切换 `DB_TYPE`。

### Gunicorn 启动命令

当前后端应用工厂位于 `backend.app.create_app`。在仓库根目录执行：

```bash
cd /srv/caifusi
set -a
source /etc/caifusi.env
set +a
.venv/bin/gunicorn \
  --chdir backend \
  --workers 2 \
  --threads 4 \
  --timeout 120 \
  --bind 127.0.0.1:5001 \
  'app:create_app()'
```

这条命令只绑定本机回环地址，公网流量交给 Nginx。开发脚本 `backend/run_dev_enhanced.py` 适合本地调试，不应作为长期生产进程。

### Systemd 服务

创建 `/etc/systemd/system/caifusi-api.service`：

```ini
[Unit]
Description=Caifusi Flask API
After=network.target

[Service]
User=caifusi
Group=www-data
WorkingDirectory=/srv/caifusi
EnvironmentFile=/etc/caifusi.env
ExecStart=/srv/caifusi/.venv/bin/gunicorn --chdir /srv/caifusi/backend --workers 2 --threads 4 --timeout 120 --bind 127.0.0.1:5001 "app:create_app()"
Restart=always
RestartSec=5
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

首次启用：

```bash
sudo useradd --system --home /srv/caifusi --shell /usr/sbin/nologin caifusi
sudo chown -R caifusi:www-data /srv/caifusi
sudo systemctl daemon-reload
sudo systemctl enable --now caifusi-api
sudo systemctl status caifusi-api --no-pager
```

如果 API 需要写入日志或上传目录，确保 `caifusi` 对相应目录有最小必要权限；不要为了省事把整个服务器目录设为 `777`。

### Nginx 反向代理

创建 `/etc/nginx/sites-available/caifusi-api`：

```nginx
server {
    listen 80;
    server_name api.example.com;

    client_max_body_size 16m;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_buffering off;
    }
}
```

启用并检查：

```bash
sudo ln -s /etc/nginx/sites-available/caifusi-api /etc/nginx/sites-enabled/caifusi-api
sudo nginx -t
sudo systemctl reload nginx
curl https://api.example.com/api/health
```

正式上线前为 API 域名配置 HTTPS 证书，并把证书后的真实域名加入 `CORS_ALLOWED_ORIGINS`。健康检查应返回 `status` 为 `healthy`。

## 4. 发布更新与回滚

### 更新流程

```bash
cd /srv/caifusi
git pull --ff-only origin <deploy-branch>
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
sudo systemctl restart caifusi-api
curl https://api.example.com/api/health
```

前端更新则重新执行 `PUBLIC_URL=.` 的构建流程，同步 `docs/` 后提交发布产物。

### 出问题时先看什么

```bash
sudo systemctl status caifusi-api --no-pager
sudo journalctl -u caifusi-api -n 200 --no-pager
sudo tail -n 200 /var/log/nginx/error.log
curl -i https://api.example.com/api/health
```

建议每次发布前记录当前 Git commit；如果新版本启动失败，先恢复上一个经过验证的 commit，再检查日志和环境变量，不要用未知的生产配置反复重启。

## 常见问题

| 现象 | 优先检查 |
| --- | --- |
| Pages 404 | Settings → Pages 的分支/`/docs`、`docs/index.html` 是否存在 |
| 页面白屏 | `docs/index.html` 中资源是否为相对路径，`docs/static/` 是否完整 |
| 页面能开但 AI 失败 | `REACT_APP_API_URL`、API HTTPS、CORS、后端 API Key 和服务日志 |
| 评估或 Dashboard 无数据 | 当前是否仍是开发态内存数据，`DB_TYPE`/MySQL/Firebase 是否配置 |
| 登录看起来成功但无法持久化 | 当前前端 `AuthContext` 是开发态 mock auth；生产账户接入尚未等同完成 |
| 请求超时 | Gunicorn/Nginx 的超时、AI provider 响应时间、数据库连接和日志 |

## 发布前检查清单

- [ ] 生产 `SECRET_KEY` 已随机生成且未进入 Git。
- [ ] AI Key、Firebase Admin 私钥、数据库密码未进入前端构建产物。
- [ ] 前端已用 `PUBLIC_URL=.` 构建，`docs/index.html` 和 `docs/static/` 已同步。
- [ ] API 已使用 Gunicorn + Nginx + HTTPS，而不是 Flask 开发服务器。
- [ ] `CORS_ALLOWED_ORIGINS` 只包含实际前端来源。
- [ ] `/api/health` 返回健康状态，线上日志没有密钥。
- [ ] 数据库有备份和恢复演练；重要金融数据不会只保存在内存。
- [ ] 已明确 AI 建议和金融教育内容不构成投资、税务或法律意见。
