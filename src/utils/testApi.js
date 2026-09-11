/**
 * API 测试工具 —— 帮助在浏览器控制台检查前后端连接是否正常
 * ------------------------------------------------------------------
 * 用法（开发时打开 DevTools Console）：testApi.checkHealth() / testApi.testCoachChat() /
 * testApi.testCORS()。三个探针都「只报错、不抛错」，便于连续调用。
 *
 * 【收敛说明】本文件原为全仓最后一处绕过 src/services/api.js 的请求代码：自带
 *   API_BASE_URL = 'http://localhost:5001' 并直接用原生 fetch 请求 3 次，与 api.js
 *   头部【强制禁止】「不要新写原生 fetch()」的约定冲突，且 baseURL 与 axios 实例的
 *   配置源（REACT_APP_API_URL）不同步。现全部改为调用 apiService，请求地址、JWT
 *   认证头、401 处理与全站其它请求完全一致。
 *
 * 【CORS 探针为何不再读响应头】旧实现用 fetch 读 Access-Control-Allow-* 响应头，
 *   实测恒为 null —— 与「用不用 fetch」无关，浏览器根本不允许脚本读取：
 *     1. Origin 属 Fetch 规范的 forbidden request header，脚本设置会被静默丢弃；
 *     2. Access-Control-Allow-* 不在 CORS-safelisted response header 白名单内，
 *        后端（backend/app/__init__.py 的 flask_cors 配置）未返回
 *        Access-Control-Expose-Headers 时脚本一律读不到。
 *   故 testCORS 改为以「真实跨源请求是否被浏览器放行」为判据 —— 浏览器本身就是
 *   CORS 的执行者。需要看具体响应头时请用 DevTools → Network。
 * ============================================================
 */
import apiService from '../services/api';

/**
 * 把 api 层抛出的错误归一为控制台友好的返回值（本模块所有探针都不向上抛错）。
 * 优先取后端响应体的中文 message，其次 axios 错误信息，最后兜底文案。
 *
 * @param {Error} error api 层抛出的错误
 * @returns {{status: 'error', message: string, code?: number}} code 仅在拿到 HTTP 响应时出现
 */
function normalizeError(error) {
  const result = {
    status: 'error',
    message:
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      '未知错误',
  };

  // 仅有 HTTP 响应（4xx/5xx）时才有状态码；网络错误 / 后端未启动时无 response
  if (error.response && error.response.status) {
    result.code = error.response.status;
  }

  return result;
}

// 检查健康状态
async function checkHealth() {
  console.log('测试健康检查API...');

  try {
    const data = await apiService.checkHealth();
    console.log('API健康状态:', data);
    return data;
  } catch (error) {
    console.error('健康检查失败:', error);
    return normalizeError(error);
  }
}

// 测试AI教练聊天
async function testCoachChat() {
  // 与全站一致走 apiService.sendMessageToCoach：请求由 axios 实例发出
  // （baseURL 已含 /api，自动携带 localStorage 中的 authToken）
  const payload = {
    message: '你好，这是一条测试消息',
    userId: 'test_user',
  };
  console.log('发送数据:', payload);

  try {
    console.log('测试AI教练聊天API...');
    // 返回的是 api.js 收敛后的 { reply }，即 App 内聊天链路实际拿到的东西；
    // 业务失败（含 HTTP 200 + {status:'error'} 包络）会在此抛出
    const data = await apiService.sendMessageToCoach(payload);
    console.log('AI教练回复:', data);
    return data;
  } catch (error) {
    console.error('AI教练聊天测试失败:', error);
    return normalizeError(error);
  }
}

/**
 * 跨源（CORS）连通性探测。
 *
 * 判据是「这次真实跨源请求有没有被浏览器放行」，而不是读响应头（见文件头说明）。
 * 注意：浏览器不会告知失败原因，**后端未启动**与**CORS 被拦截**同样表现为
 * 「无响应」，本函数无法区分，需结合 DevTools → Network / Console 判断。
 *
 * @returns {Promise<{status: string, reachable: boolean, message: string, data?: object, code?: number}>}
 */
async function testCORS() {
  console.log('测试跨源（CORS）连通性...');
  console.log('当前页面来源:', window.location.origin);

  try {
    const data = await apiService.checkHealth();
    const result = {
      status: 'success',
      reachable: true,
      message: '跨源请求已被浏览器放行：CORS 配置对当前页面来源有效',
      data,
    };
    console.log('CORS结果:', result);
    return result;
  } catch (error) {
    const normalized = normalizeError(error);

    // 拿到 HTTP 响应 = 请求已被放行，只是状态码非 2xx
    if (error.response) {
      const result = {
        status: 'error',
        reachable: true,
        message: `请求已被放行，但后端返回 HTTP ${error.response.status}：${normalized.message}`,
        code: error.response.status,
      };
      console.log('CORS结果:', result);
      return result;
    }

    // 无 response：浏览器拦截（CORS）或后端未启动，二者不可区分
    const result = {
      status: 'error',
      reachable: false,
      message:
        '请求未获响应：可能被 CORS 拦截，或后端未启动。浏览器不区分二者，' +
        '请在 DevTools → Network 确认；若 Console 出现 CORS 相关报错即为拦截。',
    };
    console.log('CORS结果:', result);
    return result;
  }
}

// 导出测试工具
const testApi = {
  checkHealth,
  testCoachChat,
  testCORS,
};

// 在window对象上添加测试工具，方便在浏览器控制台调用
if (typeof window !== 'undefined') {
  window.testApi = testApi;
}

export default testApi;
