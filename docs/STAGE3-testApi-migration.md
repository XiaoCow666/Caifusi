# STAGE3：testApi.js 探针收敛与 CORS 探针核实

> 对应阶段 3 Backlog 项「testApi.js 迁移或下线」（记于 `一个小问题.md` §5.1 范围口径声明的跟进项）。
> 变更文件：`src/utils/testApi.js`、新增 `src/utils/testApi.test.js`、本文件。

## 一、背景

阶段 2（PR #3，refactor/api-request-unify）把 `src/services/api.js` 收敛到 axios 实例，
但 PR 描述与复审记录中明确列为**范围外残留**：

> `src/utils/testApi.js`（dev 调试工具，被 `index.js` 副作用引入；靠原生 fetch 探测 CORS
> 响应头属刻意设计）：保留 3 处 `fetch(` + `http://localhost:5001`

`src/utils/testApi.js` 由 [src/index.js](../src/index.js) 第 7 行副作用引入，是 `src/` 内
**最后一处**绕过 api 层的请求代码：自带 `API_BASE_URL = 'http://localhost:5001'`，
与 axios 实例的配置源（`REACT_APP_API_URL`）不同步。

其中「靠原生 fetch 探测 CORS 响应头」是否成立，不能靠推断——本阶段用真实浏览器实测。

## 二、变更范围

| 文件 | 变更 | 说明 |
|---|---|---|
| `src/utils/testApi.js` | 改写 | 3 个探针全部改走 `apiService`；删除自带 baseURL 与原生 fetch；`testCORS` 判据改为「真实跨源请求是否被放行」 |
| `src/utils/testApi.test.js` | 新增 | 15 条用例，锁定委托关系、错误归一化契约与「无原生 fetch」回归锁 |
| `docs/STAGE3-testApi-migration.md` | 新增 | 本文件（证据与口径） |

未改动：`src/index.js`（仍按原样副作用引入）、`src/services/api.js`、`src/setupProxy.js`、
后端任何文件。

## 三、事实与证据

### 3.1 事实 A：浏览器内读不到 CORS 响应头（真实浏览器实测）

**对真实后端的实测结果**（后端 = `backend/run.py`，`DB_TYPE=memory`；页面宿主 3000 与后端 5001 跨源）：

以改动前的 `testCORS()` 逻辑逐字复刻执行：

```
page_origin                    = "http://localhost:3000"
OLD_testCORS_vs_real_backend   = {"status":200, "ok":true,
                                  "allowOrigin":null, "allowMethods":null, "allowHeaders":null,
                                  "corsResult":"success"}
NEW_probe_reachability         = {"reachable":true, "status":200}
```

即：旧实现 `r.ok === true` → 返回 `status:'success'`，而它要探测的三个响应头**全部为 `null`**。
该函数在真实后端下**恒返回「成功 + 三个 null」**，无法实现其存在目的。

**对照实验（定位根因）**——三个模拟后端，页面用同一段旧探针代码请求：

| 后端配置 | `allowOrigin` | `allowMethods` | `allowHeaders` |
|---|---|---|---|
| ① 同真实后端：设 ACAO/ACAM/ACAH，**无** `Access-Control-Expose-Headers` | `null` | `null` | `null` |
| ② 完全无 CORS 头 | 请求被浏览器拦截（`TypeError: Failed to fetch`） | — | — |
| ③ 设 ACAO/ACAM/ACAH **且**加 `Access-Control-Expose-Headers` | `http://localhost:3000` | `GET,POST,PUT,DELETE,OPTIONS` | `Content-Type,Authorization` |

**根因（实测）**：不是「用没用 fetch」，而是后端未返回 `Access-Control-Expose-Headers`。
`Access-Control-Allow-*` 不在 CORS-safelisted response header 白名单内；跨源时 JS 可读的响应头
实测只有 `["content-type"]`。

### 3.2 事实 B：`Origin` 请求头脚本设不了

旧实现写的是 `headers: { 'Origin': window.location.origin }`。实测把该值伪造成
`http://evil.example`（并以 `X-Probe-Origin` 回显对照），后端实际收到：

```
receivedOrigin            = "http://localhost:3000"   ← 浏览器真实来源，未被脚本改写
receivedCustomOriginHeader = null                      ← 自定义头被丢弃（未列入 allow_headers）
```

`Origin` 属 Fetch 规范的 **forbidden request header**，脚本设置会被浏览器静默丢弃。
该行是**无效代码**：即使删掉，浏览器发出的 `Origin` 也完全一样。

