import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Container, Row, Col, Card, Button, Carousel, Badge } from 'react-bootstrap';
import { FaArrowRight, FaBrain, FaChartLine, FaRobot, FaShieldAlt, FaComments, FaChartBar } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import Typed from 'typed.js';

// 自定义卡片组件，带有悬停效果
const FeatureCard = ({ icon, title, description, className = '' }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Card 
      className={`h-100 border-0 shadow-sm transition-all card-hover ${className} ${isHovered ? 'shadow-lg transform-up' : ''}`} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card.Body className="p-4">
        <div className={`feature-icon mb-4 rounded-circle d-inline-flex align-items-center justify-content-center text-primary ${isHovered ? 'bg-primary text-white' : 'bg-primary-light'}`} style={{ width: '60px', height: '60px', transition: 'all 0.3s' }}>
          {icon}
        </div>
        <Card.Title className="h5 mb-3">{title}</Card.Title>
        <Card.Text className="text-muted">{description}</Card.Text>
      </Card.Body>
    </Card>
  );
};

// 动画按钮组件
const AnimatedButton = ({ children, variant, className, as, to, size, onClick }) => {
  return (
    <Button
      as={as}
      to={to}
      variant={variant}
      size={size}
      className={`btn-animated d-inline-flex align-items-center justify-content-center ${className}`}
      onClick={onClick}
    >
      <span className="d-flex align-items-center">
        {children}
      </span>
    </Button>
  );
};

// 增强型徽章组件
const EnhancedBadge = ({ children, bg, className = '' }) => {
  return (
    <Badge 
      bg={bg} 
      className={`custom-badge px-3 py-2 rounded-pill fw-normal position-relative overflow-hidden ${className}`}
    >
      <span className="badge-content position-relative">{children}</span>
      <span className="badge-glow"></span>
    </Badge>
  );
};

// 投资表现跟随组件
const InvestmentPerformance = ({ userData = {} }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ top: 20, right: 20 });
  
  // 模拟用户数据 - 实际项目中应从userData获取
  const riskProfile = userData.riskProfile || "均衡型";
  const progressValue = userData.progressValue || 75;
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // 确保组件始终可见且跟随滚动
      setIsVisible(true);
      
      // 限制顶部位置，确保不会超出视窗
      const newTop = Math.max(20, scrollY);
      setPosition({ top: newTop, right: 20 });
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div 
      className="bg-white rounded-4 shadow-lg p-3 position-fixed animate__animated animate__fadeInUp" 
      style={{ 
        maxWidth: '200px',
        top: `${position.top}px`,
        right: `${position.right}px`,
        zIndex: 1000,
        transition: 'top 0.3s ease-out'
      }}
    >
      <div className="d-flex align-items-center mb-2">
        <FaChartLine className="text-success fs-3 me-2" />
        <span className="fw-bold">投资表现</span>
      </div>
      <div className="d-flex justify-content-between">
        <small className="text-muted">风险偏好:</small>
        <small className="fw-bold text-end">{riskProfile}</small>
      </div>
      <div className="progress mt-2 mb-2" style={{ height: '6px' }}>
        <div className="progress-bar bg-success" style={{ width: `${progressValue}%` }}></div>
      </div>
      <div className="d-flex justify-content-between">
        <small className="text-muted">成长路径:</small>
        <small className="fw-bold text-end">稳步提升中</small>
      </div>
    </div>
  );
};

