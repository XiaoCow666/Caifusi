# 财赋思 AI金融心智教练应用

## 项目简介

财赋思是一款基于人工智能的金融心智教练应用，旨在帮助用户培养健康的金钱观念，提升个人财务管理能力，并获得个性化的理财建议。应用通过问卷评估和智能对话，为用户提供量身定制的财务指导。

## 技术架构

本应用采用前后端分离架构：

- **前端**：React + Tailwind CSS
- **后端**：Python + Flask
- **AI引擎**：智谱AI GLM-Z1-air大语言模型

## 启动应用

### 方法一：IDE中启动（推荐）

在编辑器或IDE中运行`launcher.py`文件即可一键启动整个应用。

#### VS Code中启动

1. 打开VS Code的运行和调试面板(Ctrl+Shift+D)
2. 从下拉菜单选择以下配置之一：
   - `启动财赋思应用` - 启动完整应用（前端+后端）
   - `仅启动后端` - 只启动后端服务
   - `强制启动 (跳过检查)` - 跳过环境检查，尝试强制启动
3. 点击绿色的运行按钮或按F5

### 方法二：批处理启动

根据需要双击以下批处理文件之一：

- `start.bat` - 启动完整应用
- `start_backend_only.bat` - 仅启动后端服务
- `install_npm.bat` - 打开npm安装指南（如果未安装npm）

### 方法三：命令行启动

使用Python直接运行启动器，可以添加不同的命令行参数：

```bash
# 启动完整应用
python launcher.py

# 仅启动后端服务
python launcher.py --backend-only

# 跳过环境检查强制启动
python launcher.py --skip-checks

# 打开npm安装指南
python launcher.py --install-guide
```

### 方法四：分别启动前后端

如果需要分别控制前后端，可以使用以下方式：

1. **启动后端**：

```bash
cd 项目目录路径
python -m backend.run_dev
```

2. **启动前端**：

```bash
cd 项目目录路径/frontend
npm start
```

## 访问应用

应用启动后，可通过以下地址访问：

- **前端页面**：http://localhost:3000
- **后端API**：http://localhost:5001

启动器会自动在浏览器中打开前端页面（如果前端已启动）。

## 常见问题

### 启动失败

如遇启动失败，请尝试：

1. 使用`--backend-only`选项只启动后端
2. 使用`--skip-checks`参数跳过环境检查
3. 检查Python和Node.js是否正确安装
4. 检查端口3000和5001是否被占用

### npm缺失

如果系统中没有安装npm：

1. 运行`install_npm.bat`或使用`python launcher.py --install-guide`打开npm安装指南
2. 按照指南安装Node.js和npm
3. 或者使用`--backend-only`选项只启动后端服务

### 中文显示乱码

如遇中文显示乱码问题，可尝试：

1. 在命令行中设置UTF-8编码：`chcp 65001`
2. 确保系统默认编码为UTF-8

## 项目结构

```
caifusi_project/
├── frontend/            # 前端React应用
├── backend/             # 后端Flask应用
│   ├── app/             # 主应用模块
│   │   ├── routes/      # API路由
│   │   ├── services/    # 服务层
│   │   └── config.py    # 配置文件
│   └── run_dev.py       # 开发环境启动脚本
├── launcher.py          # 一键启动器(推荐)
├── start.bat            # 批处理启动文件
├── start_backend_only.bat # 仅启动后端的批处理文件
├── install_npm.bat      # npm安装指南批处理文件
├── npm_install_guide.md # npm安装指南
└── .vscode/             # VS Code配置
    └── launch.json      # VS Code启动配置
```

## 依赖项

- Python 3.8+
- Node.js 14+和npm 6+（可选，仅前端需要）

## 功能特点

- **金融心智评估**：科学评估用户当前的金融知识、理财能力和行为习惯
- **AI金融教练**：与AI教练进行个性化对话，获取金融建议和指导
- **个人财务仪表盘**：可视化展示财务状况，跟踪财务目标进度

## 本地开发环境搭建

### 前置需求

- Python 3.8+
- Node.js 14+
- npm 6+
- 可选：Firebase 账号（用于生产环境，本地开发模式不需要）

### 安装依赖

#### 后端

```bash
cd backend
pip install -r requirements.txt
```

#### 前端

```bash
cd frontend
npm install
```

### 启动应用

在Windows系统中，直接在项目根目录双击 `start_app.bat` 可一键启动前后端服务。

#### 手动启动

如果需要分别启动前后端，可以按照以下步骤操作：

1. **启动后端服务**

```bash
cd backend
set DEV_MODE=true
python run_dev.py
```

2. **启动前端服务**

```bash
cd frontend
npm start
```

### 测试API连接

应用启动后，可以在浏览器控制台中测试API连接：

```javascript
// 检查API健康状态
testApi.checkHealth()

// 测试AI教练对话
testApi.testCoachChat()
```

## 开发模式说明

- 在开发模式下（DEV_MODE=true），系统不需要Firebase配置即可运行
- 开发模式下的用户认证通过localStorage模拟，无需后端数据库支持
- API请求默认通过`http://localhost:5001/api`路由转发

## 常见问题解决

- **前端显示"Not Found"错误**：确保后端已启动并在正确端口（5001）运行
- **AI教练不回复**：检查控制台网络请求，确认请求到达后端且未报错
- **跨域问题**：检查后端CORS配置和前端proxy设置是否正确

## 技术栈

- **前端**：React, React Router, Tailwind CSS
- **后端**：Python Flask
- **AI模型**：Google Gemini 2.5 Flash

## 项目概述

"财赋思"是一款专注于提升用户金融心智、培养健康理财习惯的AI驱动型个性化教练应用。与传统记账或理财产品推荐工具不同，"财赋思"的核心在于"心智教练"。它结合行为金融学理论与人工智能技术，帮助用户识别并克服常见的金融认知偏差（如损失厌恶、从众心理、过度自信等），建立科学的理财观念，从而做出更明智的金融决策，实现个人财务健康和目标。

## 目标用户

- 在校大学生及初入职场的年轻人：缺乏理财经验，需要建立正确的金钱观和理财方法
- 对理财有兴趣但感到迷茫的普通投资者：希望系统学习理财知识，改善投资行为
- 希望改善消费习惯、实现储蓄目标的个人

## 项目架构

本项目采用前后端分离的架构：

- **后端**：Python Flask API服务
- **前端**：React.js Web应用
- **数据库**：Firebase Firestore
- **AI引擎**：Google Gemini API

## 核心功能

1. **智能心智评估**：评估用户当前的金融知识水平、风险偏好、消费习惯以及潜在的金融认知偏差
2. **AI教练互动**：用户可以像与真人教练一样，通过文本与AI教练交流，获取金融知识指导
3. **个性化成长路径**：根据评估结果和用户目标，规划清晰的学习和实践路径
4. **金融心智工具箱**：提供实用工具，帮助用户在实践中应用所学
5. **知识库与案例学习**：结构化的金融知识和案例分析

## 项目团队

- **计算机学院**：负责应用架构设计、前后端开发、AI模型集成
- **金融学院**：负责金融知识体系构建、金融心智辅导内容设计
- **机电工程学院**：负责用户体验设计、系统流程优化

## 项目愿景

赋能每一位用户，使其拥有清晰的财富思维，成为自己财务生活的主人。 