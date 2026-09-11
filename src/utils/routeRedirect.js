/**
 * HashRouter 首屏重定向目标解析
 * ------------------------------------------------------------------
 * 背景：src/index.js 使用 <HashRouter>，路由的真实来源是地址栏 hash。
 *   react-router 解析出的 location 在地址栏为 "#/" 与"完全没有 hash"两种情况下
 *   都是 { pathname: '/', hash: '' }，二者无法用 location.hash 区分；同时 GitHub
 *   Pages 等子路径部署（https://host/Caifusi/）下，跳转目标写死根路径 '/#/'
 *   会跳出站点。
 *
 * 结论：判断"地址栏是否已带 hash"必须读 window.location.hash；跳转目标必须保留
 *   当前路径前缀。这里把判断抽成纯函数，便于用 jest 固定行为（零新增依赖）。
 */

/**
 * 解析是否需要把地址栏补全为 hash 根路由。
 *
 * @param {string} routerPathname react-router（HashRouter）解析出的 pathname
 * @param {{ pathname: string, search: string, hash: string }} windowLocation 地址栏 location
 * @returns {string|null} 需要跳转时返回目标 URL；无需跳转返回 null
 */
export function resolveRedirectTarget(routerPathname, windowLocation) {
  // 只有停留在应用根路由时才考虑补全 hash
  if (routerPathname !== '/') {
    return null;
  }

  // 地址栏已经带 hash（例如 "#/" 或 "#/login"）说明路由格式正确，不再跳转。
  // 注意：这里不能用 react-router 的 location.hash——HashRouter 下它恒为空串，
  // 会把 "#/" 误判成"没有 hash"，对同一个 URL 反复 replace。
  if (windowLocation.hash) {
    return null;
  }

  // 保留当前路径与查询串：子路径部署下目标应为 "/Caifusi/#/"，
  // 而不是站点根路径 "/#/"。
  return `${windowLocation.pathname}${windowLocation.search}#/`;
}
