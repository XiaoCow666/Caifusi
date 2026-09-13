```
# Caifusi 财赋思项目理解文档
## PR 概述
本 PR 为阶段一「项目理解与问题发现」的文档型产出，仅新增 docs/caifusi_project_understanding.md，**不修改任何业务逻辑、不提交生产配置或密钥**。

使用工具：豆包 AI（文档撰写、资料整理、信息归纳）

### 查阅的核心文件
| 文件 | 查阅内容 |
| ---- | ---- |
| README.md | 项目介绍、功能说明、本地安装启动步骤 |
| DEPLOYMENT_GUIDE.md | 项目部署方案、跨域与环境配置说明 |
| SECURITY_SETUP.md | API 密钥管理规范、安全注意事项 |
| 使用说明.md | 本地使用指引、功能操作说明 |
| 启动问题排查.md | 本地启动常见故障排查 |
| 项目评审.md | 阶段评审记录、已知问题记录 |

### 验证命令与结果
> 本次为静态资料分析，**未执行本地部署、curl/接口测试、前端打包构建**，无运行日志与接口返回结果。
```bash
# 后端环境准备参考
python -m pip install -r backend/requirements.txt
python backend/run_dev_enhanced.py

# 前端环境准备参考
npm install
npm start
```

变更范围：仅新增 docs/caifusi_project_understanding.md，无业务代码修改、无配置变更、无密钥提交。

---

## 0. 文档前置说明

### 0.1 阅读范围

本次分析材料来源：

1. GitHub 仓库 `https://github.com/XiaoCow666/Caifusi` 仓库 README.md、仓库根目录文件列表
2. 群内可见飞书知识库文档：`https://hcnohkzwsogo.feishu.cn/docx/UWvwdB1S7o09ecxEdMycWty8n0c`（2026-09-05 项目总览资料）
3. 阅读文件范围：仓库根目录 README，`DEPLOYMENT_GUIDE.md`、`SECURITY_SETUP.md`、docs 目录相关说明；**未深入读取 backend / 前端 src 完整源码、单元测试用例**。
4. 排除范围：`.env`、`.env.example`（密钥相关）、node_modules、venv 等第三方依赖目录。

### 0.1.1 资料溯源清单

本次分析所引用材料来源均可追溯：

