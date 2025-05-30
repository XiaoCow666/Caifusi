import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, ProgressBar, Badge } from 'react-bootstrap';
import { FaCheckCircle, FaArrowRight, FaChartPie, FaLightbulb, FaCoins } from 'react-icons/fa';

// 更丰富的问卷内容
const questions = [
  {
    id: 1,
    question: '您每月会储蓄收入的多少比例？',
    options: [
      { id: 'a', text: '0-10%', score: 1 },
      { id: 'b', text: '10-20%', score: 2 },
      { id: 'c', text: '20-30%', score: 3 },
      { id: 'd', text: '30%以上', score: 4 },
    ],
    category: 'savings'
  },
  {
    id: 2,
    question: '您对投资风险的接受程度如何？',
    options: [
      { id: 'a', text: '非常保守，不愿承担任何风险', score: 1 },
      { id: 'b', text: '较为保守，可接受少量风险', score: 2 },
      { id: 'c', text: '适中，愿意为较高收益承担适当风险', score: 3 },
      { id: 'd', text: '进取，愿意为高收益承担较高风险', score: 4 },
    ],
    category: 'risk'
  },
  {
    id: 3,
    question: '您是否有应急资金，可以覆盖几个月的生活支出？',
    options: [
      { id: 'a', text: '没有应急资金', score: 1 },
      { id: 'b', text: '可覆盖1-3个月支出', score: 2 },
      { id: 'c', text: '可覆盖3-6个月支出', score: 3 },
      { id: 'd', text: '可覆盖6个月以上支出', score: 4 },
    ],
    category: 'emergency'
  },
  {
    id: 4,
    question: '您目前的债务（包括信用卡、贷款等）占收入的比例是？',
    options: [
      { id: 'a', text: '50%以上', score: 1 },
      { id: 'b', text: '30-50%', score: 2 },
      { id: 'c', text: '10-30%', score: 3 },
      { id: 'd', text: '10%以下或无债务', score: 4 },
    ],
    category: 'debt'
  },
  {
    id: 5,
    question: '您对自己的财务知识水平评价如何？',
    options: [
      { id: 'a', text: '很低，几乎不了解金融知识', score: 1 },
      { id: 'b', text: '基础，了解一些基本概念', score: 2 },
      { id: 'c', text: '中等，了解大部分金融产品和概念', score: 3 },
      { id: 'd', text: '较高，熟悉各类金融产品和投资策略', score: 4 },
    ],
    category: 'knowledge'
  },
  {
    id: 6,
    question: '您当前的收入是否稳定？',
    options: [
      { id: 'a', text: '非常不稳定，收入波动很大', score: 1 },
      { id: 'b', text: '有一定波动，但基本能维持生活', score: 2 },
      { id: 'c', text: '相对稳定，有固定收入来源', score: 3 },
      { id: 'd', text: '非常稳定，收入持续增长', score: 4 },
    ],
    category: 'income'
  },
  {
    id: 7,
    question: '您有明确的财务目标吗？',
    options: [
      { id: 'a', text: '没有任何财务目标', score: 1 },
      { id: 'b', text: '有一些模糊的想法，但没有具体计划', score: 2 },
      { id: 'c', text: '有明确目标，但没有详细规划', score: 3 },
      { id: 'd', text: '有明确目标和详细的实施计划', score: 4 },
    ],
    category: 'goals'
  },
  {
    id: 8,
    question: '您是否定期追踪个人收支情况？',
    options: [
      { id: 'a', text: '从不关注收支情况', score: 1 },
      { id: 'b', text: '偶尔查看账户余额', score: 2 },
      { id: 'c', text: '经常记录主要收支', score: 3 },
      { id: 'd', text: '详细记录每一笔收支并定期分析', score: 4 },
    ],
    category: 'tracking'
  },
  {
    id: 9,
    question: '您是否有保险保障（健康险、意外险等）？',
    options: [
      { id: 'a', text: '没有任何保险', score: 1 },
      { id: 'b', text: '只有基本社保/医保', score: 2 },
      { id: 'c', text: '除基本社保外，有1-2种商业保险', score: 3 },
      { id: 'd', text: '有完善的保险规划', score: 4 },
    ],
    category: 'insurance'
  },
  {
    id: 10,
    question: '面对突发财务压力，您通常如何应对？',
    options: [
      { id: 'a', text: '靠信用卡或借贷解决', score: 1 },
      { id: 'b', text: '向亲友求助', score: 2 },
      { id: 'c', text: '动用储蓄或投资', score: 3 },
      { id: 'd', text: '使用专门的应急基金', score: 4 },
    ],
    category: 'pressure'
  }
];

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