### 3.3 事实 C：真实后端确实未设 `Access-Control-Expose-Headers`

`backend/app/__init__.py` 的 `flask_cors` 配置只有 `origins` / `methods` /
`allow_headers` / `supports_credentials`，无 `expose_headers`；实跑后端 `/api/health`
响应头亦仅有 `Access-Control-Allow-Origin` 与 `Access-Control-Allow-Credentials`。

### 3.4 事实 D：探针载荷字段名与真实链路不一致

- App 内聊天链路发送 `user_id`（[src/pages/CoachChat.js](../src/pages/CoachChat.js) 第 204 行）
- 后端读取 `data.get('user_id', 'default_user')`（`backend/app/services/zhipuai_service.py` 第 63 行）
- 而旧探针发送的是 `userId` → 后端取不到，落到 `default_user`

本次一并改为 `user_id`（见「变更清单」commit 2）。

### 3.5 复现命令

```bash
# 1) 启动真实后端（另开一个终端；DB_TYPE 默认 memory，无需 MySQL）
cd backend && DB_TYPE=memory python run.py        # 监听 :5001

# 2) 起页面宿主 + 结果回传（3000），页面内执行改动前的 testCORS 逻辑
node repro-cors.js                                 # 脚本见下方附录

# 3) 用无头浏览器打开页面（Windows 示例）
"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
  --headless=new --disable-gpu --user-data-dir=./edge-tmp \
  --virtual-time-budget=15000 http://localhost:3000/
# 结果由页面 POST 回 /report，打印在 repro-cors.js 的控制台
```

对照实验（3.1 表格的 ①②③）把 `repro-cors.js` 中的三个后端端口换成模拟服务即可，
配置差异仅为是否返回 `Access-Control-Expose-Headers`。

## 四、事实 / 推断边界

**属于事实（本次实测或代码可查）**

- 旧 `testCORS()` 对真实后端返回 `status:'success'` 且三个响应头均为 `null`（3.1，实跑）
- 加 `Access-Control-Expose-Headers` 后同一段代码可读到三个响应头（3.1 对照③，实跑）
- 跨源时脚本可读响应头只有 `content-type`（3.1，实跑）
- 脚本设置 `Origin` 不生效（3.2，实跑）
- 真实后端未配置 `expose_headers`（3.3，代码 + 响应头）
- 后端读 `user_id`、App 发 `user_id`、旧探针发 `userId`（3.4，代码）

**属于推断（未直接实测，仅供判断）**

- 「因此任何开发者在本地跑 `testApi.testCORS()` 都会看到全部为 null」——本次是在
  **无头 Edge + 本机后端**上复现的，未在 Chrome/Firefox 或远程部署环境逐一验证；
  该结论由「浏览器实现同一规范」推出，未跨浏览器取证。
- 旧实现是否曾短暂可用——若历史某版本后端配过 `expose_headers`，则该探针曾读到值。
  当前仓库内无此配置，历史情况未追溯。
- 本次未评估 `testApi.js` 是否应从生产 bundle 中剔除（见「六、未决事项」）。

## 五、变更清单与验收

**commit 1**（收敛）：三探针改走 `apiService`，删除自带 baseURL 与原生 fetch；
`testCORS` 判据改为浏览器是否放行真实跨源请求（`reachable`），并显式说明
「CORS 被拦截」与「后端未启动」在浏览器侧同样表现为无响应、**不可区分**。

**commit 2**（载荷字段名）：`userId` → `user_id`（3.4）。

**commit 3**（文档）：本文件。

验收结果：

| 项 | 命令 | 结果 |
|---|---|---|
| 测试通过 | `CI=true npm test -- --watchAll=false` | 3 suites / **53 passed**（新增 15 条；基线 38 条） |
| 构建通过 | `CI=true npm run build` | `Compiled successfully.`，退出码 0（lint 无告警） |
| 回归锁有效（非恒真） | 把改动前文件临时放回 `src/utils/testApi.js` 后跑测试 | **13 failed / 2 passed**，随后还原 |
| 生产产物已收敛 | 在 `build/static/js/main.*.js` 中检索特征串 | 旧串 `请求URL`/`CORS响应`/`allowMethods`/`allowOrigin` **均 0**；新串 `测试跨源`/`跨源请求已被`/`请求未获响应` **各 1**；正向对照 `发送数据` **1**（证明检索方法有效） |
| src 内无原生 fetch | `git grep -n "fetch(" -- 'src/**'` | 全仓 6 处命中**全部位于注释 / 测试名文字**（api.js 3、testApi.js 1、testApi.test.js 2），**代码 0 处** |

