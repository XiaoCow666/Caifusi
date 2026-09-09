import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaHome, FaUser, FaBrain, FaRobot, 
  FaBook
} from 'react-icons/fa';

// 移动端底部导航栏样式
const styles = {
  navContainer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'white',
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '8px 0',
    zIndex: 1000,
    borderTopLeftRadius: '15px',
    borderTopRightRadius: '15px',
    paddingBottom: 'env(safe-area-inset-bottom)'
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6c757d',
    textDecoration: 'none',
    fontSize: '0.7rem',
    padding: '5px 0',
    width: '20%',
    transition: 'all 0.3s ease'
  },
  navItemActive: {
    color: '#0d6efd'
  },
  navIcon: {
    fontSize: '1.3rem',
    marginBottom: '3px'
  }
};

const MobileNavBar = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navItems = [
    { path: '/', icon: <FaHome style={styles.navIcon} />, label: '首页' },
    { path: '/info/knowledge', icon: <FaBook style={styles.navIcon} />, label: '知识' },
    { path: '/assessment', icon: <FaBrain style={styles.navIcon} />, label: '评估', requireAuth: true },
    { path: '/coach', icon: <FaRobot style={styles.navIcon} />, label: 'AI教练', requireAuth: true },
    { path: '/dashboard', icon: <FaUser style={styles.navIcon} />, label: '我的', requireAuth: true }
  ];
  
  return (
    <div className="d-md-none" style={styles.navContainer}>
      {navItems.map((item) => {
        // 如果需要登录但用户未登录，则跳转到登录页
        if (item.requireAuth && !currentUser) {
          return (
            <Link 
              key={item.path}
              to="/login"
              style={styles.navItem}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        }
        
        return (
          <Link 
            key={item.path}
            to={item.path}
            style={{
              ...styles.navItem,
              ...(location.pathname === item.path ? styles.navItemActive : {})
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default MobileNavBar; 