// 主题组件
const Home = () => {
  const { currentUser } = useAuth();
  const [fadeIn, setFadeIn] = useState(false);
  const typedRef = useRef(null);
  const typedElementRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 5; // 总的评价数量
  const slideIntervalRef = useRef(null);
  const testimonialTrackRef = useRef(null);
  
  // 添加首屏加载动画
  useEffect(() => {
    setFadeIn(true);
    
    // 监听滚动事件，用于部分动画
    const handleScroll = () => {
      const sections = document.querySelectorAll('.animate-on-scroll');
      sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        if (sectionTop < window.innerHeight * 0.75) {
          section.classList.add('slide-up');
          section.style.opacity = '1';
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 初始化打字效果
  useEffect(() => {
    if (typedElementRef.current) {
      typedRef.current = new Typed(typedElementRef.current, {
        strings: [
          'AI金融心智教练',
          '您的财务顾问',
          '金融素养培养专家',
          '智能理财决策助手'
        ],
        typeSpeed: 80,
        backSpeed: 50,
        loop: true
      });

      return () => {
        // 清理打字效果
        if (typedRef.current) {
          typedRef.current.destroy();
        }
      };
    }
  }, []);
  
  // 用户心声轮播功能
  useEffect(() => {
    // 初始化自动轮播
    startSlideInterval();
    
    // 清理函数
    return () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
    };
  }, [currentSlide]);
  
  // 启动自动轮播
  const startSlideInterval = () => {
    if (slideIntervalRef.current) {
      clearInterval(slideIntervalRef.current);
    }
    
    slideIntervalRef.current = setInterval(() => {
      goToNextSlide();
    }, 5000); // 5秒切换一次
  };
  
  // 暂停自动轮播
  const pauseSlideInterval = () => {
    if (slideIntervalRef.current) {
      clearInterval(slideIntervalRef.current);
    }
  };
  
  // 切换到下一张
  const goToNextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % totalSlides);
    updateSlidePosition((currentSlide + 1) % totalSlides);
  };
  
  // 切换到上一张
  const goToPrevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
    updateSlidePosition((currentSlide - 1 + totalSlides) % totalSlides);
  };
  
  // 切换到指定的幻灯片
  const goToSlide = (index) => {
    setCurrentSlide(index);
    updateSlidePosition(index);
  };
  
  // 更新幻灯片位置并添加适当的类
  const updateSlidePosition = (index) => {
    if (testimonialTrackRef.current) {
      // 更新滑动位置
      testimonialTrackRef.current.style.transform = `translateX(-${index * 100}%)`;
      
      // 更新活动状态
      const slides = testimonialTrackRef.current.querySelectorAll('.testimonial-slide');
      slides.forEach((slide, i) => {
        if (i === index) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });
    }
  };

  return (
    <div className={`home-page transition-all ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      {/* 背景动态元素 */}
      <div className="animated-background">
        <div className="floating-shape shape1"></div>
        <div className="floating-shape shape2"></div>
        <div className="floating-shape shape3"></div>
        <div className="floating-shape shape4"></div>
        <div className="floating-shape shape5"></div>
        <div className="floating-shape shape6"></div>
        
        {/* 金融相关元素 */}
        <div className="finance-icon finance-icon-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0-12.95L16.95 12 12 16.95 7.05 12 12 7.05zm0 2.829L9.88 12 12 14.12 14.12 12 12 9.879z" fill="rgba(78, 115, 223, 0.15)"/></svg>
        </div>
        <div className="finance-icon finance-icon-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 1l8.217 14H3.783L12 1zm0 3.24L6.22 13h11.56L12 4.24zM3 20h18v2H3v-2z" fill="rgba(72, 187, 120, 0.15)"/></svg>
        </div>
        <div className="finance-icon finance-icon-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48"><path fill="none" d="M0 0h24v24H0z"/><path d="M22 7h1v10h-1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v3zm-2 10h-6a5 5 0 0 1 0-10h6V5H4v14h16v-2zm1-2V9h-7a3 3 0 0 0 0 6h7zm-7-4h3v2h-3v-2z" fill="rgba(255, 193, 7, 0.15)"/></svg>
        </div>
        <div className="finance-icon finance-icon-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><path fill="none" d="M0 0h24v24H0z"/><path d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm17 8H4v8h16v-8zm0-2V5H4v4h16zm-6 6h4v2h-4v-2z" fill="rgba(66, 153, 225, 0.15)"/></svg>
        </div>
        <div className="finance-icon finance-icon-5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40"><path fill="none" d="M0 0h24v24H0z"/><path d="M21 8v12.993A1 1 0 0 1 20.007 22H3.993A.993.993 0 0 1 3 21.008V2.992C3 2.455 3.449 2 4.002 2h10.995L21 8zm-2 1h-5V4H5v16h14V9zM8 7h3v2H8V7zm0 4h8v2H8v-2zm0 4h8v2H8v-2z" fill="rgba(78, 115, 223, 0.15)"/></svg>
        </div>
      </div>
      
      {/* 添加跟随投资表现组件 */}
      {currentUser && <InvestmentPerformance userData={currentUser} />}
      
      {/* 现代化英雄区 */}
      <section className="hero-section position-relative overflow-hidden py-5 mb-6">
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-gradient-primary rounded-5" style={{ zIndex: -1 }}></div>
        <div className="position-absolute top-0 start-0 w-100 h-100 hero-pattern-overlay rounded-5" style={{ zIndex: -1, opacity: 0.15 }}></div>
        
        <Container>
          <Row className="align-items-center py-5">
            <Col lg={6} className="mb-5 mb-lg-0">
              <div className="hero-content text-center text-lg-start">
                <EnhancedBadge bg="light" className="mb-3 shadow-sm animate__animated animate__fadeIn animate__delay-1s">
                  <span className="pulse-dot me-2"></span>
                  <span className="text-primary fw-medium">智能金融助手</span>
                </EnhancedBadge>
                <h1 className="display-4 fw-bold mb-4 text-white">
                  财赋思 - <span className="text-warning typed-text fs-2">
                    <span ref={typedElementRef}></span>
                  </span>
                </h1>
                <p className="lead mb-5 text-white-50 animate__animated animate__fadeIn animate__delay-2s">
                  通过人工智能技术，帮助您培养健康的财务习惯，提升金融素养，做出更明智的财务决策。
                </p>
                
                <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center justify-content-lg-start animate__animated animate__fadeIn animate__delay-3s">
                  {currentUser ? (
                    <AnimatedButton 
                      as={Link} 
                      to="/dashboard" 
                      variant="light"
                      size="lg"
                      className="rounded-pill btn-glow px-4 py-2"
                    >
                      进入个人中心 <FaArrowRight className="ms-2" />
                    </AnimatedButton>
                  ) : (
                    <>
                      <AnimatedButton 
                        as={Link} 
                        to="/register" 
                        variant="light"
                        size="lg"
                        className="rounded-pill btn-glow px-4 py-2"
                      >
                        免费注册 <FaArrowRight className="ms-2" />
                      </AnimatedButton>
                      <AnimatedButton 
                        as={Link} 
                        to="/login" 
                        variant="outline-light"
                        size="lg"
                        className="rounded-pill px-4 py-2"
                      >
                        立即登录
                      </AnimatedButton>
                    </>
                  )}
                </div>
              </div>
            </Col>
            
            <Col lg={6}>
              <div className="hero-image position-relative animate__animated animate__fadeInRight animate__delay-2s">
                <div className="image-blob-shape"></div>
                <img 
                  src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80" 
                  alt="财务规划" 
                  className="img-fluid rounded-4 shadow-lg position-relative" 
                />
                <div className="hero-image-dots"></div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 我们的特点 */}
      <section className="features-section py-5 mb-6 animate-on-scroll position-relative" style={{ opacity: 0 }}>
        <div className="section-bg-pattern pattern-1 rounded-5"></div>
        <Container>
          <div className="text-center mb-5">
            <EnhancedBadge bg="primary" className="mb-3">
              <span className="fw-medium text-white">为什么选择我们</span>
            </EnhancedBadge>
            <h2 className="display-5 fw-bold mb-4">财赋思的优势</h2>
            <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
              我们结合人工智能和金融心理学，帮助您建立健康的财务习惯，做出更明智的财务决策。
            </p>
          </div>
          
          <Row className="g-4">
            <Col md={6} lg={4} className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.1s' }}>
              <FeatureCard 
                icon={<FaBrain size={24} />}
                title="金融心智培养"
                description="通过科学方法和个性化指导，帮助您建立健康的金钱观念和财务习惯。"
              />
            </Col>
            <Col md={6} lg={4} className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.3s' }}>
              <FeatureCard 
                icon={<FaRobot size={24} />}
                title="AI智能教练"
                description="基于先进AI技术的个人教练，根据您的财务状况和目标提供定制化建议。"
                className="feature-card-highlight"
              />
            </Col>
            <Col md={6} lg={4} className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.5s' }}>
              <FeatureCard 
                icon={<FaChartBar size={24} />}
                title="数据驱动决策"
                description="通过可视化数据分析，帮助您更好地理解自己的财务状况和进步。"
              />
            </Col>
            <Col md={6} lg={4} className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.7s' }}>
              <FeatureCard 
                icon={<FaShieldAlt size={24} />}
                title="隐私保护"
                description="我们严格保护您的个人信息和财务数据，确保您的隐私安全。"
              />
            </Col>
            <Col md={6} lg={4} className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.9s' }}>
              <FeatureCard 
                icon={<FaComments size={24} />}
                title="个性化互动"
                description="根据您的财务目标和习惯，提供量身定制的建议和反馈。"
              />
            </Col>
            <Col md={6} lg={4} className="animate__animated animate__fadeInUp" style={{ animationDelay: '1.1s' }}>
              <FeatureCard 
                icon={<FaChartLine size={24} />}
                title="成长跟踪"
                description="持续监测您的财务健康状况，并提供改进建议和鼓励。"
              />
            </Col>
          </Row>
        </Container>
      </section>

      {/* 用户评价 */}
      <section className="testimonials-section py-5 mb-6 position-relative animate-on-scroll" style={{ opacity: 0 }}>
        <div className="section-bg-gradient rounded-5"></div>
        <div className="section-bg-pattern pattern-2 rounded-5"></div>
        <Container>
          <div className="text-center mb-5">
            <EnhancedBadge bg="success" className="mb-3">
              <span className="fw-medium text-white">用户心声</span>
            </EnhancedBadge>
            <h2 className="display-5 fw-bold mb-4">他们的体验</h2>
          </div>
          
          {/* 自定义轮播效果，替换原Bootstrap Carousel */}
          <div className="custom-testimonial-slider"
            onMouseEnter={pauseSlideInterval}
            onMouseLeave={startSlideInterval}
          >
            <div className="testimonial-slider-wrapper">
              {/* 滚动容器 */}
              <div className="testimonial-slider-track" ref={testimonialTrackRef}>
                {/* 第一个评价 */}
                <div className={`testimonial-slide ${currentSlide === 0 ? 'active' : ''}`}>
                  <div className="testimonial-item bg-white p-4 p-lg-5 rounded-4 shadow-sm mx-auto">
                    <div className="d-flex flex-column flex-md-row gap-4">
                      <div className="testimonial-avatar flex-shrink-0 mx-auto mx-md-0">
                        <img src="https://images.unsplash.com/photo-1557862921-37829c790f19?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80" alt="用户头像" className="rounded-circle" width="80" height="80" />
                      </div>
                      <div className="testimonial-content">
                        <p className="fs-5 mb-3">"财赋思AI教练帮助我理清了我的财务状况，并制定了切实可行的储蓄计划。现在我每个月都能存下一笔钱，为未来做准备。"</p>
                        <h5 className="mb-1">张小明</h5>
                        <p className="text-muted mb-0">自由职业者，上海</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 第二个评价 */}
                <div className={`testimonial-slide ${currentSlide === 1 ? 'active' : ''}`}>
                  <div className="testimonial-item bg-white p-4 p-lg-5 rounded-4 shadow-sm mx-auto">
                    <div className="d-flex flex-column flex-md-row gap-4">
                      <div className="testimonial-avatar flex-shrink-0 mx-auto mx-md-0">
                        <div className="avatar-gradient rounded-circle d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                          <img src="https://randomuser.me/api/portraits/women/29.jpg" alt="用户头像" className="rounded-circle" width="76" height="76" />
                        </div>
                      </div>
                      <div className="testimonial-content">
                        <p className="fs-5 mb-3">"通过财赋思的心智评估，我发现自己有冲动消费的习惯。AI教练提供的建议帮助我克服了这个问题，现在我能更理性地消费了。"</p>
                        <h5 className="mb-1">李雯</h5>
                        <p className="text-muted mb-0">市场经理，北京</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 第三个评价 */}
                <div className={`testimonial-slide ${currentSlide === 2 ? 'active' : ''}`}>
                  <div className="testimonial-item bg-white p-4 p-lg-5 rounded-4 shadow-sm mx-auto">
                    <div className="d-flex flex-column flex-md-row gap-4">
                      <div className="testimonial-avatar flex-shrink-0 mx-auto mx-md-0">
                        <div className="avatar-gradient rounded-circle d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                          <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="用户头像" className="rounded-circle" width="76" height="76" />
                        </div>
                      </div>
                      <div className="testimonial-content">
                        <p className="fs-5 mb-3">"作为一个投资新手，我曾经对金融市场感到恐惧。财赋思的AI教练通过简单易懂的方式解释了基本概念，让我有信心开始我的投资之旅。"</p>
                        <h5 className="mb-1">刘志强</h5>
                        <p className="text-muted mb-0">软件工程师，深圳</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 第四个评价 */}
                <div className={`testimonial-slide ${currentSlide === 3 ? 'active' : ''}`}>
                  <div className="testimonial-item bg-white p-4 p-lg-5 rounded-4 shadow-sm mx-auto">
                    <div className="d-flex flex-column flex-md-row gap-4">
                      <div className="testimonial-avatar flex-shrink-0 mx-auto mx-md-0">
                        <div className="avatar-gradient rounded-circle d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                          <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="用户头像" className="rounded-circle" width="76" height="76" />
                        </div>
                      </div>
                      <div className="testimonial-content">
                        <p className="fs-5 mb-3">"财赋思帮助我设定了合理的财务目标，并持续提供指导。一年后，我成功攒下了首付款，即将实现购房梦想，感谢这个平台！"</p>
                        <h5 className="mb-1">赵美娟</h5>
                        <p className="text-muted mb-0">教师，成都</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 第五个评价 */}
                <div className={`testimonial-slide ${currentSlide === 4 ? 'active' : ''}`}>
                  <div className="testimonial-item bg-white p-4 p-lg-5 rounded-4 shadow-sm mx-auto">
                    <div className="d-flex flex-column flex-md-row gap-4">
                      <div className="testimonial-avatar flex-shrink-0 mx-auto mx-md-0">
                        <div className="avatar-gradient rounded-circle d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                          <img src="https://randomuser.me/api/portraits/men/67.jpg" alt="用户头像" className="rounded-circle" width="76" height="76" />
                        </div>
                      </div>
                      <div className="testimonial-content">
                        <p className="fs-5 mb-3">"退休计划一直是我担心的问题，但财赋思AI教练为我量身定制了长期规划，现在我对未来充满信心。推荐给所有想要财务自由的人！"</p>
                        <h5 className="mb-1">王建国</h5>
                        <p className="text-muted mb-0">企业管理者，广州</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 控制按钮 */}
            <div className="testimonial-controls mt-4 d-flex justify-content-center align-items-center">
              <button 
                className="testimonial-btn prev-btn me-3"
                onClick={goToPrevSlide}
                onMouseEnter={pauseSlideInterval}
                onMouseLeave={startSlideInterval}
              >
                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
              </button>
              <div className="testimonial-indicators d-flex">
                {[...Array(totalSlides)].map((_, index) => (
                  <button 
                    key={index} 
                    className={`testimonial-indicator mx-1 ${currentSlide === index ? 'active' : ''}`}
                    onClick={() => goToSlide(index)}
                    onMouseEnter={pauseSlideInterval}
                    onMouseLeave={startSlideInterval}
                  ></button>
                ))}
              </div>
              <button 
                className="testimonial-btn next-btn ms-3"
                onClick={goToNextSlide}
                onMouseEnter={pauseSlideInterval}
                onMouseLeave={startSlideInterval}
              >
                <span className="carousel-control-next-icon" aria-hidden="true"></span>
              </button>
            </div>
          </div>
        </Container>
      </section>

      {/* 如何开始 */}
      <section className="how-it-works-section py-5 mb-6 animate-on-scroll position-relative" style={{ opacity: 0 }}>
        <div className="section-bg-pattern pattern-3 rounded-5"></div>
        <Container>
          <div className="text-center mb-5">
            <EnhancedBadge bg="info" className="mb-3">
              <span className="fw-medium text-white">简单三步</span>
            </EnhancedBadge>
            <h2 className="display-5 fw-bold mb-4">如何开始使用</h2>
            <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
              只需简单几步，即可开启您的财务成长之旅。
            </p>
          </div>
          
          <Row className="g-4 position-relative steps-container">
            {/* 连接线 */}
            <div className="position-absolute steps-connector d-none d-lg-block"></div>
            
            <Col lg={4} className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.1s' }}>
              <div className="step-item text-center p-4 card-hover">
                <div className="step-number bg-primary text-white rounded-circle mx-auto mb-4 fs-3 fw-bold d-flex align-items-center justify-content-center pulse" style={{ width: '60px', height: '60px' }}>1</div>
                <h3 className="h4 mb-3">完成财务健康评估</h3>
                <p className="text-muted">通过简短的问卷了解您当前的财务状况和理财习惯，发现潜在的改进空间。</p>
              </div>
            </Col>
            
            <Col lg={4} className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.3s' }}>
              <div className="step-item text-center p-4 card-hover">
                <div className="step-number bg-primary text-white rounded-circle mx-auto mb-4 fs-3 fw-bold d-flex align-items-center justify-content-center pulse" style={{ width: '60px', height: '60px', animationDelay: '0.5s' }}>2</div>
                <h3 className="h4 mb-3">获取个性化财务计划</h3>
                <p className="text-muted">AI教练会根据您的情况制定适合您的财务目标和改进计划，帮助您更好地管理财务。</p>
              </div>
            </Col>
            
            <Col lg={4} className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.5s' }}>
              <div className="step-item text-center p-4 card-hover">
                <div className="step-number bg-primary text-white rounded-circle mx-auto mb-4 fs-3 fw-bold d-flex align-items-center justify-content-center pulse" style={{ width: '60px', height: '60px', animationDelay: '1s' }}>3</div>
                <h3 className="h4 mb-3">持续指导与成长</h3>
                <p className="text-muted">通过定期与AI教练对话，获取建议并跟踪您的财务进步，不断优化您的财务习惯。</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 号召行动 */}
      <section className="cta-section py-5 mb-6 bg-primary text-white text-center rounded-4 animate-on-scroll position-relative overflow-hidden" style={{ opacity: 0 }}>
        <div className="cta-animated-bg rounded-5"></div>
        <div className="cta-particles rounded-5"></div>
        <Container className="py-5">
          <h2 className="display-5 fw-bold mb-4">准备好提升您的财务智慧了吗？</h2>
          <p className="lead mb-5 mx-auto" style={{ maxWidth: '700px' }}>
            加入财赋思，开启您的财务成长之旅。现在注册，即可免费获得财务健康评估！
          </p>
          
          {currentUser ? (
            <AnimatedButton 
              as={Link}
              to="/assessment" 
              variant="light" 
              size="lg"
              className="rounded-pill btn-glow px-4 py-2"
            >
              开始财务评估 <FaArrowRight className="ms-2" />
            </AnimatedButton>
          ) : (
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
              <AnimatedButton 
                as={Link}
                to="/register" 
                variant="light" 
                size="lg"
                className="rounded-pill btn-glow px-4 py-2"
              >
                免费注册 <FaArrowRight className="ms-2" />
              </AnimatedButton>
              <AnimatedButton 
                as={Link}
                to="/login" 
                variant="outline-light" 
                size="lg"
                className="rounded-pill px-4 py-2"
              >
                立即登录
              </AnimatedButton>
            </div>
          )}
        </Container>
      </section>
      
      {/* 自定义CSS */}
      <style jsx>{`
        .bg-gradient-primary {
          background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
          border-radius: 16px;
          transition: all 0.5s ease;
        }
        
        .transform-up {
          transform: translateY(-10px);
        }
        
        .feature-card-highlight {
          border-top: 3px solid #4e73df !important;
        }
        
        .bg-primary-light {
          background-color: rgba(78, 115, 223, 0.1);
        }
        
        .steps-connector {
          top: 30px;
          left: 25%;
          right: 25%;
          height: 2px;
          background-color: #e9ecef;
          z-index: 0;
        }
        
        .transition-all {
          transition: all 0.5s ease;
        }
        
        .typed-text {
          border-bottom: 2px solid #ffc107;
          padding-bottom: 5px;
          font-size: 1.75rem !important; /* 减小字体大小 */
          display: inline-block;
          white-space: nowrap;
        }
        
        .animate-on-scroll {
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        
        .slide-up {
          transform: translateY(0);
        }
        
        /* 动态背景元素 */
        .animated-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: -2;
          background: linear-gradient(120deg, #f0f8ff 0%, #e6f2ff 100%);
        }
        
        .floating-shape {
          position: absolute;
          background: rgba(78, 115, 223, 0.05);
          border-radius: 50%;
          animation: float 15s infinite ease-in-out;
        }
        
        .shape1 {
          width: 300px;
          height: 300px;
          top: -150px;
          left: 10%;
          animation-delay: 0s;
        }
        
        .shape2 {
          width: 200px;
          height: 200px;
          top: 30%;
          right: -100px;
          animation-delay: 2s;
          background: rgba(34, 74, 190, 0.05);
        }
        
        .shape3 {
          width: 250px;
          height: 250px;
          bottom: -125px;
          left: 20%;
          animation-delay: 4s;
          background: rgba(92, 159, 247, 0.05);
        }
        
        .shape4 {
          width: 180px;
          height: 180px;
          top: 20%;
          left: -90px;
          animation-delay: 6s;
          background: rgba(255, 193, 7, 0.05);
        }
        
        .shape5 {
          width: 220px;
          height: 220px;
          bottom: 10%;
          right: 15%;
          animation-delay: 8s;
          background: rgba(72, 187, 120, 0.05);
        }
        
        .shape6 {
          width: 150px;
          height: 150px;
          top: 50%;
          left: 50%;
          animation-delay: 10s;
          background: rgba(66, 133, 244, 0.05);
        }
        
        /* 金融相关图标 */
        .finance-icon {
          position: absolute;
          opacity: 0.8;
          animation: float 20s infinite ease-in-out;
          z-index: -1;
        }
        
        .finance-icon-1 {
          top: 15%;
          left: 10%;
          animation-delay: 0s;
          transform: rotate(-15deg);
        }
        
        .finance-icon-2 {
          top: 60%;
          left: 5%;
          animation-delay: 5s;
          transform: rotate(10deg);
        }
        
        .finance-icon-3 {
          top: 25%;
          right: 8%;
          animation-delay: 2s;
          transform: rotate(5deg);
        }
        
        .finance-icon-4 {
          bottom: 15%;
          right: 10%;
          animation-delay: 7s;
          transform: rotate(-5deg);
        }
        
        .finance-icon-5 {
          bottom: 30%;
          left: 15%;
          animation-delay: 10s;
          transform: rotate(15deg);
        }
        
        /* 英雄区图案背景 */
        .hero-pattern-overlay {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        /* 特点部分背景 */
        .section-bg-pattern {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          opacity: 0.05;
        }
        
        .pattern-1 {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='88' height='24' viewBox='0 0 88 24'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%234e73df' fill-opacity='0.15'%3E%3Cpath d='M13 0v8h-8v8h8v8h8v-8h8v-8h-8v-8h-8zm37 0v8h-8v8h8v8h8v-8h8v-8h-8v-8h-8zm-17 8v8h8v-8h-8zm40 0v8h8v-8h-8zM13 8h8v8h-8v-8zm-8 24h8v-8h-8v8zm24-16v16h8v-16h-8zm16 0v16h8v-16h-8zm-8-8v24h8v-24h-8zm24 0v24h8v-24h-8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        /* 用户评价部分背景 */
        .section-bg-gradient {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(240, 249, 255, 0.6) 0%, rgba(222, 246, 255, 0.6) 100%);
          z-index: -2;
        }
        
        .pattern-2 {
          background-image: url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2348bb78' fill-opacity='0.15'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        /* 如何开始部分背景 */
        .pattern-3 {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 28' width='56' height='28'%3E%3Cpath fill='%23224abe' fill-opacity='0.1' d='M56 26v2h-7.75c2.3-1.27 4.94-2 7.75-2zm-26 2a2 2 0 1 0-4 0h-4.09A25.98 25.98 0 0 0 0 16v-2c.67 0 1.34.02 2 .07V14a2 2 0 0 0-2-2v-2a4 4 0 0 1 3.98 3.6 28.09 28.09 0 0 1 2.8-3.86A8 8 0 0 0 0 6V4a9.99 9.99 0 0 1 8.17 4.23c.94-.95 1.96-1.83 3.03-2.63A13.98 13.98 0 0 0 0 0h7.75c2 1.1 3.73 2.63 5.1 4.45 1.12-.72 2.3-1.37 3.53-1.93A20.1 20.1 0 0 0 14.28 0h2.7c.45.56.88 1.14 1.29 1.74 1.3-.48 2.63-.87 4-1.15-.11-.2-.23-.4-.36-.59H26v.07a28.4 28.4 0 0 1 4 0V0h4.09l-.37.59c1.38.28 2.72.67 4.01 1.15.4-.6.84-1.18 1.3-1.74h2.69a20.1 20.1 0 0 0-2.1 2.52c1.23.56 2.41 1.2 3.54 1.93A16.08 16.08 0 0 1 48.25 0H56c-4.58 0-8.65 2.2-11.2 5.6 1.07.8 2.09 1.68 3.03 2.63A9.99 9.99 0 0 1 56 4v2a8 8 0 0 0-6.77 3.74c1.03 1.2 1.97 2.5 2.79 3.86A4 4 0 0 1 56 10v2a2 2 0 0 0-2 2.07 28.4 28.4 0 0 1 2-.07v2c-9.2 0-17.3 4.78-21.91 12H30zM7.75 28H0v-2c2.81 0 5.46.73 7.75 2zM56 20v2c-5.6 0-10.65 2.3-14.28 6h-2.7c4.04-4.89 10.15-8 16.98-8zm-39.03 8h-2.69C10.65 24.3 5.6 22 0 22v-2c6.83 0 12.94 3.11 16.97 8zm15.01-.4a28.09 28.09 0 0 1 2.8-3.86 8 8 0 0 0-13.55 0c1.03 1.2 1.97 2.5 2.79 3.86a4 4 0 0 1 7.96 0zm14.29-11.86c1.3-.48 2.63-.87 4-1.15a25.99 25.99 0 0 0-44.55 0c1.38.28 2.72.67 4.01 1.15a21.98 21.98 0 0 1 36.54 0zm-5.43 2.71c1.13-.72 2.3-1.37 3.54-1.93a19.98 19.98 0 0 0-32.76 0c1.23.56 2.41 1.2 3.54 1.93a15.98 15.98 0 0 1 25.68 0zm-4.67 3.78c.94-.95 1.96-1.83 3.03-2.63a13.98 13.98 0 0 0-22.4 0c1.07.8 2.09 1.68 3.03 2.63a9.99 9.99 0 0 1 16.34 0z'%3E%3C/path%3E%3C/svg%3E");
        }
        
        /* 主图区域样式 */
        .hero-image {
          position: relative;
          z-index: 1;
        }
        
        .image-blob-shape {
          position: absolute;
          width: 110%;
          height: 110%;
          background: linear-gradient(45deg, rgba(66, 133, 244, 0.3), rgba(72, 187, 120, 0.3));
          border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%;
          top: -5%;
          left: -5%;
          z-index: -1;
          animation: blob-animate 10s ease-in-out infinite alternate;
        }
        
        @keyframes blob-animate {
          0% {
            border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%;
          }
          50% {
            border-radius: 40% 60% 30% 70% / 40% 50% 60% 50%;
          }
          100% {
            border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%;
          }
        }
        
        .hero-image-dots {
          position: absolute;
          width: 150px;
          height: 150px;
          background-image: radial-gradient(#4e73df 10%, transparent 11%),
                            radial-gradient(#4e73df 10%, transparent 11%);
          background-size: 20px 20px;
          background-position: 0 0, 10px 10px;
          opacity: 0.2;
          z-index: -1;
          bottom: -30px;
          right: -30px;
          border-radius: 50%;
          animation: rotate 30s linear infinite;
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        /* 增强型徽章样式 */
        .custom-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-image: linear-gradient(to right, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 100%);
          backdrop-filter: blur(5px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          transform: translateY(0);
          transition: all 0.3s ease;
        }
        
        .custom-badge:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }
        
        .badge-content {
          z-index: 1;
        }
        
        .badge-glow {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: rotate(30deg);
          animation: badgeGlow 3s ease-in-out infinite;
        }
        
        @keyframes badgeGlow {
          0% {
            transform: translateX(-100%) rotate(30deg);
          }
          100% {
            transform: translateX(100%) rotate(30deg);
          }
        }
        
        .pulse-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #48bb78;
          position: relative;
        }
        
        .pulse-dot::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: #48bb78;
          animation: pulse 2s infinite;
          z-index: 0;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          70% {
            transform: scale(2);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
        
        /* 按钮发光效果 */
        .btn-glow {
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 10px rgba(78, 115, 223, 0.3);
          transition: all 0.3s ease;
          border: none;
        }
        
        .btn-glow:hover {
          box-shadow: 0 0 20px rgba(78, 115, 223, 0.5);
          transform: translateY(-2px);
        }
        
        .btn-glow::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            to bottom right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.1) 100%
          );
          transform: rotate(30deg);
          transition: all 0.3s ease;
        }
        
        .btn-glow:hover::after {
          transform: rotate(0deg);
        }
        
        /* 按钮内容对齐 */
        .btn-animated {
          letter-spacing: 0.5px;
          text-transform: none;
          font-weight: 500;
        }
        
        /* 用户头像渐变边框 */
        .avatar-gradient {
          background: linear-gradient(45deg, #4e73df, #48bb78);
          padding: 2px;
        }
        
        /* CTA 区域动画背景 */
        .cta-section {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
        }
        
        .cta-animated-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, #3a57d0, #224abe);
          opacity: 0.8;
          z-index: -1;
        }
        
        .cta-particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: -1;
        }
        
        .cta-particles::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: radial-gradient(circle, #ffffff 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 0.1;
        }
        
        /* 圆角统一化 */
        .rounded-5 {
          border-radius: 16px !important;
        }
        
        /* 卡片悬停效果增强 */
        .card-hover {
          transition: all 0.3s ease;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        /* 用户评价轮播样式 */
        .custom-testimonial-slider {
          position: relative;
          max-width: 800px;
          margin: 0 auto;
          overflow: hidden;
        }
        
        .testimonial-slider-wrapper {
          position: relative;
          overflow: hidden;
        }
        
        .testimonial-slider-track {
          display: flex;
          transition: transform 0.5s ease;
        }
        
        .testimonial-slide {
          min-width: 100%;
          flex-shrink: 0;
          padding: 10px;
          transition: opacity 0.5s ease;
        }
        
        .testimonial-slide.active {
          opacity: 1;
        }
        
        .testimonial-item {
          height: 100%;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          transition: all 0.3s ease;
          background-color: #ffffff;
        }
        
        .testimonial-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
        }
        
        /* 装饰效果 */
        .testimonial-item:after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          height: 4px;
          width: 60px;
          background: linear-gradient(90deg, #4e73df, #36b9cc);
          border-radius: 0 0 0 16px;
        }
        
        /* 控制按钮样式 */
        .testimonial-controls {
          margin-top: 20px;
        }
        
        .testimonial-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #fff;
          border: none;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .testimonial-btn:hover {
          background-color: #4e73df;
          transform: translateY(-2px);
        }
        
        .testimonial-btn:hover span {
          filter: brightness(0) invert(1);
        }
        
        .testimonial-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #d1d9e6;
          border: none;
          margin: 0 5px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .testimonial-indicator.active {
          background-color: #4e73df;
          width: 25px;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default Home; 