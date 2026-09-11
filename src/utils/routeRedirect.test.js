/**
 * HashRouter 首屏重定向与站内链接契约测试（STAGE5）
 * ------------------------------------------------------------------
 * 背景：接管演练（全新克隆 upstream/main → npm ci → npm test →
 *   CI=true npm run build → 启动后端与前端）中发现两处导航缺陷：
 *     1) src/App.js 的 RedirectHandler 用 react-router 的 location.hash 判断
 *        "地址栏是否带 hash"。HashRouter 下 location.hash 恒为空串，"#/" 与
 *        "无 hash" 无法区分 → 停留 "#/" 时会对同一 URL 反复 window.location.replace；
 *        跳转目标又写死 '/#/'，子路径部署（GitHub Pages /Caifusi/）下会跳出站点。
 *     2) src/pages/info/LegalPage.js "联系客服" 用 <a href="/info/contact">，
 *        整页跳转；子路径部署下该请求会落到站点外 → 404。站内导航应使用
 *        react-router 的 <Link>。
 * 本文件把上述两点固化为可重复执行的断言（零新增依赖，用 react-scripts 自带 jest）。
 *
 * 运行命令：CI=true npm test -- --watchAll=false
 */
import fs from 'fs';
import path from 'path';
import { resolveRedirectTarget } from './routeRedirect';

describe('RedirectHandler：首屏补全 hash 路由的目标解析', () => {
  // 以地址栏 location 的形状构造用例，'hash' 与 react-router 解析结果无关
  const at = (overrides = {}) => ({ pathname: '/', search: '', hash: '', ...overrides });

  test('地址栏已是 #/（HashRouter 解析出的 hash 为空串）→ 不跳转，避免同 URL 反复 replace', () => {
    expect(resolveRedirectTarget('/', at({ hash: '#/' }))).toBeNull();
  });

  test('子路径部署访问 /Caifusi/ → 补全为 /Caifusi/#/，不跳出站点根路径', () => {
    expect(resolveRedirectTarget('/', at({ pathname: '/Caifusi/' }))).toBe('/Caifusi/#/');
  });

  test('本地开发访问 / → 补全为 /#/', () => {
    expect(resolveRedirectTarget('/', at({ pathname: '/' }))).toBe('/#/');
  });

  test('保留查询串：/?from=qr → /?from=qr#/', () => {
    expect(resolveRedirectTarget('/', at({ pathname: '/', search: '?from=qr' }))).toBe('/?from=qr#/');
  });

  test('已在站内其他路由（如 #/login）→ 不跳转', () => {
    expect(resolveRedirectTarget('/login', at({ hash: '#/login' }))).toBeNull();
  });
});

describe('站内链接契约：src 下不使用整页跳转的站内绝对链接', () => {
  // 只扫参与构建的源码：测试文件自身会写出被禁模式作为示例，不参与约定检查
  const collectSourceFiles = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectSourceFiles(full);
      }
      return /\.(js|jsx)$/.test(entry.name) && !/\.test\.js$/.test(entry.name) ? [full] : [];
    });

  test('站内导航统一走 react-router（Link / navigate），绝对 href 只用于站外或锚点', () => {
    const srcDir = path.join(__dirname, '..');
    // href="/..." 为站内绝对路径；href="//..." 是协议相对地址，不在本约定内
    const absoluteInternalHref = /href="\/(?!\/)/;
    const offenders = collectSourceFiles(srcDir)
      .filter((file) => absoluteInternalHref.test(fs.readFileSync(file, 'utf8')))
      .map((file) => path.relative(srcDir, file));

    expect(offenders).toEqual([]);
  });
});
