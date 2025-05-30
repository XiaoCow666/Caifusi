# Node.js和npm安装指南

本指南将帮助您安装Node.js和npm，这是运行财赋思前端应用所必需的。

## 什么是Node.js和npm?

- **Node.js** 是一个基于Chrome V8引擎的JavaScript运行环境。
- **npm (Node Package Manager)** 是Node.js的包管理工具，用于安装和管理前端依赖。

## 安装步骤

### Windows系统

1. **下载安装包**：
   - 访问Node.js官方网站：[https://nodejs.org/](https://nodejs.org/)
   - 下载推荐的LTS（长期支持）版本
   
2. **安装Node.js**：
   - 运行下载的安装文件（例如：node-v14.xx.x-x64.msi）
   - 按照安装向导的提示完成安装，建议选择默认选项
   - 确保在安装过程中选中"自动添加到PATH"选项

3. **验证安装**：
   - 安装完成后，打开命令提示符（CMD）或PowerShell
   - 输入以下命令检查是否安装成功：
     ```
     node --version
     npm --version
     ```
   - 如果显示版本号，则安装成功

### macOS系统

1. **使用Homebrew安装**（推荐）：
   - 打开终端
   - 如果尚未安装Homebrew，运行：
     ```
     /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
     ```
   - 使用Homebrew安装Node.js：
     ```
     brew install node
     ```

2. **或使用官方安装包**：
   - 访问Node.js官方网站：[https://nodejs.org/](https://nodejs.org/)
   - 下载macOS安装包并运行

3. **验证安装**：
   - 打开终端
   - 运行：
     ```
     node --version
     npm --version
     ```

### Linux系统

#### Ubuntu/Debian：

```bash
# 更新包列表
sudo apt update

# 安装Node.js和npm
sudo apt install nodejs npm

# 验证安装
node --version
npm --version
```

#### CentOS/RHEL/Fedora：

```bash
# 安装Node.js和npm
sudo dnf install nodejs

# 验证安装
node --version
npm --version
```

## 常见问题

### npm命令未找到

如果安装Node.js后，npm命令仍然无法使用，可能是以下原因：

1. **PATH环境变量未正确设置**
   - Windows: 重启计算机或手动添加Node.js安装路径到PATH环境变量
   - Linux/macOS: 确保Node.js安装路径在$PATH中

2. **使用NVM安装的Node.js**
   - 如果使用了Node Version Manager (NVM)，确保使用`nvm use <版本号>`激活正确的版本

### 权限问题

在Linux/macOS中，如果遇到权限错误，可尝试：

```bash
# 修复npm权限问题
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
```

## 后续步骤

安装完Node.js和npm后，返回财赋思应用目录，运行启动脚本：

```bash
python launcher.py
```

启动器将自动检测npm并启动完整应用（前端和后端）。

## 其他资源

- [Node.js官方文档](https://nodejs.org/en/docs/)
- [npm官方文档](https://docs.npmjs.com/) 