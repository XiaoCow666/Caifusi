/**
 * api.js 请求服务层回归测试（STAGE3-ISSUE-001）
 * ------------------------------------------------------------------
 * 背景：PR #3（refactor/api-request-unify）将 sendMessageToCoach 从内联 fetch
 *       收敛到 axios.create 实例后，复审（codex-pr-review）建议合并前补运行时
 *       回归验证。本文件将该建议固化为可重复执行的 jest 测试（零新增依赖，
 *       使用 react-scripts 自带 jest + jsdom），无需启动后端即可验证：
 *         · 成功包络 → 返回 { reply }
 *         · HTTP 200 + {status:'error'} 包络 → 拒绝并带后端 message（不静默通过）
 *         · HTTP 500 → 保留后端响应体中文 message
 *         · 断网（Failed to fetch）→ 既定中文提示
 *         · 请求拦截器 JWT 头、响应拦截器 401 清 token（既有约定防回归）
 *
 * 运行命令：CI=true npm test -- --watchAll=false（期望 10 passed）
 * 说明：axios 以 jest.mock 整体替换（零网络）；拦截器分支通过捕获注册的
 *       onFulfilled/onRejected 处理器直接驱动，与浏览器行为等价。
 */

// jest.mock 工厂中不能引用外部变量，实例与处理器状态在工厂内部创建后导出
jest.mock('axios', () => {
  const state = {
    requestHandlers: [],
    responseHandlers: [],
  };
  const instance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: (onFulfilled, onRejected) => {
          state.requestHandlers.push({ onFulfilled, onRejected });
          return 0;
        },
      },
      response: {
        use: (onFulfilled, onRejected) => {
          state.responseHandlers.push({ onFulfilled, onRejected });
          return 0;
        },
      },
    },
  };
  return { create: jest.fn(() => instance), __test: state };
});

import axios from 'axios';
import { sendMessageToCoach } from '../services/api';

const { requestHandlers, responseHandlers } = axios.__test;
// 模块加载时 axios.create 已被 api.js 调用一次，捕获返回的实例
const apiInstance = axios.create.mock.results[0].value;

describe('请求拦截器：JWT 认证头（api.js 既有约定防回归）', () => {
  const { onFulfilled } = requestHandlers[0];

  test('无 token 时不添加 Authorization 头', () => {
    localStorage.clear();
    const config = { headers: {} };
    expect(onFulfilled(config)).toBe(config);
    expect(config.headers.Authorization).toBeUndefined();
  });

  test('有 token 时添加 Bearer 头', () => {
    localStorage.setItem('authToken', 'test-token-1');
    const config = { headers: {} };
    onFulfilled(config);
    expect(config.headers.Authorization).toBe('Bearer test-token-1');
  });
});

describe('响应拦截器：401 处理（api.js 既有约定防回归）', () => {
  const { onFulfilled, onRejected } = responseHandlers[0];

  test('2xx 响应原样放行', () => {
    const response = { status: 200, data: { status: 'success' } };
    expect(onFulfilled(response)).toBe(response);
  });

  test('401：清除 authToken 并继续拒绝', async () => {
    const removeSpy = jest.spyOn(Storage.prototype, 'removeItem');
    localStorage.setItem('authToken', 'expired-token');
    const error = { response: { status: 401 } };
    await expect(Promise.resolve(onRejected(error))).rejects.toBe(error);
    expect(removeSpy).toHaveBeenCalledWith('authToken');
  });

  test('非 401 错误（如 500）不清除 token', async () => {
    const removeSpy = jest.spyOn(Storage.prototype, 'removeItem');
    localStorage.setItem('authToken', 'keep-me');
    const error = { response: { status: 500 } };
    await expect(Promise.resolve(onRejected(error))).rejects.toBe(error);
    expect(removeSpy).not.toHaveBeenCalled();
  });
});

describe('sendMessageToCoach（复审建议的运行时分支固化为回归测试）', () => {
  const payload = { message: '你好，请帮我规划财务', userId: 'test-user' };

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('成功包络 {status:success} → 返回 { reply }，请求走 /coach/chat', async () => {
    apiInstance.post.mockResolvedValue({
      data: { status: 'success', reply: '你好，建议先做月度预算' },
    });
    await expect(sendMessageToCoach(payload)).resolves.toEqual({
      reply: '你好，建议先做月度预算',
    });
    expect(apiInstance.post).toHaveBeenCalledWith('/coach/chat', payload);
  });

  test('HTTP 200 + {status:error} 包络 → 拒绝并携带后端 message（不得静默通过）', async () => {
    apiInstance.post.mockResolvedValue({
      data: { status: 'error', message: 'AI教练服务繁忙，请稍后再试' },
    });
    await expect(sendMessageToCoach(payload)).rejects.toThrow(
      'AI教练回复错误: AI教练服务繁忙，请稍后再试'
    );
  });

  test('HTTP 200 + {status:error} 且无 message → 兜底文案「获取回复失败」', async () => {
    apiInstance.post.mockResolvedValue({ data: { status: 'error' } });
    await expect(sendMessageToCoach(payload)).rejects.toThrow('获取回复失败');
  });

  test('HTTP 500 → 保留后端响应体中文 message', async () => {
    apiInstance.post.mockRejectedValue({
      response: { status: 500, data: { message: 'API Key 未配置，请先设置后重试' } },
    });
    await expect(sendMessageToCoach(payload)).rejects.toThrow(
      'AI教练回复错误: API Key 未配置，请先设置后重试'
    );
  });

  test('断网（Failed to fetch）→ 既定中文提示（确认后端服务已启动）', async () => {
    apiInstance.post.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(sendMessageToCoach(payload)).rejects.toThrow(
      '无法连接到AI教练服务，请确认后端服务已启动'
    );
  });
});
