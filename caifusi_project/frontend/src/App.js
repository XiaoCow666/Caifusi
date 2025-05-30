import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { checkHealth } from './services/api';

// 页面组件
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Assessment from './pages/Assessment';
import CoachChat from './pages/CoachChat';
import NotFound from './pages/NotFound';

// 布局组件
import Layout from './components/Layout';

// API连接状态组件
const ApiStatusIndicator = () => {
  const [apiStatus, setApiStatus] = useState('checking');
  
  useEffect(() => {
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

function App() {
  return (
    <AuthProvider>
      <Routes>
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