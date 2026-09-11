/**
 * testApi.js 探针收敛回归测试（STAGE3 — 阶段3 Backlog「testApi.js 迁移或下线」）
 * ------------------------------------------------------------------
 * 背景：testApi.js 曾是全仓最后一处绕过 src/services/api.js 的请求代码（自带
 *   'http://localhost:5001' + 3 处原生 fetch），与 api.js 头部【强制禁止】冲突。
 * 本文件把「收敛」固化为可重复执行的测试（零新增依赖，react-scripts 自带 jest）：
 *   · 三个探针一律委托 apiService，不再自行发请求
 *   · 探针契约：只报错、不抛错（控制台工具可连续调用）
 *   · 错误归一：优先取后端中文 message，有 HTTP 响应时带 code
 *   · 回归锁：源码代码段（去注释后）不得再出现 fetch( ——防止再次绕过 api 层
 *
 * 运行命令：CI=true npm test -- --watchAll=false
 *
 * 说明：api 层以 jest.mock 整体替换（零网络）；探针是「薄封装」，其行为等价性
 *       由 api.test.js 对 api.js 的契约用例保证，本文件只验证委托与归一化。
 */

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    checkHealth: jest.fn(),
    sendMessageToCoach: jest.fn(),
  },
}));

import fs from 'fs';
import path from 'path';
import apiService from '../services/api';
import testApi from './testApi';

// 探针本身会 console.log/error，测试中静音以免淹没断言输出
// （显式 mockRestore，避免 restoreAllMocks 波及 apiService 的 jest.fn 替身）
let logSpy;
let errorSpy;

beforeEach(() => {
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
  errorSpy.mockRestore();
});

/** 构造「有 HTTP 响应」的错误（axios 4xx/5xx 形态） */
function httpError(status, message) {
  const error = new Error(`Request failed with status code ${status}`);
  error.response = { status, data: { status: 'error', message } };
  return error;
}

describe('模块契约', () => {
  test('默认导出三个探针', () => {
    expect(typeof testApi.checkHealth).toBe('function');
    expect(typeof testApi.testCoachChat).toBe('function');
    expect(typeof testApi.testCORS).toBe('function');
  });

  test('挂载到 window.testApi 供控制台调用', () => {
    expect(window.testApi).toBe(testApi);
  });
});

describe('checkHealth：委托 apiService 且归一化错误', () => {
  beforeEach(() => {
    apiService.checkHealth.mockReset();
  });

  test('成功：原样返回 api 层结果', async () => {
    const body = { status: 'healthy', message: 'API服务正常运行中' };
    apiService.checkHealth.mockResolvedValue(body);

    await expect(testApi.checkHealth()).resolves.toEqual(body);
    expect(apiService.checkHealth).toHaveBeenCalledTimes(1);
  });

  test('4xx/5xx：返回 {status:error, code, message}，message 取后端中文提示', async () => {
    apiService.checkHealth.mockRejectedValue(httpError(500, 'AI教练服务不可用'));

    await expect(testApi.checkHealth()).resolves.toEqual({
      status: 'error',
      code: 500,
      message: 'AI教练服务不可用',
    });
  });

  test('无响应（后端未启动/断网）：无 code 字段，回退到 error.message', async () => {
    apiService.checkHealth.mockRejectedValue(new Error('Network Error'));

    const result = await testApi.checkHealth();
    expect(result).toEqual({ status: 'error', message: 'Network Error' });
    expect(result).not.toHaveProperty('code');
  });

  test('探针契约：api 层抛错时不向上抛', async () => {
    apiService.checkHealth.mockRejectedValue(new Error('boom'));

    await expect(testApi.checkHealth()).resolves.toMatchObject({ status: 'error' });
  });
});

describe('testCoachChat：委托 apiService 且保留载荷形状', () => {
  beforeEach(() => {
    apiService.sendMessageToCoach.mockReset();
  });

  test('成功：载荷字段 user_id 与 App/后端一致，并原样返回 { reply }', async () => {
    apiService.sendMessageToCoach.mockResolvedValue({ reply: '你好！' });

    await expect(testApi.testCoachChat()).resolves.toEqual({ reply: '你好！' });
    // 后端读取的是 user_id（zhipuai_service.py），App 内聊天链路同样发送 user_id；
    // 旧探针写 userId 会被后端忽略而落到 default_user
    expect(apiService.sendMessageToCoach).toHaveBeenCalledWith({
      message: '你好，这是一条测试消息',
      user_id: 'test_user',
    });
  });

  test('失败：不向上抛，归一化为错误对象', async () => {
    apiService.sendMessageToCoach.mockRejectedValue(
      new Error('AI教练回复错误: 请求数据为空')
    );

    await expect(testApi.testCoachChat()).resolves.toEqual({
      status: 'error',
      message: 'AI教练回复错误: 请求数据为空',
    });
  });
});

