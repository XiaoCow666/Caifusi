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
 * 运行命令：CI=true npm test -- --watchAll=false（基线 10 passed；本文件扩展后共
 *           31 条，覆盖 api.js 全部 17 个导出函数——见文末「扩展回归」段）
 * 扩展回归（2026-09-08）：PR #3 只收敛了 sendMessageToCoach；其余导出函数
 *       （auth / user / assessment / dashboard 包装器）的“路径不拼 /api、方法/
 *       载荷透传、失败原样重抛”约定此前零测试固化。扩展段仅锁定现状约定，
 *       不改动任何实现；其中 getDashboardOverview 对 {status} 业务包络的
 *       处理与文件头规范注释存在已知偏差，以单独用例固化现状并标注跟进。
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
import {
  sendMessageToCoach,
  registerUser,
  loginUser,
  submitAssessment,
  fetchUserProfile,
  fetchAssessmentResults,
  checkHealth,
  getDashboardOverview,
  getFinancialHealth,
  getUserGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  getRecommendations,
  submitAssessmentNew,
  getLatestAssessment,
  getAssessmentHistory,
} from '../services/api';

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

/* =====================================================================
 * 扩展回归（STAGE2-ISSUE-001 A5 口径延伸）：其余业务导出函数
 * ---------------------------------------------------------------------
 * 背景：PR #3 只将 sendMessageToCoach 收敛进 axios 实例；其余导出函数
 *      （auth / user / assessment / dashboard 包装器）的既有约定此前
 *      零测试固化。以下用例只“锁定现状约定”，不改动任何实现：
 *        · 请求路径全部走 api 实例且不再拼 /api 前缀（baseURL 已含 /api）
 *        · 方法（POST/GET/PUT/DELETE）与载荷/params 透传正确
 *        · 成功 → response.data 原样返回；失败 → axios 错误原样重抛
 * =================================================================== */

describe('业务导出函数：请求路由与错误语义回归（扩展）', () => {
  const mockPayload = { message: '测试载荷', n: 1 };

  const ROUTE_CASES = [
    // [用例名, 函数, 期望方法, 调用实参, 期望的实例调用（首参=路径，断言不得以 /api 开头）]
    ['registerUser → POST /auth/register', registerUser, 'post', [mockPayload], ['/auth/register', mockPayload]],
    ['loginUser → POST /auth/login（email/password 封装）', loginUser, 'post', ['a@b.c', 'pw'], ['/auth/login', { email: 'a@b.c', password: 'pw' }]],
    ['submitAssessment → POST /assessments/:userId（assessmentData 包一层）', submitAssessment, 'post', ['u-1', mockPayload], ['/assessments/u-1', { assessmentData: mockPayload }]],
    ['fetchUserProfile → GET /users/:userId', fetchUserProfile, 'get', ['u-1'], ['/users/u-1']],
    ['fetchAssessmentResults → GET /assessments/:userId', fetchAssessmentResults, 'get', ['u-1'], ['/assessments/u-1']],
    ['checkHealth → GET /health', checkHealth, 'get', [], ['/health']],
    ['getDashboardOverview → GET /dashboard/overview', getDashboardOverview, 'get', [], ['/dashboard/overview']],
    ['getFinancialHealth → GET /dashboard/financial-health', getFinancialHealth, 'get', [], ['/dashboard/financial-health']],
    ['getUserGoals（无过滤）→ params 传空对象', getUserGoals, 'get', [null], ['/dashboard/goals', { params: {} }]],
    ['getUserGoals(status) → params 透传', getUserGoals, 'get', ['monthly'], ['/dashboard/goals', { params: { status: 'monthly' } }]],
    ['createGoal → POST /dashboard/goals', createGoal, 'post', [mockPayload], ['/dashboard/goals', mockPayload]],
    ['updateGoal → PUT /dashboard/goals/:goalId', updateGoal, 'put', ['g-1', mockPayload], ['/dashboard/goals/g-1', mockPayload]],
    ['deleteGoal → DELETE /dashboard/goals/:goalId', deleteGoal, 'delete', ['g-1'], ['/dashboard/goals/g-1']],
    ['getRecommendations → GET /dashboard/recommendations', getRecommendations, 'get', [], ['/dashboard/recommendations']],
    ['submitAssessmentNew → POST /assessment/submit（assessment 包一层）', submitAssessmentNew, 'post', [mockPayload], ['/assessment/submit', { assessment: mockPayload }]],
    ['getLatestAssessment → GET /assessment/latest', getLatestAssessment, 'get', [], ['/assessment/latest']],
    ['getAssessmentHistory → GET /assessment/history', getAssessmentHistory, 'get', [], ['/assessment/history']],
  ];

  test.each(ROUTE_CASES)('%s', async (_name, fn, method, callArgs, expectedCall) => {
    apiInstance[method].mockResolvedValue({ data: { ok: true } });
    await fn(...callArgs);

    expect(apiInstance[method]).toHaveBeenCalledWith(...expectedCall);
    // 硬约定：路径不得以 /api 开头（axios baseURL 已含 /api，避免 /api/api 复现）
    expect(expectedCall[0].startsWith('/api/')).toBe(false);
  });

  describe('成功/失败语义', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });
    afterEach(() => {
      jest.restoreAllMocks();
      apiInstance.get.mockReset();
      apiInstance.post.mockReset();
    });

    test('GET 成功：response.data 原样透传（fetchUserProfile）', async () => {
      const data = { name: '张三', email: 'a@b.c' };
      apiInstance.get.mockResolvedValue({ data });
      await expect(fetchUserProfile('u-1')).resolves.toEqual(data);
      expect(apiInstance.get).toHaveBeenCalledWith('/users/u-1');
    });

    test('POST 成功：response.data 原样透传（loginUser）', async () => {
      const data = { token: 't-1', user: { uid: 'u-1' } };
      apiInstance.post.mockResolvedValue({ data });
      await expect(loginUser('a@b.c', 'pw')).resolves.toEqual(data);
    });

    test('HTTP 500：错误原样重抛，不吞错不改文案（loginUser / getDashboardOverview）', async () => {
      const err = { response: { status: 500, data: { message: '服务内部错误' } } };
      apiInstance.post.mockRejectedValue(err);
      await expect(loginUser('a@b.c', 'pw')).rejects.toBe(err);

      apiInstance.get.mockRejectedValue(err);
      await expect(getDashboardOverview()).rejects.toBe(err);
    });

    test('现状固化：getDashboardOverview 对 HTTP 200 + {status:error} 业务包络原样透传（不做包络校验）', async () => {
      // ⚠️ 现状记录：文件头规范注释（api.js L23-25）要求 /dashboard/* 校验
      //    {status} 业务包络并抛后端 message，但当前实现尚未执行该校验。
      //    本用例只固化“现状不抛错、原样透传”，防止他人无意识改动语义；
      //    何时按注释补包络校验，需等后端 /dashboard 契约确认后单独跟进。
      const data = { status: 'error', message: '后端业务错误' };
      apiInstance.get.mockResolvedValue({ data });
      await expect(getDashboardOverview()).resolves.toEqual(data);
    });
  });
});
