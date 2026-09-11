/**
 * ============================================================
 * 财赋思前端 HTTP 请求服务层（api.js）使用规范
 * ============================================================
 *
 * 【唯一正确用法】所有 HTTP 请求必须统一走下方 axios.create() 创建的 api 实例，
 *   但该实例仅供本文件内部使用（模块私有、未 export，外部 import 会构建报错）：
 *     外部调用只能 import 本文件具名导出函数，或默认导出 apiService（文件底部已聚合全部接口）：
 *       import apiService, { sendMessageToCoach } from '../services/api';
 *       const res = await apiService.loginUser({ email, password });
 *     新增接口 = 在本文件内按下文【新增接口规范】模板新写封装函数后具名导出；
 *     下文示例中的 api.xxx() 均指本文件内部写法。
 *
 * 【强制禁止】❌ 不要在本项目任何 .js/.jsx 文件中新写原生 fetch() 或新的 fetch 封装！
 *     错误写法：fetch('http://localhost:5001/api/xxx', {...})  ← 会造成配置不同步
 *     替代写法：await api.post('/xxx', body) / await api.get('/xxx')
 *
 * 【路径规则】api 实例的 baseURL 已含 /api（见 API_BASE_URL），请求 path 一律不带 /api：
 *     api.post('/coach/chat')          ✅
 *     api.post('/api/coach/chat')      ❌ 会得到 /api/api/coach/chat
 *
 * 【业务包络】后端接口"成功/失败"统一约定（新增封装前以 backend/app/routes/*.py
 *   实际实现为准，勿凭猜测）：
 *   · 失败信号一律走 HTTP 状态码：非 2xx（400/401/404/500…）由 axios 抛错进入响应
 *     拦截器，调用方 catch 中从 error.response.data.message 取后端中文提示；
 *   · 2xx 响应体形状按接口分组：
 *       - /coach/chat：2xx 返回 { status:'success', reply } 包络。sendMessageToCoach
 *         保留"HTTP 200 但 status !== 'success' 即抛错"的防御分支（防网关吞错/接口变更，
 *         见其实现注释）；
 *       - /dashboard/*：2xx 恒为 { status:'success', ... } 包络（overview 等 GET 带
 *         data；goals 写操作 201/200 带 message ± data）。业务失败一定以 400/401/500
 *         表达、不会随 2xx 出现 → 封装层（getDashboardOverview 等）原样透传整个响应体，
 *         由调用方按需取 .data，**不要再加 status 校验**（对当前后端属不可达分支，
 *         透传语义已由 api.test.js 契约用例锁定）；
 *       - /assessment/*、/auth/*：2xx 为普通 JSON（无 status 包络），失败 4xx/5xx。
 *
 * 【全局配置位置】公共配置统一修改下方 axios.create() 参数块与拦截器，改 1 处全局生效：
 *     - baseURL：API_BASE_URL（本地开发 = http://localhost:5001/api；GitHub Pages /
 *       自定义域名走 REACT_APP_API_URL）
 *     - JWT 认证头：请求拦截器（localStorage 读取 authToken）
 *     - 401 登出 / 统一错误文案：响应拦截器（当前仅处理 401；如需超时/重试统一加在这里）
 *
 * 【新增接口规范】新增接口调用按以下模板写（对齐 submitAssessment 风格）：
 *     export const getXxxData = async (params) => {
 *       const res = await api.get('/xxx/data', { params }); // path 不拼 /api
 *       return res.data;
 *     };
 *   ⚠️ 本模板适用于"失败走 HTTP 状态码"的后端接口（后端现状即如此）；仅当目标接口
 *     实现/网关存在"HTTP 200 + {status:'error'}"的可能（目前仅 /coach/chat 因历史
 *     网关场景保留防御校验，写法见 sendMessageToCoach）时才需补 status 校验分支；
 *     不要仅凭旧版注释给 /dashboard/* 等接口添加 status 校验（对本后端不可达）。
 *
 * 【历史说明】本文件曾存在 fetchApi() 原生 fetch 封装（全仓 0 调用死代码）与
 *             sendMessageToCoach 内联 fetch（硬编码 localhost + '/api/coach/chat' 路径），
 *             已于 STAGE2-ISSUE-001 PR（refactor/api-request-unify 分支）迁移删除。
 *             如发现代码中仍残留 fetch( 关键字或新写的 fetch 封装，请提 Issue 或直接发 PR
 *             迁移到 axios 实例。
 * ============================================================
 */
import axios from 'axios';

// 这里是API服务模块，用于处理与后端的通信

// 检查是否在GitHub Pages环境
const isGitHubPages = window.location.hostname === 'xiaocow666.github.io';

// 默认的API基础URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 
                    (isGitHubPages ? 
                     'https://你的API服务器地址' : 'http://localhost:5001/api');

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证令牌
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理401错误 (未认证)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      // 可以在这里添加重定向到登录页的逻辑
    }
    return Promise.reject(error);
  }
);


