import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// 创建认证上下文
const AuthContext = createContext();

// 自定义hook用于在组件中使用认证上下文
export function useAuth() {
  return useContext(AuthContext);
}

// 认证提供者组件
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 注册新用户
  async function signup(email, password) {
    try {
      setError('');
      setLoading(true);
      // 开发模式模拟注册
      const mockUser = {
        uid: 'dev-user-' + Math.random().toString(36).substring(2, 9),
        email: email,
        displayName: email.split('@')[0],
      };
      
      setCurrentUser(mockUser);
      
      // 模拟创建用户资料
      const mockProfile = {
        userId: mockUser.uid,
        name: mockUser.displayName,
        email: mockUser.email,
        createdAt: new Date().toISOString(),
      };
      
      setUserProfile(mockProfile);
      
      // 存储到localStorage模拟持久化
      localStorage.setItem('dev_current_user', JSON.stringify(mockUser));
      localStorage.setItem('dev_user_profile', JSON.stringify(mockProfile));
      
      setLoading(false);
      return mockUser;
    } catch (err) {
      setLoading(false);
      setError('注册失败：' + err.message);
      throw err;
    }
  }
  
  // 用户登录
  async function login(email, password) {
    try {
      setError('');
      setLoading(true);
      // 开发模式模拟登录
      const mockUser = {
        uid: 'dev-user-' + Math.random().toString(36).substring(2, 9),
        email: email,
        displayName: email.split('@')[0],
      };
      
      setCurrentUser(mockUser);
      
      // 模拟用户资料
      const mockProfile = {
        userId: mockUser.uid,
        name: mockUser.displayName,
        email: mockUser.email,
        createdAt: new Date().toISOString(),
      };
      
      setUserProfile(mockProfile);
      
      // 存储到localStorage模拟持久化
      localStorage.setItem('dev_current_user', JSON.stringify(mockUser));
      localStorage.setItem('dev_user_profile', JSON.stringify(mockProfile));
      
      setLoading(false);
      return mockUser;
    } catch (err) {
      setLoading(false);
      setError('登录失败：' + err.message);
      throw err;
    }
  }
  
  // 用户登出
  async function logout() {
    try {
      setError('');
      setLoading(true);
      setCurrentUser(null);
      setUserProfile(null);
      
      // 清除localStorage中的数据
      localStorage.removeItem('dev_current_user');
      localStorage.removeItem('dev_user_profile');
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('登出失败：' + err.message);
      throw err;
    }
  }
  
  // 获取用户资料
  const fetchUserProfile = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      // 从localStorage获取用户资料
      const storedProfile = localStorage.getItem('dev_user_profile');
      if (storedProfile) {
        const profileData = JSON.parse(storedProfile);
        setUserProfile(profileData);
        setLoading(false);
        return profileData;
      }
      setLoading(false);
      return null;
    } catch (err) {
      console.error('获取用户资料失败:', err);
      setError('获取用户资料失败');
      setLoading(false);
    }
  }, [currentUser]);
  
  // 检查localStorage中是否有保存的用户信息
  useEffect(() => {
    const storedUser = localStorage.getItem('dev_current_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      fetchUserProfile();
    }
  }, [fetchUserProfile]);
  
  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    signup,
    login,
    logout,
    fetchUserProfile
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}