1. GitHub 仓库：[https://github.com/XiaoCow666/Caifusi](https://link.wtturl.cn/?target=https%3A%2F%2Fgithub.com%2FXiaoCow666%2FCaifusi&scene=im&aid=582478&lang=zh)，当前 HEAD commit：e451bd4；归档版本 v0.1.0 commit：930da2c
2. 飞书项目总览文档：[https://hcnohkzwsogo.feishu.cn/docx/UWvwdB1S7o09ecxEdMycWty8n0c](https://link.wtturl.cn/?target=https%3A%2F%2Fhcnohkzwsogo.feishu.cn%2Fdocx%2FUWvwdB1S7o09ecxEdMycWty8n0c&scene=im&aid=582478&lang=zh)，资料时间范围：2026-09-03 ~ 2026-09-05
3. 线上项目站点：[http://49.232.147.154](https://link.wtturl.cn/?target=http%3A%2F%2F49.232.147.154&scene=im&aid=582478&lang=zh)，仅归档访问地址，本轮未开展线上验收测试
4. 仓库文件清单：GitHub 仓库根目录文件列表（作为本次目录结构信息来源）

### 0.2 验证命令（静态分析，无本地执行结果）

```
# 后端环境准备
python -m pip install -r backend/requirements.txt
python backend/run_dev_enhanced.py

# 前端环境准备
npm install
npm start
```

> 
> 验证结果：静态文档描述命令有效，**未本地执行，无运行日志输出**。线上站点地址：`http://49.232.147.154`，本轮仅归档地址，未完成线上验收测试。

### 0.3 事实与推断边界

本文将内容分为三类：

1. **已查证事实**：仓库文件列表、README、飞书文档原文明确描述、可直接核验的信息（项目文件结构、技术栈、功能清单、环境依赖、部署方案、协作记录、品牌资产）。
2. **合理推断**：基于现有文档、文件结构推导的模块调用逻辑，**未经过源码精读或测试验证，不能当作已确认系统行为。如需确认，需要阅读源码或执行测试**。
3. **未确认事项**：缺少资料佐证，需要项目维护者进一步核实的问题。

本文档所有结论不超出上述资料范围，不猜测未声明的业务逻辑；宣传素材页面不等于全部功能已完成验证。

---

## 1. 项目定位

Caifusi（财赋思）是面向个人的 AI 金融心智教练 Web 应用，技术栈采用 React 前端 + Python Flask 后端。项目围绕个人财务学习、风险评估、AI 对话三大方向建设，产出可用于竞赛展示的 Web 产品。

### 项目目标

帮助用户完成财务状态评估、金融知识学习、个人财务目标管理；借助 AI 对话助手提供财务相关咨询，配套可视化 Dashboard 管理个人财务计划。项目同时作为学科竞赛作品，配套品牌宣传素材。

### 边界（已查证事实）

1. 项目定位为金融教育工具，**不提供投资、税务等专业金融决策建议**；
2. 当前版本 v0.1.0 为本地演示版本，采用 Mock 前端认证 + 内存存储作为默认方案，**非生产可用系统**；
3. AI 教练能力依赖智谱大模型 API，必须配置 API 密钥才能启用对话功能；
4. GitHub Pages 仅承载静态前端页面，AI 教练、评估、Dashboard 等后端能力无法在静态页面运行；
5. 宣传海报截图取自首页、金融市场、热门个股、知识库这类公开页面；评估、计划、AI 教练、Dashboard 属于登录保护页面，**海报素材不能证明这部分功能完整验证**；
6. 阶段二评审记录指出存在 API 路径、证据与验收口径问题，该问题状态待确认。

### 品牌定位（已查证事实）

品牌视觉围绕 AI 陪伴、财务成长设计。Logo 为初稿，素材使用存在约束：不得嵌入密钥、凭证等敏感信息。海报版本 v12，配套联合展板，用于答辩展示。

### 竞赛相关（已查证事实）

项目拥有两项竞赛相关获奖素材：沈阳航空航天大学科技类赛事三等奖（2026）、另一项大赛获奖素材。**获奖最终表述以纸质证书原件为准，文档描述仅为素材记录，不可直接等同于证书原文。**

### 适用人群

个人财务学习者，用于财务自评、规划练习；同时用于项目答辩、竞赛展示、社团科技文化宣传。

---

## 2. 目录与模块

### 仓库目录结构（来自 GitHub 仓库文件列表）

```
Caifusi/
├── .agent/skills
├── .agents/rules
├── .kilocode
├── .vscode
├── assets
├── backend
├── docs
├── public
├── scripts
├── scripts_backup/docs
├── scripts_new
├── scripts_old
├── src
├── .env.example
├── .gitignore
├── .nojekyll
├── DEPLOYMENT_GUIDE.md
├── Dashboard编辑功能更新.md
├── LICENSE
├── README.md
├── SECURITY_SETUP.md
├── access_instructions.md
├── bac
├── check_ports.cmd
├── cpolar_proxy.js
├── cpolar_redirect.html
├── debug_out.txt
├── direct_access_fix.cmd
├── direct_start.cmd
├── fast_start.cmd
├── free_ports.cmd
├── index.html
├── local_start.cmd
├── ngrok.zip
├── package-lock.json
├── package.json
├── postcss.config.js
├── report-source.md
├── restart_services.cmd
├── run_simple_server.cmd
├── setup_cpolar.cmd
├── simple-static-server.js
├── simple_server.js
├── simple_start.cmd
├── start.cmd
├── start.ps1
├── start_cpolar_proxy.cmd
├── start_static_server.cmd
├── static_server.js
├── tailwind.config.js
├── update_scripts.cmd
├── webpack.config.js
├── “财赋思 (Cái Fù Sī)”项目策划书：AI金融心智教练.md
├── 一个小问题.md
├── 使用说明.md
├── 停止所有服务.cmd
├── 启动-内网穿透.ps1
├── 启动-本地服务.ps1
├── 启动.ps1
├── 启动开发模式.cmd
├── 启动问题排查.md
├── 快速启动.cmd
├── 核心功能完善更新文档.md
├── 说明书L1.docx
├── 重启开发模式.cmd
├── 重新构建前端.cmd
├── 项目构思.md
└── 项目评审.md
```

### 模块职责

1. **前端 Web 模块（React，src/）**
   - 页面：首页、金融知识库、金融市场、热门个股、评估问卷、AI 教练对话、Dashboard 财务看板、登录页；
   - 能力：问卷填写、知识库浏览、AI 对话界面、财务目标可视化；
   - 存储：前端本地 localStorage；
   - 认证：前端 Mock AuthContext，本地生成随机测试用户，**不依赖后端鉴权接口**。
2. **Flask 后端 API 模块（backend/）**
   - 提供 REST 接口，接收前端请求；
   - 配置 CORS 跨域；
   - 封装智谱 AI 服务，转发对话请求；
   - 支持内存存储，可切换 MySQL；
   - 路由包含教练对话、评估、Dashboard 相关接口。
3. **AI 教练模块（backend 内部实现）【合理推断】**
   - 接收前端对话请求，调用智谱 API；
   - 依赖外部 API 密钥，密钥缺失则 AI 对话功能不可用；
4. **知识库与财务评估模块**
   - 问卷收集用户财务信息，生成评估结果；
5. **Dashboard 财务目标模块**
   - 展示、编辑个人财务目标；接口带有认证装饰器；
6. **脚本与启动工具（scripts/ + 根目录大量 cmd/ps1 脚本）**
   - 包含一键启动、端口检测、内网穿透、服务重启脚本；
   - scripts_backup /scripts_new/scripts_old 为多版本脚本备份；
7. **文档资产模块（docs/、assets/、根目录各类 md 文档）**
   - 项目策划书、部署文档、安全文档、评审记录；
   - assets 存放答辩海报等素材；docs 目录用于存放项目理解文档。

---

## 3. 核心业务流程【合理推断】

### 流程 1：用户财务评估

1. 用户打开评估问卷页面；
2. 填写财务相关问卷，提交表单；
3. 后端接收问卷数据，生成评估结果；
4. 前端展示评估报告。

> 
> 备注：评估页面属于登录保护页面，海报素材未验证该业务完整链路。

### 流程 2：AI 教练对话

1. 用户进入 AI 教练页面；
2. 前端发送对话文本至后端 coach 路由；
3. 后端调用智谱 AI 服务，获取大模型回复；
4. 前端展示 AI 回复。

> 
> 约束：后端必须配置有效的智谱 API 密钥，AI 对话才可使用。该页面属于登录保护页面。

### 流程 3：Dashboard 财务目标管理

1. 用户进入 Dashboard 页面；
2. 请求后端财务目标接口；接口带有认证装饰器；
3. 成功鉴权后，读取 / 新增 / 修改财务目标；
4. 前端可视化展示目标数据。

> 
> 备注：Dashboard 属于登录保护页面；当前静态资料无法确认认证绕过配置状态。

### 流程 4：知识库浏览（公开页面）

1. 用户直接访问知识库页面；
2. 前端加载金融知识内容，无需登录；

> 
> 该页面为答辩海报展示页面，可正常访问。

### 流程 5：项目宣传物料生成（已查证事实）

1. 执行海报生成脚本；
2. 读取 Logo、截图素材；
3. 输出答辩展板图片，用于竞赛汇报。

---

## 4. 运行与部署说明（已查证事实）

### 4.1 本地开发环境

- 前端：Node.js，React；
- 后端：Python Flask；
- 可选数据库：MySQL；默认内存存储；
- 项目配套大量 cmd/ps1 一键启动脚本（`快速启动.cmd`、`start.cmd`等），简化本地启动流程。

### 4.2 本地启动参考步骤

1. 准备环境：Node + Python；
2. 复制 `.env.example` 为 `.env`，按需填入智谱 API 密钥；
3. 启动后端服务；
4. 启动前端服务；
5. 浏览器访问本地前端地址。

### 4.3 GitHub Pages 静态部署

仅部署前端静态资源，**后端 API、AI 教练、评估、Dashboard 接口无法运行**，只能展示静态页面。

### 4.4 线上站点

`http://49.232.147.154` 仅归档地址，本次静态分析未执行线上验收测试，无法确认和仓库代码版本一致性。

---

## 5. 风险与待识别问题

### 5.1 识别到的风险项

1. **认证安全风险【已查证事实】**：当前采用前端 Mock 认证；Dashboard 路由存在 DEV_MODE 开发绕过逻辑；若环境变量配置不当，存在未授权访问与修改财务数据风险。
2. **密钥泄露风险【已查证事实】**：API 密钥存放在本地.env 文件；仓库禁止提交密钥，部署过程若操作失误，容易将密钥提交到代码仓库。
3. **数据持久化风险【已查证事实】**：默认内存存储，后端重启后全部用户数据丢失；MySQL 为可选依赖。
4. **跨域部署风险【已查证事实】**：前后端分离部署，需要正确配置 CORS，否则前端无法调用后端接口；阶段二评审记录存在 API 路径相关问题。
5. **宣传素材边界风险【已查证事实】**：答辩海报截图仅取自公开页面；登录保护页面功能不能仅凭海报截图证明可用，容易造成对外夸大效果。
6. **第三方依赖可用性风险【合理推断】**：AI 对话依赖智谱 API 服务；当 API 限流、超时、密钥失效时 AI 教练功能不可用。
7. **脚本维护成本风险【已查证事实】**：仓库存在多套 scripts 版本备份、大量 cmd/ps1 脚本、内网穿透工具混入仓库；脚本版本杂乱，新人容易误启动废弃脚本。

### 5.2 待确认疑问（移入下文【未确认事项】汇总）

---

## 6. 1–2 天低风险改进方向（仅文档类改动，不修改业务代码）

> 
> 目标：只补充文档、注释、说明，不修改任何业务代码，不新增功能，不改动接口。每条附带验收标准。

1. **完善 API 说明文档**
   - 内容：在`docs/`新增简单 API 说明文档，列出后端主要接口路径；备注阶段二评审发现的 API 路径已知缺陷。
   - 验收：docs/api.md 文件提交；仅文档新增，不修改代码。
2. **补充 FAQ 文档**
   - 内容：整合端口占用、密钥配置、CORS、线上站点边界等高频问题。
   - 验收：docs/FAQ.md 文件提交。
3. **README 补充边界提示**
   - 内容：强化 mock auth、本地内存存储局限性；区分公开页面与登录保护页面；竞赛奖项标注以证书原件为准。
   - 验收：README.md 完成文字增补，评审确认表述客观无夸大。
4. **新增启动脚本说明文档**
   - 内容：在 docs 增加脚本介绍，区分活跃脚本与历史备份脚本，防止新人误用旧脚本。
   - 验收：docs/scripts_intro.md 文件提交。
5. **品牌资产规范文档**
   - 内容：记录 Logo、海报使用约束，规范对外宣传素材使用。
   - 验收：docs/brand_guide.md 文件提交。

> 
> 优先推荐：补充 FAQ 文档 + README 边界提示。工作量约 1 天，风险最低。

---

## 7. 未确认事项

下列问题缺少现有资料佐证，需要项目维护者进一步核实：

1. 后端 API 接口文档缺失：阶段二评审指出的 API 路径问题，当前是否已经修复？
2. 数据模型定义：用户问卷、财务目标数据是否存在统一的数据 Schema？
3. 异常处理逻辑：大模型 API 调用超时、报错场景，后端容错逻辑是否完备？
4. 多用户隔离：当前内存存储模式下，是否支持多用户数据隔离？
5. 线上站点 [http://49.232.147.154](https://link.wtturl.cn/?target=http%3A%2F%2F49.232.147.154&scene=im&aid=582478&lang=zh)：线上部署版本与仓库 v0.1.0 归档版本是否一致，线上完整功能验收是否完成？
6. 竞赛奖项：两项获奖素材对应的完整证书原文是否归档，海报描述文字是否和证书原文保持一致？
7. 仓库内大量 cmd/ps1 脚本与多份脚本备份目录：是否存在废弃脚本，是否需要清理或标记废弃脚本，防止新人误用。

---

## 文档局限

本文档基于静态资料完成，存在如下局限：

- 未执行本地部署测试，无实际运行日志；
- 未精读前端、后端源码，内部逻辑部分依赖合理推断；
- 未对线上站点做完整功能验收；
- 不包含安全渗透、性能测试。
如需完整系统评估，需要代码审查 + 本地 / 线上功能测试。