describe('testCORS：以「请求是否被放行」为判据', () => {
  beforeEach(() => {
    apiService.checkHealth.mockReset();
  });

  test('请求被放行：reachable=true', async () => {
    apiService.checkHealth.mockResolvedValue({ status: 'healthy' });

    await expect(testApi.testCORS()).resolves.toMatchObject({
      status: 'success',
      reachable: true,
    });
  });

  test('无响应（疑似 CORS 拦截 / 后端未启动）：reachable=false 且说明二者不可区分', async () => {
    apiService.checkHealth.mockRejectedValue(new Error('Network Error'));

    const result = await testApi.testCORS();
    expect(result).toMatchObject({ status: 'error', reachable: false });
    expect(result.message).toContain('CORS');
    expect(result.message).toContain('后端未启动');
  });

  test('已被放行但状态码非 2xx：reachable=true 并带 code', async () => {
    apiService.checkHealth.mockRejectedValue(httpError(503, '服务暂不可用'));

    await expect(testApi.testCORS()).resolves.toMatchObject({
      status: 'error',
      reachable: true,
      code: 503,
    });
  });

  test('不再返回 allowOrigin/allowMethods/allowHeaders（浏览器读不到，恒定 null）', async () => {
    apiService.checkHealth.mockResolvedValue({ status: 'healthy' });

    const result = await testApi.testCORS();
    expect(result).not.toHaveProperty('allowOrigin');
    expect(result).not.toHaveProperty('allowMethods');
    expect(result).not.toHaveProperty('allowHeaders');
  });
});

/**
 * 去注释、保留字符串字面量的极简词法扫描（够用即可，不做完整 JS 解析）。
 *
 * 注意：不能用 `src.replace(/\/\/.*$/gm, '')` 这类朴素正则——它会把
 * `'http://localhost:5001'` 从 `//` 处截断成 `'http:`，导致下面的 localhost /
 * http:// 断言在「旧实现」上也是 0 命中，即断言恒真、形同虚设。此处按字符扫描
 * 并跟踪字符串状态，实测可正确识别旧文件（fetch 3 / localhost 1 / http 1）。
 */
function stripComments(src) {
  let out = '';
  let state = 'code'; // code | block | line | string
  let quote = '';
  let i = 0;

  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];

    if (state === 'code') {
      if (c === '/' && next === '*') { state = 'block'; i += 2; continue; }
      if (c === '/' && next === '/') { state = 'line'; i += 2; continue; }
      if (c === "'" || c === '"' || c === '`') { state = 'string'; quote = c; out += c; i += 1; continue; }
      out += c;
      i += 1;
      continue;
    }

    if (state === 'block') {
      if (c === '*' && next === '/') { state = 'code'; i += 2; continue; }
      i += 1;
      continue;
    }

    if (state === 'line') {
      if (c === '\n') { state = 'code'; out += c; }
      i += 1;
      continue;
    }

    // state === 'string'：字符串内容原样保留
    out += c;
    if (c === '\\') { out += next || ''; i += 2; continue; }
    if (c === quote) { state = 'code'; }
    i += 1;
  }

  return out;
}

describe('回归锁：全仓最后一处原生 fetch 已收敛', () => {
  const source = fs.readFileSync(path.join(__dirname, 'testApi.js'), 'utf8');
  // 去掉块注释与行注释，只留代码段（注释中提及 fetch 属背景说明，不计入）
  const code = stripComments(source);

  test('源码代码段不含原生 fetch(', () => {
    expect(code).not.toMatch(/\bfetch\s*\(/);
  });

  test('源码代码段不含硬编码 localhost / http:// 地址', () => {
    expect(code).not.toMatch(/localhost/);
    expect(code).not.toMatch(/https?:\/\//);
  });

  test('三个探针运行时均不触碰全局 fetch', async () => {
    const fetchSpy = jest.fn();
    const originalFetch = global.fetch;
    global.fetch = fetchSpy;

    apiService.checkHealth.mockResolvedValue({ status: 'healthy' });
    apiService.sendMessageToCoach.mockResolvedValue({ reply: 'ok' });

    try {
      await testApi.checkHealth();
      await testApi.testCoachChat();
      await testApi.testCORS();
    } finally {
      global.fetch = originalFetch;
    }

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
