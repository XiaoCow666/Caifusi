import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, Nav, Container, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaUser, FaSignOutAlt, FaHome, FaBrain, FaRobot, FaInfoCircle, FaBook, FaQuestion } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

const Layout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // 监听滚动事件，用于导航栏样式变化
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* 现代化导航栏 */}
      <Navbar 
        expand="lg" 
        fixed="top"
        expanded={expanded}
        className={`transition-all duration-300 ${
          scrolled ? 'bg-white shadow-sm' : 'bg-transparent'
        } ${location.pathname === '/' && !scrolled ? 'navbar-dark' : 'navbar-light'}`}
      >
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold fs-3 d-flex align-items-center">
            <span className="text-primary me-2">财赋思</span>
            <div className="d-none d-md-block">
              <span className="badge bg-primary bg-opacity-10 text-primary ms-2 fw-normal fs-6">AI金融教练</span>
            </div>
          </Navbar.Brand>
          
          <Navbar.Toggle 
            aria-controls="basic-navbar-nav" 
            onClick={() => setExpanded(!expanded)}
          />
          
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              <Nav.Link 
                as={Link} 
                to="/" 
                className={`mx-1 rounded-pill px-3 ${location.pathname === '/' ? 'active fw-bold' : ''}`}
                onClick={() => setExpanded(false)}
              >
                <FaHome className="me-1 mb-1" /> 首页
              </Nav.Link>
              
              {currentUser ? (
                <>
                  <Nav.Link 
                    as={Link} 
                    to="/dashboard" 
                    className={`mx-1 rounded-pill px-3 ${location.pathname === '/dashboard' ? 'active fw-bold' : ''}`}
                    onClick={() => setExpanded(false)}
                  >
                    <FaUser className="me-1 mb-1" /> 个人中心
                  </Nav.Link>
                  
                  <Nav.Link 
                    as={Link} 
                    to="/assessment" 
                    className={`mx-1 rounded-pill px-3 ${location.pathname === '/assessment' ? 'active fw-bold' : ''}`}
                    onClick={() => setExpanded(false)}
                  >
                    <FaBrain className="me-1 mb-1" /> 心智评估
                  </Nav.Link>
                  
                  <Nav.Link 
                    as={Link} 
                    to="/coach" 
                    className={`mx-1 rounded-pill px-3 ${location.pathname === '/coach' ? 'active fw-bold' : ''}`}
                    onClick={() => setExpanded(false)}
                  >
                    <FaRobot className="me-1 mb-1" /> AI教练
                  </Nav.Link>
                  
                  <div className="ms-2">
                    <OverlayTrigger
                      placement="bottom"
                      overlay={<Tooltip>退出登录</Tooltip>}
                    >
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        className="rounded-pill"
                        onClick={handleLogout}
                      >
                        <FaSignOutAlt /> 登出
                      </Button>
                    </OverlayTrigger>
                  </div>
                </>
              ) : (
                <>
                  <Nav.Link 
                    as={Link} 
                    to="/login" 
                    className="mx-1"
                    onClick={() => setExpanded(false)}
                  >
                    登录
                  </Nav.Link>
                  
                  <div className="ms-2">
                    <Button 
                      as={Link} 
                      to="/register" 
                      variant="primary" 
                      className="rounded-pill px-4"
                      onClick={() => setExpanded(false)}
                    >
                      免费注册
                    </Button>
                  </div>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* 主内容区 - 添加页面过渡效果和顶部间距 */}
      <main className="flex-grow-1 mt-5 pt-5">
        <Container className="py-4 animate__animated animate__fadeIn">
          <Outlet />
        </Container>
      </main>

      {/* 现代化页脚 */}
      <footer className="bg-dark text-white py-5">
        <Container>
          <div className="row">
            <div className="col-lg-4 mb-4 mb-lg-0">
              <h3 className="h4 mb-4 border-start border-primary border-4 ps-3">财赋思 (Cái Fù Sī)</h3>
              <p className="text-muted mb-4">财赋思是您的AI金融心智教练，致力于帮助用户培养健康的金融习惯，增强财务决策能力。</p>
              <div className="d-flex gap-3">
                <button className="btn btn-outline-light btn-sm rounded-circle">
                  <i className="fab fa-weixin"></i>
                </button>
                <button className="btn btn-outline-light btn-sm rounded-circle">
                  <i className="fab fa-weibo"></i>
                </button>
                <button className="btn btn-outline-light btn-sm rounded-circle">
                  <i className="fab fa-github"></i>
                </button>
              </div>
            </div>
            
            <div className="col-lg-8">
              <div className="row">
                <div className="col-md-4 mb-4 mb-md-0">
                  <h5 className="h6 mb-3 text-uppercase">关于我们</h5>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <Link to="/about/team" className="text-muted text-decoration-none hover-text-white">
                        <FaInfoCircle className="me-2" />团队介绍
                      </Link>
                    </li>
                    <li className="mb-2">
                      <Link to="/about/contact" className="text-muted text-decoration-none hover-text-white">
                        <FaInfoCircle className="me-2" />联系我们
                      </Link>
                    </li>
                  </ul>
                </div>
                
                <div className="col-md-4 mb-4 mb-md-0">
                  <h5 className="h6 mb-3 text-uppercase">资源</h5>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <Link to="/resources/knowledge" className="text-muted text-decoration-none hover-text-white">
                        <FaBook className="me-2" />金融知识库
                      </Link>
                    </li>
                    <li className="mb-2">
                      <Link to="/resources/faq" className="text-muted text-decoration-none hover-text-white">
                        <FaQuestion className="me-2" />常见问题
                      </Link>
                    </li>
                  </ul>
                </div>
                
                <div className="col-md-4">
                  <h5 className="h6 mb-3 text-uppercase">法律</h5>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <Link to="/legal/privacy" className="text-muted text-decoration-none hover-text-white">
                        <FaInfoCircle className="me-2" />隐私政策
                      </Link>
                    </li>
                    <li className="mb-2">
                      <Link to="/legal/terms" className="text-muted text-decoration-none hover-text-white">
                        <FaInfoCircle className="me-2" />使用条款
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <hr className="my-4 border-secondary" />
          
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
              <p className="mb-0 text-muted">© {new Date().getFullYear()} 财赋思 (Cái Fù Sī). 保留所有权利。</p>
            </div>
            <div className="col-md-6 text-center text-md-end">
              <div className="d-inline-block px-3 py-1 rounded-pill bg-dark bg-opacity-50">
                <span className="badge bg-primary me-2">Beta</span>
                <small className="text-muted">v0.1.0</small>
              </div>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default Layout; 