// 示例：注册用户
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('注册失败:', error);
    throw error;
  }
};

// 示例：用户登录
export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
};

// 提交问卷结果
export const submitAssessment = async (userId, assessmentData) => {
  try {
    const response = await api.post(`/assessments/${userId}`, { 
      assessmentData 
    });
    return response.data;
  } catch (error) {
    console.error('提交问卷失败:', error);
    throw error;
  }
};

// 用户信息相关
export const fetchUserProfile = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 评估相关
export const fetchAssessmentResults = async (userId) => {
  try {
    const response = await api.get(`/assessments/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * 向AI教练发送消息并获取回复
 * @param {object} data - 包含消息内容、用户ID、聊天历史和评估结果的对象
 * @returns {Promise} 返回AI回复
 */

export const sendMessageToCoach = async (data) => {
  try {
    // 统一走 axios.create 实例 api：自动继承 baseURL（已含 /api，路径不再拼 /api）、拦截器等全局配置
    const response = await api.post('/coach/chat', data);
    const result = response.data;

    // 后端返回 success/error 业务包络：不能仅凭 HTTP 200 判定成功
    if (result.status === 'success') {
      return { reply: result.reply };
    }

    // HTTP 200 但业务包络为 error（防御未来网关吞错 / 接口变更）
    throw new Error(result.message || '获取回复失败');
  } catch (error) {
    console.error('AI教练请求错误:', error);

    // 优先取后端 4xx/5xx 响应体中的中文 message（axios 错误对象自带 error.response），兜底取错误信息
    const errorMsg =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      'AI教练暂时无法回复，请稍后再试';

    // 网络错误 / 后端未启动：与旧实现文案语义一致
    if (
      errorMsg.includes('无法连接到服务器') ||
      errorMsg === 'Failed to fetch' ||
      errorMsg === 'Network Error'
    ) {
      throw new Error('无法连接到AI教练服务，请确认后端服务已启动');
    }

    throw new Error(`AI教练回复错误: ${errorMsg}`);
  }
};

// 系统健康检查
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Dashboard API
export const getDashboardOverview = async () => {
  try {
    const response = await api.get('/dashboard/overview');
    return response.data;
  } catch (error) {
    console.error('获取Dashboard概览失败:', error);
    throw error;
  }
};

export const getFinancialHealth = async () => {
  try {
    const response = await api.get('/dashboard/financial-health');
    return response.data;
  } catch (error) {
    console.error('获取财务健康度失败:', error);
    throw error;
  }
};

export const getUserGoals = async (status = null) => {
  try {
    const params = status ? { status } : {};
    const response = await api.get('/dashboard/goals', { params });
    return response.data;
  } catch (error) {
    console.error('获取用户目标失败:', error);
    throw error;
  }
};

export const createGoal = async (goalData) => {
  try {
    const response = await api.post('/dashboard/goals', goalData);
    return response.data;
  } catch (error) {
    console.error('创建目标失败:', error);
    throw error;
  }
};

export const updateGoal = async (goalId, updates) => {
  try {
    const response = await api.put(`/dashboard/goals/${goalId}`, updates);
    return response.data;
  } catch (error) {
    console.error('更新目标失败:', error);
    throw error;
  }
};

export const deleteGoal = async (goalId) => {
  try {
    const response = await api.delete(`/dashboard/goals/${goalId}`);
    return response.data;
  } catch (error) {
    console.error('删除目标失败:', error);
    throw error;
  }
};

export const getRecommendations = async () => {
  try {
    const response = await api.get('/dashboard/recommendations');
    return response.data;
  } catch (error) {
    console.error('获取建议失败:', error);
    throw error;
  }
};

// Assessment API (新增)
export const submitAssessmentNew = async (assessmentData) => {
  try {
    const response = await api.post('/assessment/submit', { assessment: assessmentData });
    return response.data;
  } catch (error) {
    console.error('提交评估失败:', error);
    throw error;
  }
};

export const getLatestAssessment = async () => {
  try {
    const response = await api.get('/assessment/latest');
    return response.data;
  } catch (error) {
    console.error('获取最新评估失败:', error);
    throw error;
  }
};

export const getAssessmentHistory = async () => {
  try {
    const response = await api.get('/assessment/history');
    return response.data;
  } catch (error) {
    console.error('获取评估历史失败:', error);
    throw error;
  }
};

// 导出API服务
const apiService = {
  loginUser,
  registerUser,
  fetchUserProfile,
  fetchAssessmentResults,
  submitAssessment,
  sendMessageToCoach,
  checkHealth,
  // Dashboard APIs
  getDashboardOverview,
  getFinancialHealth,
  getUserGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  getRecommendations,
  // Assessment APIs
  submitAssessmentNew,
  getLatestAssessment,
  getAssessmentHistory
};

export default apiService;