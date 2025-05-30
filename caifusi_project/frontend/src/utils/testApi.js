/**
 * API测试工具 - 帮助检查前后端连接是否正常
 * 可在控制台运行: testApi.checkHealth() 和 testApi.testCoachChat()
 */

// API基础URL（根据环境自动选择）
const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001';

// 检查健康状态
async function checkHealth() {
  try {
    console.log('测试健康检查API...');
    const url = `${API_BASE_URL}/api/health`;
    console.log('请求URL:', url);
    
    const response = await fetch(url);
    console.log('响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('健康检查API返回错误状态码:', response.status);
      return { status: 'error', code: response.status, message: response.statusText };
    }
    
    const data = await response.json();
    console.log('API健康状态:', data);
    return data;
  } catch (error) {
    console.error('健康检查失败:', error);
    return { status: 'error', message: error.message };
  }
}

// 测试AI教练聊天
async function testCoachChat() {
  try {
    console.log('测试AI教练聊天API...');
    const url = `${API_BASE_URL}/api/coach/chat`;
    console.log('请求URL:', url);
    
    const payload = {
      message: '你好，这是一条测试消息',
      userId: 'test_user'
    };
    console.log('发送数据:', payload);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    console.log('响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('AI教练API返回错误状态码:', response.status);
      return { status: 'error', code: response.status, message: response.statusText };
    }
    
    const data = await response.json();
    console.log('AI教练回复:', data);
    return data;
  } catch (error) {
    console.error('AI教练聊天测试失败:', error);
    return { status: 'error', message: error.message };
  }
}

// 测试CORS配置
async function testCORS() {
  try {
    console.log('测试CORS配置...');
    // 使用OPTIONS请求检测CORS配置
    const url = `${API_BASE_URL}/api/health`;
    console.log('请求URL:', url);
    
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
      }
    });
    
    console.log('CORS响应状态:', response.status);
    console.log('CORS响应头:', {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
    });
    
    return {
      status: response.ok ? 'success' : 'error',
      allowOrigin: response.headers.get('Access-Control-Allow-Origin'),
      allowMethods: response.headers.get('Access-Control-Allow-Methods'),
      allowHeaders: response.headers.get('Access-Control-Allow-Headers'),
    };
  } catch (error) {
    console.error('CORS测试失败:', error);
    return { status: 'error', message: error.message };
  }
}

// 导出测试工具
const testApi = {
  checkHealth,
  testCoachChat,
  testCORS
};

// 在window对象上添加测试工具，方便在浏览器控制台调用
if (typeof window !== 'undefined') {
  window.testApi = testApi;
}

export default testApi; 