import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Container, Row, Col, Card, Button, Badge, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaChartLine, FaPiggyBank, FaWallet, FaExchangeAlt, FaRobot, FaCoins, FaChartPie, FaMoneyBillWave } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

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

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // 在实际应用中，这里会从API获取用户数据
    // 现在使用模拟数据
    const mockUserData = {
      name: currentUser?.displayName || '用户',
      financialHealth: 75,
      savingsGoalProgress: 65,
      totalSavings: 15000,
      monthlyBudget: 8000,
      monthlySpending: 6500,
      recentTransactions: [
        { id: 1, date: '2023-05-28', category: '餐饮', amount: -150 },
        { id: 2, date: '2023-05-27', category: '交通', amount: -50 },
        { id: 3, date: '2023-05-26', category: '工资', amount: 8000 },
        { id: 4, date: '2023-05-25', category: '购物', amount: -300 },
      ]
    };

    setUserData(mockUserData);
  }, [currentUser]);

  if (!userData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* 背景动态元素 */}
      <div className="animated-background">
        <div className="floating-shape shape1"></div>
        <div className="floating-shape shape2"></div>
        <div className="floating-shape shape3"></div>
        
        {/* 金融相关元素 */}
        <div className="finance-icon finance-icon-1">
          <FaCoins size={24} color="rgba(78, 115, 223, 0.15)" />
        </div>
        <div className="finance-icon finance-icon-2">
          <FaChartPie size={36} color="rgba(72, 187, 120, 0.15)" />
        </div>
        <div className="finance-icon finance-icon-3">
          <FaMoneyBillWave size={32} color="rgba(255, 193, 7, 0.15)" />
        </div>
      </div>
      
      <Container className="py-5">
        <Row className="justify-content-center mb-4">
          <Col md={10}>
            <div className="mb-4">
              <EnhancedBadge bg="primary" className="mb-3">
                <span className="fw-medium text-white">个人中心</span>
              </EnhancedBadge>
              <h1 className="display-5 fw-bold mb-3">欢迎回来，{userData.name}</h1>
              <p className="lead text-muted">
                您的财务状况一目了然，把握每一笔财务动向，做出明智的决策。
              </p>
            </div>
          </Col>
        </Row>
        
        <Row className="g-4 mb-5">
          <Col md={4}>
            <Card className="h-100 border-0 rounded-4 shadow-sm dashboard-card">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="icon-container bg-primary-light rounded-circle d-flex align-items-center justify-content-center me-3">
                    <FaChartLine className="text-primary" />
                  </div>
                  <h5 className="card-title mb-0">财务健康度</h5>
                </div>
                <div className="progress-container mb-2">
                  <ProgressBar 
                    now={userData.financialHealth} 
                    variant="success" 
                    className="progress-bar-thick"
                  />
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">健康状态</span>
                  <span className="fw-bold">{userData.financialHealth}%</span>
                </div>
                <div className="mt-3 pt-3 border-top">
                  <span className="badge bg-success-light text-success rounded-pill px-3 py-2">良好</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="h-100 border-0 rounded-4 shadow-sm dashboard-card">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="icon-container bg-info-light rounded-circle d-flex align-items-center justify-content-center me-3">
                    <FaPiggyBank className="text-info" />
                  </div>
                  <h5 className="card-title mb-0">储蓄目标</h5>
                </div>
                <div className="progress-container mb-2">
                  <ProgressBar 
                    now={userData.savingsGoalProgress} 
                    variant="info" 
                    className="progress-bar-thick"
                  />
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">目标进度</span>
                  <span className="fw-bold">{userData.savingsGoalProgress}%</span>
                </div>
                <div className="mt-3 pt-3 border-top">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">总储蓄</span>
                    <span className="fw-bold">¥{userData.totalSavings.toLocaleString()}</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="h-100 border-0 rounded-4 shadow-sm dashboard-card">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="icon-container bg-warning-light rounded-circle d-flex align-items-center justify-content-center me-3">
                    <FaWallet className="text-warning" />
                  </div>
                  <h5 className="card-title mb-0">本月预算</h5>
                </div>
                <h2 className="fw-bold mb-3">¥{userData.monthlyBudget.toLocaleString()}</h2>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">已花费</span>
                  <span className="text-danger fw-medium">¥{userData.monthlySpending.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">剩余</span>
                  <span className="text-success fw-bold">
                    ¥{(userData.monthlyBudget - userData.monthlySpending).toLocaleString()}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-top">
                  <div className="progress-container">
                    <ProgressBar 
                      now={(userData.monthlySpending / userData.monthlyBudget) * 100} 
                      variant="warning" 
                      className="progress-bar-thick"
                    />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Row className="mb-5">
          <Col md={12}>
            <Card className="border-0 rounded-4 shadow-sm dashboard-card">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div className="d-flex align-items-center">
                    <div className="icon-container bg-secondary-light rounded-circle d-flex align-items-center justify-content-center me-3">
                      <FaExchangeAlt className="text-secondary" />
                    </div>
                    <h5 className="card-title mb-0">最近交易</h5>
                  </div>
                  <Button variant="outline-primary" size="sm" className="rounded-pill">查看全部</Button>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th scope="col">日期</th>
                        <th scope="col">类别</th>
                        <th scope="col" className="text-end">金额</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userData.recentTransactions.map(transaction => (
                        <tr key={transaction.id}>
                          <td>{transaction.date}</td>
                          <td>
                            <Badge 
                              bg={transaction.amount > 0 ? 'success-light' : 'danger-light'} 
                              text={transaction.amount > 0 ? 'success' : 'danger'}
                              className="rounded-pill px-2 py-1"
                            >
                              {transaction.category}
                            </Badge>
                          </td>
                          <td className={`text-end fw-medium ${transaction.amount > 0 ? 'text-success' : 'text-danger'}`}>
                            {transaction.amount > 0 ? '+' : ''}
                            ¥{transaction.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="border-0 rounded-4 shadow-sm dashboard-card bg-gradient-primary text-white text-center">
              <Card.Body className="p-4">
                <div className="icon-container bg-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3">
                  <FaRobot className="text-primary" size={24} />
                </div>
                <h4 className="mb-3">需要财务建议?</h4>
                <p className="mb-4">与AI金融教练对话，获取个性化财务建议和指导，制定适合您的财务计划。</p>
                <Button 
                  as={Link} 
                  to="/coach" 
                  variant="light" 
                  size="lg" 
                  className="rounded-pill btn-glow px-4 py-2"
                >
                  开始对话 <FaRobot className="ms-2" />
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      {/* 自定义CSS */}
      <style jsx>{`
        .dashboard-page {
          position: relative;
          min-height: 100vh;
          padding-bottom: 3rem;
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
        
        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          50% {
            transform: translateY(30px) rotate(10deg) scale(1.05);
          }
          100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
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
        
        /* 仪表板卡片样式 */
        .dashboard-card {
          transition: all 0.3s ease;
          overflow: hidden;
        }
        
        .dashboard-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
        }
        
        .icon-container {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .progress-bar-thick {
          height: 8px;
          border-radius: 4px;
        }
        
        /* 背景色和文本色 */
        .bg-primary-light {
          background-color: rgba(78, 115, 223, 0.1);
        }
        
        .bg-success-light {
          background-color: rgba(72, 187, 120, 0.1);
        }
        
        .bg-info-light {
          background-color: rgba(66, 153, 225, 0.1);
        }
        
        .bg-warning-light {
          background-color: rgba(255, 193, 7, 0.1);
        }
        
        .bg-danger-light {
          background-color: rgba(220, 53, 69, 0.1);
        }
        
        .bg-secondary-light {
          background-color: rgba(108, 117, 125, 0.1);
        }
        
        .bg-gradient-primary {
          background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
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
      `}</style>
    </div>
  );
};

export default Dashboard; 