> 回归锁说明：`testApi.test.js` 中的「源码代码段不含 fetch(」断言使用按字符扫描
> 的去注释实现（保留字符串字面量）。**不能**用 `replace(/\/\/.*$/gm,'')` 这类朴素正则——
> 它会把 `'http://localhost:5001'` 从 `//` 处截断，导致断言在旧实现上也是 0 命中（恒真）。
> 该实现已在改动前文件上验证：fetch 3 处 / localhost 1 处 / `http://` 1 处，均能命中。

## 六、未决事项（留给维护者决策，本 PR 未改）

1. **是否把 `testApi.js` 移出生产 bundle**：`src/index.js` 第 7 行无条件副作用引入，
   生产包内亦会挂载 `window.testApi`。本次仅收敛其请求方式，**未改引入方式**
   （属构建/发布行为变更，按约定不擅自修改）。若需下线，改 `index.js` 为
   `if (process.env.NODE_ENV !== 'production') require('./utils/testApi')` 即可。
2. **`src/setupProxy.js`** 仍保留 `http://localhost:5001` —— 它是 CRA dev-server 代理
   基建，不随前端产物发布，且其 `Access-Control-Allow-Origin: '*'` 只作用于 dev 代理层。
3. **后端是否补 `Access-Control-Expose-Headers`**：若希望前端能读取 CORS 响应头
   （例如做更细的诊断），需在后端 `flask_cors` 配置加 `expose_headers`。这属后端
   跨域策略变更，按约定不擅自修改。
4. **`testCORS` 的定位**：收敛后它与 `checkHealth` 共用同一请求，差别只在语义
   （`reachable` + CORS 说明）。若认为冗余，可选择下线该函数——本次保留以维持
   控制台 API 名称不变。

## 七、风险与回滚

- **风险等级：低。** 改动仅限一个 dev 调试工具及其测试；App 运行时链路
  （`CoachChat.js` 等）不引用本文件，`status:'error'` 的错误归一化行为保持
  「只报错、不抛错」契约不变。
- **行为差异（需知悉）**：① `testCoachChat()` 成功时返回值由后端原始响应体变为
  `{ reply }`（即 `apiService.sendMessageToCoach` 的既有契约，也正是 App 实际拿到的东西）；
  ② `testCORS()` 返回结构由 `{status, allowOrigin, allowMethods, allowHeaders}` 变为
  `{status, reachable, message, data?, code?}`——旧结构的三个字段恒为 `null`（见 3.1），
  保留即为保留误导。两者均只影响开发者在控制台看到的输出。
- **回滚**：`git revert <merge-commit>` 即可；或文件级
  `git checkout <合并前 commit> -- src/utils/testApi.js && rm src/utils/testApi.test.js`。
  各 commit 相互独立，亦可只回滚其中一个。

## 附录：`repro-cors.js`（最小复现）

```js
// 用法：node repro-cors.js  → 另开终端用无头浏览器打开 http://localhost:3000/
// 前置：真实后端已在 :5001 运行（cd backend && DB_TYPE=memory python run.py）
const http = require('http');

const PAGE = `<!doctype html><meta charset="utf-8"><pre id="o">RUNNING</pre>
<script>
var out = [];
// 改动前 src/utils/testApi.js 的 testCORS 逻辑逐字复刻
function oldProbe(base) {
  return fetch(base + '/api/health', {
    method: 'OPTIONS',
    headers: { 'Origin': window.location.origin },   // Origin 是 forbidden header，会被丢弃
  }).then(function (r) {
    return { status: r.status, ok: r.ok,
      allowOrigin:  r.headers.get('Access-Control-Allow-Origin'),
      allowMethods: r.headers.get('Access-Control-Allow-Methods'),
      allowHeaders: r.headers.get('Access-Control-Allow-Headers') };
  });
}
oldProbe('http://localhost:5001').then(function (v) {
  out.push('old_testCORS = ' + JSON.stringify(v));
  document.getElementById('o').textContent = out.join('\\n');
  return fetch('/report', { method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lines: out }) });
});
</script>`;

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/report') {
    let b = '';
    req.on('data', (c) => { b += c; });
    req.on('end', () => {
      console.log(JSON.parse(b).lines.join('\n'));
      res.writeHead(204); res.end();
    });
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(PAGE);
}).listen(3000, () => console.log('page server on :3000'));
```

预期输出（实测）：`old_testCORS = {"status":200,"ok":true,"allowOrigin":null,"allowMethods":null,"allowHeaders":null}`
