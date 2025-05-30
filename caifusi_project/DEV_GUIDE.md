# 财赋思开发指南

本指南适用于在尚未配置Firebase的情况下，快速启动和测试财赋思项目。

## 开发模式说明

为了方便开发和测试，我们添加了"开发模式"，它具有以下特点：

1. 无需Firebase配置文件即可运行后端
2. 使用内存数据存储代替Firestore数据库
3. 绕过了Firebase身份验证，使用测试用户
4. 直接使用配置的Gemini API密钥
5. 简化了API调用流程

## 快速开始

### 后端设置

1. 进入后端目录：
   ```
   cd caifusi_project/backend
   ```

2. 创建虚拟环境：
   ```
   python -m venv venv
   ```

3. 激活虚拟环境：
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

4. 安装依赖：
   ```
   pip install -r requirements.txt
   ```

5. 运行开发模式服务器：
   ```
   python run_dev.py
   ```
   
   这个脚本会自动设置必要的环境变量，包括开发模式标志和Gemini API密钥。

6. 服务器将在 http://localhost:5001 启动

### 前端设置

1. 进入前端目录：
   ```
   cd caifusi_project/frontend
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 运行开发服务器：
   ```
   npm start
   ```

4. 前端将在 http://localhost:3000 启动

## 登录提示

在开发模式下，后端提供了自动登录机制。无需实际输入用户名和密码。点击登录按钮后，应用会使用测试用户账户自动登录。

## AI教练对话

开发模式下可以直接使用AI教练功能。通过以下页面访问:
- http://localhost:3000/coach

AI教练使用的是Gemini 2.5 Flash模型，配置的API密钥为:
```
AIzaSyBm2js5YYeDyLKPrvU8jHVU9Zo1e1pqhzA
```

## 注意事项

1. 开发模式的数据存储在内存中，服务器重启后所有数据将丢失
2. 这种模式仅用于开发和测试，不应在生产环境中使用
3. 要转换到正式模式，需要配置Firebase并设置相应的环境变量 