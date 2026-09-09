# 后端最小冒烟测试

这组测试用于确认 Flask App Factory 能创建应用、健康检查可响应，以及阶段一核心蓝图仍然注册成功。它是启动/路由回归门禁，不等同于真实 AI、Firebase、MySQL 或生产部署验证。

## 运行方式

在仓库根目录执行：

```powershell
python -m pip install -r backend/requirements.txt
python -X utf8 -m unittest discover -s backend/tests -v
```

`-X utf8` 用于避免 Windows 默认代码页无法输出启动日志中的 Unicode 符号；它只影响测试进程的文本输出，不改变应用逻辑。

测试默认使用 `DB_TYPE=memory`，不会初始化或写入 MySQL；用例只访问本地 Flask `test_client`，不会调用智谱 AI、Firebase 或外部网络。

如需在 Windows PowerShell 中使用隔离环境，可在仓库根目录执行：

```powershell
$venvPath = Join-Path $env:TEMP "caifusi-backend-smoke-venv"
py -3 -m venv $venvPath
& "$venvPath\Scripts\python.exe" -m pip install -r backend/requirements.txt
& "$venvPath\Scripts\python.exe" -X utf8 -m unittest discover -s backend/tests -v
```

如果系统没有 `py` 启动器，可将创建环境一行替换为 `python -m venv $venvPath`；后续命令仍使用隔离环境中的解释器。

## 当前覆盖

- `GET /api/health` 返回 HTTP 200，且响应状态为 `healthy`；
- 教练、评估和 Dashboard 的核心路由仍由 App Factory 注册，且关键 HTTP 方法仍然存在；
- 应用创建后可以启用 `TESTING` 配置，不要求真实 API Key、Firebase 私钥或数据库凭据。

## 事实边界

测试通过只能证明 App Factory、路由注册和本地健康检查满足当前代码约定，不能证明：

- AI Key 有效或智谱 API 可访问；
- Firebase/MySQL 配置、权限和数据持久化正确；
- 前端页面已经端到端调用这些路由；
- 生产环境的认证、CORS、部署和数据隔离已经完成。

如果依赖未安装，命令会在导入 Flask 阶段失败；这属于环境准备问题，不应记录为业务测试通过。
