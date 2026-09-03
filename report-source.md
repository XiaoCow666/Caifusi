# README 包装 Deep Research 内部报告

- 研究对象：`XiaoCow666/Caifusi`、`XiaoCow666/CodeSense`
- 研究日期：2026-09-04（Asia/Shanghai）
- 目标：把两个仓库的 README 变成 GitHub 首屏 onboarding，而不是项目说明的堆叠。
- 受众：第一次访问仓库的使用者、潜在试用者、开发者、教师/学生用户与贡献者。

## 结论摘要

高星项目的共同点不是“写得最长”，而是首屏在几秒内回答四件事：这是什么、为什么值得看、现在如何体验、下一步如何运行。README 的顶部应承载品牌、结果导向的一句话、可验证的入口和真实截图；技术细节、架构与边界随后展开。

本次更新因此采用以下结构：

1. Logo/标题/一句话价值主张。
2. Stars、forks、license、技术栈等动态或低维护成本徽章。
3. 真实本地页面截图和明确的体验入口。
4. 面向不同读者的价值说明、功能地图和快速启动。
5. 架构、限制、安全配置、Star History、贡献与许可证。

## 研究证据

### GitHub 官方规范

- [About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes?apiVersion=2022-11-28)：README 往往是访客首先看到的内容，应解释项目是什么、为什么有用、如何开始、如何获得帮助以及如何维护；GitHub 支持仓库内相对路径引用图片和文档。
- [About wikis](https://docs.github.com/en/communities/documenting-your-project-with-wikis/about-wikis?LanguageId=1)：README 适合快速介绍，较长的参考资料应转移到 wiki/文档体系。
- [Classifying your repository with topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics)：topics 能提升发现性并帮助贡献者理解仓库边界；后续可补齐仓库 topics 和 About 描述。
- [Creating a default community health file](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file)：公开仓库可以用 CONTRIBUTING、SECURITY、SUPPORT、行为准则和 issue 模板标准化协作入口。
- [Configuring a GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site?apiVersion=2022-11-28)：Pages 可以从分支根目录或 `/docs` 发布，也可以迁移到 Actions；这决定了 Caifusi 部署文档采用 `/docs` 静态产物路线并明确后端独立部署。
- [Documentation done right](https://github.blog/developer-skills/documentation-done-right-a-developers-guide/)：文档应按读者任务组织，区分教程、操作指南、解释和参考，而不是把所有内容放进一张长说明页。

### 高星项目样本

抽样阅读了 [FastAPI](https://raw.githubusercontent.com/tiangolo/fastapi/master/README.md)、[Next.js](https://raw.githubusercontent.com/vercel/next.js/canary/packages/next/README.md)、[Supabase](https://raw.githubusercontent.com/supabase/supabase/master/README.md)、[VS Code](https://raw.githubusercontent.com/microsoft/vscode/main/README.md)、[shadcn/ui](https://raw.githubusercontent.com/shadcn-ui/ui/main/README.md)、[system-design-primer](https://raw.githubusercontent.com/donnemartin/system-design-primer/master/README.md) 和 [standard-readme](https://github.com/RichardLitt/standard-readme)。可复用的模式如下：

| 模式 | 证据 | 对本次更新的落地 |
| --- | --- | --- |
| 品牌与价值先于技术细节 | FastAPI、Next.js、Supabase、shadcn/ui 的居中品牌首屏 | 两个仓库增加 Logo/标题/一句话定位和 CTA |
| 截图展示结果而非只列 feature | Supabase、VS Code 将产品界面置于早期位置 | 引入真实的 Caifusi 首页/知识库和 CodeSense 登录/学生/教师页面截图 |
| 快速成功路径 | FastAPI、Next.js 都把安装、第一段代码或文档入口前置 | 两个 README 都把体验入口与最短启动路径前置 |
| 为不同读者分流 | VS Code 区分使用、贡献、开发；standard-readme 强调安装和使用 | 分开产品价值、体验、开发配置、贡献与维护边界 |
| 对限制保持诚实 | 大型项目通常给出支持范围、贡献和安全入口；CodeSense 原文已说明沙箱边界 | 保留 CodeSense 的应用级受限执行说明，并补充 AI/金融场景的边界提示 |
| 长文档分层 | GitHub README/Wiki 官方建议、system-design-primer 的目录化长文模式 | 保留必要架构和安全说明，同时把深层资料链接到仓库已有文档 |

## 项目事实核对

### Caifusi

- React 18 前端，Flask 后端；现有页面包含首页、登录/注册、金融心智评估、AI 教练、Dashboard 和金融知识库。
- 后端开发入口为 `backend/run_dev_enhanced.py`，默认端口 5001；前端由 CRA 启动。
- `src/contexts/AuthContext.js` 当前是开发态 localStorage mock auth；README 不应把它包装成已经完成的生产级账户系统。
- `src/services/api.js` 的线上前端 API 地址仍是占位符；GitHub Pages 应被描述为前端预览，完整 AI 能力需要配置后端 URL 和密钥。
- 已存在品牌 Logo 与营销素材；本次新增/整理了三张真实页面截图到 `assets/readme/`。

### CodeSense

- 现有主 README 已经包含较完整的功能、流程、架构、配置与安全说明；本次重点是首屏包装和真实产品证据，不重复虚构指标。
- 仓库已有 Gunicorn、Systemd、Nginx、数据库维护和健康检查代码入口；本次补充了独立的 [`DEPLOYMENT.md`](CodeSense/DEPLOYMENT.md)，把首次部署、上线验证、更新与排障串起来。
- 公开体验页面可由本地 `run.py` 启动，登录页和学生/教师 demo 路由可复现；截图来自本地实际页面。
- CodeSense README 已明确：C++ 编译需要 g++，执行限制属于应用级防护，不等价于 OS 级隔离；对公网部署仍需容器/VM 等更强隔离。
- 仓库当前没有独立品牌 mark；新增了一个不依赖外部字体或图片的 `docs/assets/codesense-mark.svg`，与现有深色代码视觉保持一致。

## Star History 设计

采用 [Star History](https://star-history.com/) 的动态 SVG，而不是手工写死当前 star 数。两个图表分别指向仓库路径，并链接到可交互历史页：

- `https://api.star-history.com/svg?repos=XiaoCow666%2FCaifusi&type=Date`
- `https://api.star-history.com/svg?repos=XiaoCow666%2FCodeSense&type=Date`

这是展示趋势的轻量方案；它不等同于产品增长分析，后续如需严肃运营数据，应另建 Releases/traffic/活动记录。

## 后续仓库管理建议

本次更新了工作区内 README、部署文档、静态素材和 CodeSense 的 README 资源忽略规则，没有代替用户修改 GitHub 仓库设置或推送远程。发布前建议补齐：仓库 About 描述与 topics、`CONTRIBUTING.md`、`SECURITY.md`、`SUPPORT.md`、Issue/PR 模板、CI 状态徽章，以及定期更新截图和演示地址。

## 来源清单

- GitHub：README、Wiki、topics、community health、repositories 官方文档（上文链接）。
- GitHub Blog：Documentation done right（上文链接）。
- 高星 README：FastAPI、Next.js、Supabase、VS Code、shadcn/ui、system-design-primer、standard-readme（上文链接）。
- 产品事实：本地仓库源码、页面、静态资源、启动结果与仓库公开页面 [Caifusi](https://github.com/XiaoCow666/Caifusi)、[CodeSense](https://github.com/XiaoCow666/CodeSense)。
