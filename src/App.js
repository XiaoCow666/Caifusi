import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { resolveRedirectTarget } from './utils/routeRedirect';

// 导入样式
import './mobile-styles.css'; // 添加移动端样式

// 页面组件
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Assessment from './pages/Assessment';
import CoachChat from './pages/CoachChat';
import NotFound from './pages/NotFound';

// 信息页面组件
import { 
  TeamPage, 
  ContactPage, 
  HistoryPage, 
  KnowledgePage, 
  FAQPage, 
  TutorialPage, 
  LegalPage 
} from './pages/info';

// 布局组件
import Layout from './components/Layout';

// API连接状态组件
const ApiStatusIndicator = () => {
  const [apiStatus] = useState('connected'); // 默认假设已连接，用于调试
  
  useEffect(() => {
    // 移除API检查，用于调试
    console.log('API状态检查已临时禁用，用于调试');
    
    // 如果需要重新启用API检查，取消下面代码的注释
    /*
    const checkApiStatus = async () => {
      try {
        await checkHealth();
        setApiStatus('connected');
        console.log('后端API连接正常');
      } catch (err) {
        setApiStatus('error');
        console.error('后端API连接失败:', err);
      }
    };
    
    checkApiStatus();
    
    // 每30秒检查一次连接状态
    const interval = setInterval(checkApiStatus, 30000);
    return () => clearInterval(interval);
    */
  }, []);
  
  if (apiStatus === 'checking') return null;
  if (apiStatus === 'error') {
    return (
      <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
        <p>无法连接到后端API</p>
        <p className="text-sm">请确保后端服务正在运行</p>
      </div>
    );
  }
  return null;
};

// 受保护的路由组件
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">加载中...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// 重定向组件 - 处理各种路径情况
const RedirectHandler = () => {
  const location = useLocation();
  
  useEffect(() => {
    // 当访问根路径且地址栏没有使用 hash 路由格式时补全重定向。
    // 判断依据与跳转目标由 resolveRedirectTarget 统一处理（详见该模块注释）：
    // 读 window.location.hash（HashRouter 解析出的 location.hash 恒为空），
    // 跳转目标保留当前路径前缀，避免子路径部署时跳出站点。
    const target = resolveRedirectTarget(location.pathname, window.location);

    if (target) {
      window.location.replace(target);
    }
  }, [location]);
  
  return null;
};

function App() {
  return (
    <AuthProvider>
      <RedirectHandler />
      <Routes>
        {/* 重定向Caifusi路径到主页 */}
        <Route path="/Caifusi/*" element={<Navigate to="/" replace />} />
        <Route path="Caifusi/*" element={<Navigate to="/" replace />} />
        
        {/* 公共路由 */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          
          {/* 受保护的路由 */}
          <Route path="dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="assessment" element={
            <ProtectedRoute>
              <Assessment />
            </ProtectedRoute>
          } />
          <Route path="coach" element={
            <ProtectedRoute>
              <CoachChat />
            </ProtectedRoute>
          } />
          
          {/* 信息页面路由 */}
          <Route path="info/team" element={<TeamPage />} />
          <Route path="info/contact" element={<ContactPage />} />
          <Route path="info/history" element={<HistoryPage />} />
          <Route path="info/knowledge" element={<KnowledgePage />} />
          <Route path="info/faq" element={<FAQPage />} />
          <Route path="info/tutorial" element={<TutorialPage />} />
          <Route path="info/legal" element={<LegalPage />} />
          
          {/* 404页面 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      
      {/* API连接状态指示器 */}
      <ApiStatusIndicator />
    </AuthProvider>
  );
}

export default App; 