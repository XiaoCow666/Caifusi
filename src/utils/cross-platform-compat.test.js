/**
 * package.json start 脚本跨平台兼容回归测试
 * ------------------------------------------------------------------
 * 背景：原 start 脚本使用 Windows CMD 专有语法：
 *   "set WDS_SOCKET_HOST=localhost&&set HOST=0.0.0.0&&..."
 * 在 macOS/Linux 的 bash 中，`set` 是 shell 内置命令（用于设置 shell 选项），
 * 不会设置环境变量；`&&` 连接后 react-scripts 仍会启动，但 HOST /
 * DANGEROUSLY_DISABLE_HOST_CHECK 均未生效，导致：
 *   1. 开发服务器只绑定 localhost，局域网设备无法访问；
 *   2. 访问非 localhost 域名时收到 "Invalid Host header"。
 *
 * 修复：将环境变量移至 .env.development，start 脚本简化为纯 `react-scripts start`。
 * 本测试固化两个契约：
 *   1. start 脚本不含 Windows CMD `set` 语法；
 *   2. .env.development 存在且包含三个必要变量。
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
