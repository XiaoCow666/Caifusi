/**
 * package.json start 脚本跨平台兼容回归测试
 * ------------------------------------------------------------------
 * 背景：原 start 脚本使用 Windows CMD 专有语法：
 *   "set WDS_SOCKET_HOST=localhost&&set HOST=0.0.0.0&&..."
 *
 * CMD 与 POSIX shell 的区别：
 *   - Windows CMD：`set VAR=value` 是内置命令，设置当前 shell 的环境变量，
 *     后续 `&&` 连接的进程继承该变量。
 *   - POSIX shell（bash/zsh）：`set` 也是内置命令，但语义是设置 shell 选项
 *     （如 `set -e`），`set VAR=value` 不会设置环境变量。正确语法是
 *     `VAR=value command` 或 `export VAR=value && command`。
 *   因此原脚本在 bash 中：`set WDS_SOCKET_HOST=localhost` 不报错但无效，
 *   `&&` 后 react-scripts 仍启动，然而 HOST / DANGEROUSLY_DISABLE_HOST_CHECK
 *   均未生效——开发服务器绑定 localhost，访问局域网 IP 时收到
 *   "Invalid Host header"。
 *
 * 修复：将环境变量移至 .env.development。react-scripts（CRA）启动时用
 *   dotenv 加载 .env.development 到 process.env，与 shell 无关。
 *
 * 注意：本测试是静态文本检查，不启动开发服务器，不能证明：
 *   - HOST=0.0.0.0 实际生效
 *   - HMR WebSocket 实际连接正常
 *   这些需在目标操作系统手动运行 npm start 验证。
 */
const fs = require('fs');
const path = require('path');

const pkgPath = path.resolve(__dirname, '..', '..', 'package.json');
const envPath = path.resolve(__dirname, '..', '..', '.env.development');

describe('start 脚本跨平台兼容', () => {
  test('package.json start 脚本不含 Windows CMD set 语法', () => {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const startScript = pkg.scripts.start;

    // bash 中 `set VAR=value` 不会设置环境变量，必须禁止
    expect(startScript).not.toMatch(/(^|\s)set\s+\w+=/);
    // 链式 set&&set 也禁止
    expect(startScript).not.toContain('&&set ');
    // start 脚本应直接调用 react-scripts start
    expect(startScript).toBe('react-scripts start');
  });
});

describe('.env.development 环境变量', () => {
  test('文件存在', () => {
    expect(fs.existsSync(envPath)).toBe(true);
  });

  test('包含 HOST=0.0.0.0', () => {
    const content = fs.readFileSync(envPath, 'utf8');
    expect(content).toMatch(/^HOST=0\.0\.0\.0$/m);
  });

  test('包含 DANGEROUSLY_DISABLE_HOST_CHECK=true', () => {
    const content = fs.readFileSync(envPath, 'utf8');
    expect(content).toMatch(/^DANGEROUSLY_DISABLE_HOST_CHECK=true$/m);
  });

  test('包含 WDS_SOCKET_HOST=localhost', () => {
    const content = fs.readFileSync(envPath, 'utf8');
    expect(content).toMatch(/^WDS_SOCKET_HOST=localhost$/m);
  });
});