const Assessment = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [categoryScores, setCategoryScores] = useState({});
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  const handleAnswer = (questionId, optionId, optionScore, category) => {
    const newAnswers = { 
      ...answers, 
      [questionId]: { 
        optionId, 
        score: optionScore, 
        category 
      } 
    };
    setAnswers(newAnswers);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // 计算总分和各类别分数
      calculateResults(newAnswers);
      setShowResult(true);
    }
  };

  const calculateResults = (resultAnswers) => {
    const totalScore = Object.values(resultAnswers).reduce((sum, answer) => sum + answer.score, 0);
    setScore(totalScore);
    
    // 计算各类别得分
    const categories = {};
    const categoryCounts = {};
    
    Object.values(resultAnswers).forEach(answer => {
      const category = answer.category;
      if (!categories[category]) {
        categories[category] = 0;
        categoryCounts[category] = 0;
      }
      categories[category] += answer.score;
      categoryCounts[category]++;
    });
    
    // 转换成百分比
    const categoryPercentages = {};
    Object.keys(categories).forEach(category => {
      const maxCategoryScore = categoryCounts[category] * 4; // 每题最高4分
      categoryPercentages[category] = Math.round((categories[category] / maxCategoryScore) * 100);
    });
    
    setCategoryScores(categoryPercentages);
  };

  const getResultMessage = () => {
    const maxPossibleScore = questions.length * 4;
    const percentage = (score / maxPossibleScore) * 100;
    
    if (percentage >= 85) {
      return {
        title: '金融规划大师',
        message: '您展示了卓越的财务管理能力，拥有健全的财务系统和优秀的理财习惯。您不仅了解金融知识，而且能够有效地应用它们。您可以考虑更多高级投资策略，进一步优化您的财务状况，甚至可以开始为家人提供财务指导。',
        icon: <FaCheckCircle className="text-success" size={48} />,
        color: 'success'
      };
    } else if (percentage >= 70) {
      return {
        title: '优秀的财务规划者',
        message: '您在财务管理方面表现出色，具备良好的财务习惯和知识。您已经建立了稳健的财务基础，但仍有提升空间。建议您关注投资组合的优化和长期财务规划，以实现更大的财务自由。',
        icon: <FaCheckCircle className="text-primary" size={48} />,
        color: 'primary'
      };
    } else if (percentage >= 55) {
      return {
        title: '稳健的财务管理者',
        message: '您对财务有基本的了解和规划，正走在正确的道路上。建议您加强应急资金储备，优化预算管理，并且考虑多元化的投资策略，以提高您的财务健康状况。',
        icon: <FaChartPie className="text-info" size={48} />,
        color: 'info'
      };
    } else if (percentage >= 40) {
      return {
        title: '财务成长阶段',
        message: '您在财务管理方面有一定的基础，但需要更多关注和学习。从建立系统化的预算开始，控制支出，逐步建立应急基金，并学习基本的投资知识，将帮助您迈向更健康的财务状态。',
        icon: <FaLightbulb className="text-warning" size={48} />,
        color: 'warning'
      };
    } else {
      return {
        title: '财务起步阶段',
        message: '您可能正面临一些财务挑战，但别担心！每个财务大师都是从起点开始的。从建立基本预算和储蓄习惯开始，逐步偿还高息债务，寻求专业建议，一步一步地改善您的财务状况。',
        icon: <FaCoins className="text-secondary" size={48} />,
        color: 'secondary'
      };
    }
  };

  const getCategoryAdvice = () => {
    const advices = [];
    
    if (categoryScores.savings < 50) {
      advices.push('增加储蓄比例：尝试使用50/30/20法则，将收入的50%用于必需支出，30%用于个人支出，20%用于储蓄。');
    }
    
    if (categoryScores.emergency < 50) {
      advices.push('建立应急基金：目标至少覆盖3-6个月的基本生活支出，并将其存放在易于获取的账户中。');
    }
    
    if (categoryScores.debt < 50) {
      advices.push('管理债务：优先偿还高息债务，如信用卡债务，考虑债务合并以降低利率。');
    }
    
    if (categoryScores.knowledge < 50) {
      advices.push('增加财务知识：阅读财经书籍，参加理财课程，关注可靠的财经媒体以提升金融素养。');
    }
    
    if (categoryScores.tracking < 50) {
      advices.push('追踪收支：使用预算应用或电子表格详细记录收入和支出，以便了解资金流向。');
    }
    
    if (categoryScores.insurance < 50) {
      advices.push('完善保险计划：确保有足够的健康险、意外险和适当的寿险保障，为您和家人提供安全网。');
    }
    
    return advices.length > 0 ? advices : ['继续保持良好的财务习惯，并定期审视您的财务目标和计划。'];
  };

  const handleStartCoaching = () => {
    // 将评估结果存储到本地存储中，以便在聊天页面使用
    const assessmentData = {
      score,
      categoryScores,
      resultMessage: getResultMessage(),
      categoryAdvice: getCategoryAdvice(),
      userName: userName || '用户',
      completedAt: new Date().toISOString()
    };
    
    localStorage.setItem('assessmentResults', JSON.stringify(assessmentData));
    navigate('/coach');
  };

  const startOver = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResult(false);
    setScore(0);
    setCategoryScores({});
    setUserName('');
  };

  if (showResult) {
    const result = getResultMessage();
    const categoryAdvice = getCategoryAdvice();
    
    return (
      <div className="assessment-page">
        {/* 背景动态元素 */}
        <div className="animated-background">
          <div className="floating-shape shape1"></div>
          <div className="floating-shape shape2"></div>
          <div className="floating-shape shape3"></div>
        </div>
        
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col md={10} lg={8}>
              <Card className="border-0 rounded-4 shadow-lg overflow-hidden">
                <Card.Header className={`bg-gradient-${result.color} text-white p-4 text-center`}>
                  <h2 className="fw-bold mb-0">财务健康评估结果</h2>
                </Card.Header>
                
                <Card.Body className="p-4 p-lg-5">
                  <div className="text-center mb-4">
                    {result.icon}
                    <h3 className={`mt-3 fw-bold text-${result.color}`}>{result.title}</h3>
                  </div>
                  
                  <div className="mb-4">
                    <p className="fs-5">{result.message}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="mb-3">您的总体得分</h4>
                    <div className="d-flex justify-content-between mb-2">
                      <span>总分: {score} / {questions.length * 4}</span>
                      <span className={`fw-bold text-${result.color}`}>{Math.round((score / (questions.length * 4)) * 100)}%</span>
                    </div>
                    <ProgressBar 
                      now={Math.round((score / (questions.length * 4)) * 100)} 
                      variant={result.color}
                      className="progress-bar-thick mb-4" 
                    />
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="mb-3">各方面表现</h4>
                    {Object.entries(categoryScores).map(([category, percentage]) => (
                      <div key={category} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span>{getCategoryName(category)}</span>
                          <span className={getCategoryColorClass(percentage)}>{percentage}%</span>
                        </div>
                        <ProgressBar 
                          now={percentage} 
                          variant={getCategoryVariant(percentage)} 
                          className="progress-bar-thick" 
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="mb-3">个性化建议</h4>
                    <Card className="border-0 bg-light rounded-3">
                      <Card.Body>
                        <ul className="mb-0 ps-3">
                          {categoryAdvice.map((advice, index) => (
                            <li key={index} className="mb-2">{advice}</li>
                          ))}
                        </ul>
                      </Card.Body>
                    </Card>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="mb-3">开始您的财务教练会话</h4>
                    <p>
                      为了让AI财务教练更好地为您服务，请告诉我们您的名字（可选）：
                    </p>
                    <Form.Control
                      type="text"
                      placeholder="请输入您的名字"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="mb-3 rounded-pill"
                    />
                  </div>
                  
                  <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
                    <Button
                      variant={result.color}
                      size="lg"
                      className="rounded-pill btn-glow px-4 py-2 d-flex align-items-center justify-content-center"
                      onClick={handleStartCoaching}
                    >
                      开始AI财务教练对话 <FaArrowRight className="ms-2" />
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="lg"
                      className="rounded-pill px-4 py-2"
                      onClick={startOver}
                    >
                      重新评估
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
        
        {/* 自定义CSS */}
        <style jsx>{`
          .assessment-page {
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
          
          .progress-bar-thick {
            height: 8px;
            border-radius: 4px;
          }
          
          .bg-gradient-success {
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          }
          
          .bg-gradient-primary {
            background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
          }
          
          .bg-gradient-info {
            background: linear-gradient(135deg, #36b9cc 0%, #258391 100%);
          }
          
          .bg-gradient-warning {
            background: linear-gradient(135deg, #f6c23e 0%, #dda20a 100%);
          }
          
          .bg-gradient-secondary {
            background: linear-gradient(135deg, #858796 0%, #60616f 100%);
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
  }

  const question = questions[currentQuestion];
  
  // 获取分类名称
  function getCategoryName(category) {
    const categoryNames = {
      savings: '储蓄能力',
      risk: '风险管理',
      emergency: '应急准备',
      debt: '债务管理',
      knowledge: '财务知识',
      income: '收入稳定性',
      goals: '财务目标',
      tracking: '支出追踪',
      insurance: '保险保障',
      pressure: '应对能力'
    };
    return categoryNames[category] || category;
  }
  
  // 根据百分比获取颜色类
  function getCategoryColorClass(percentage) {
    if (percentage >= 75) return 'text-success fw-bold';
    if (percentage >= 50) return 'text-info fw-bold';
    if (percentage >= 25) return 'text-warning fw-bold';
    return 'text-danger fw-bold';
  }
  
  // 根据百分比获取进度条变体
  function getCategoryVariant(percentage) {
    if (percentage >= 75) return 'success';
    if (percentage >= 50) return 'info';
    if (percentage >= 25) return 'warning';
    return 'danger';
  }

  return (
    <div className="assessment-page">
      {/* 背景动态元素 */}
      <div className="animated-background">
        <div className="floating-shape shape1"></div>
        <div className="floating-shape shape2"></div>
        <div className="floating-shape shape3"></div>
      </div>
      
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <div className="text-center mb-4">
              <EnhancedBadge bg="primary" className="mb-3">
                <span className="fw-medium text-white">财务评估</span>
              </EnhancedBadge>
              <h1 className="display-5 fw-bold mb-3">财务健康问卷</h1>
              <p className="lead text-muted">
                通过回答以下问题，我们将为您提供个性化的财务健康评估和建议。
              </p>
            </div>
            
            <Card className="border-0 rounded-4 shadow-lg">
              <Card.Body className="p-4 p-lg-5">
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="fs-5 fw-medium">{`问题 ${currentQuestion + 1} / ${questions.length}`}</span>
                    <span className="badge bg-primary rounded-pill px-3 py-2">{getCategoryName(question.category)}</span>
                  </div>
                  <ProgressBar 
                    now={((currentQuestion + 1) / questions.length) * 100} 
                    variant="primary" 
                    className="progress-bar-thick mb-4" 
                  />
                  
                  <h2 className="fs-4 fw-bold mb-4">{question.question}</h2>
                  
                  <div className="d-flex flex-column gap-3">
                    {question.options.map((option) => (
                      <Button
                        key={option.id}
                        variant="outline-primary"
                        className="text-start p-3 rounded-3 option-button d-flex align-items-center justify-content-between"
                        onClick={() => handleAnswer(question.id, option.id, option.score, question.category)}
                      >
                        <span>{option.text}</span>
                        <FaArrowRight className="option-arrow" />
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="d-flex justify-content-between align-items-center mt-5">
                  <Button 
                    variant="outline-secondary" 
                    className="rounded-pill px-3 py-2"
                    onClick={() => currentQuestion > 0 && setCurrentQuestion(currentQuestion - 1)}
                    disabled={currentQuestion === 0}
                  >
                    上一题
                  </Button>
                  
                  <span className="text-muted">
                    {currentQuestion + 1} 共 {questions.length} 题
                  </span>
                  
                  {currentQuestion < questions.length - 1 && (
                    <Button 
                      variant="outline-primary"
                      className="rounded-pill px-3 py-2"
                      onClick={() => setCurrentQuestion(currentQuestion + 1)}
                    >
                      跳过此题
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      {/* 自定义CSS */}
      <style jsx>{`
        .assessment-page {
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
        
        .progress-bar-thick {
          height: 8px;
          border-radius: 4px;
        }
        
        .option-button {
          transition: all 0.3s ease;
        }
        
        .option-button:hover {
          background-color: #4e73df;
          color: white;
          transform: translateY(-2px);
        }
        
        .option-arrow {
          opacity: 0;
          transform: translateX(-10px);
          transition: all 0.3s ease;
        }
        
        .option-button:hover .option-arrow {
          opacity: 1;
          transform: translateX(0);
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
      `}</style>
    </div>
  );
};

export default Assessment; 