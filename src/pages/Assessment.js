import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, ProgressBar, Badge, Spinner, Alert } from 'react-bootstrap';
import {
  FaCheckCircle, FaArrowRight, FaChartPie, FaLightbulb, FaCoins,
  FaHistory, FaClipboardList, FaChartLine, FaArrowLeft, FaTrophy,
  FaSave
} from 'react-icons/fa';
import { submitAssessmentNew, getAssessmentHistory } from '../services/api';

// ─────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────

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

const CATEGORY_NAMES = {
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

// Colors for the sparkline chart lines
const LINE_COLORS = {
  total: '#4e73df',
  savings: '#1cc88a',
  risk: '#f6c23e',
  emergency: '#36b9cc',
  debt: '#e74a3b',
  knowledge: '#858796',
  income: '#fd7e14',
  goals: '#6f42c1',
  tracking: '#20c9a6',
  insurance: '#e83e8c',
  pressure: '#6610f2',
};

// ─────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────

function getCategoryName(category) {
  return CATEGORY_NAMES[category] || category;
}

function getCategoryColorClass(percentage) {
  if (percentage >= 75) return 'text-success fw-bold';
  if (percentage >= 50) return 'text-info fw-bold';
  if (percentage >= 25) return 'text-warning fw-bold';
  return 'text-danger fw-bold';
}

function getCategoryVariant(percentage) {
  if (percentage >= 75) return 'success';
  if (percentage >= 50) return 'info';
  if (percentage >= 25) return 'warning';
  return 'danger';
}

function getResultMessage(score) {
  const maxPossibleScore = questions.length * 4;
  const percentage = (score / maxPossibleScore) * 100;

  if (percentage >= 85) {
    return { title: '金融规划大师', message: '您展示了卓越的财务管理能力，拥有健全的财务系统和优秀的理财习惯。', icon: <FaCheckCircle className="text-success" size={48} />, color: 'success', percentage };
  } else if (percentage >= 70) {
    return { title: '优秀的财务规划者', message: '您在财务管理方面表现出色，具备良好的财务习惯和知识，但仍有提升空间。', icon: <FaCheckCircle className="text-primary" size={48} />, color: 'primary', percentage };
  } else if (percentage >= 55) {
    return { title: '稳健的财务管理者', message: '您对财务有基本的了解和规划，建议加强应急资金储备并优化投资策略。', icon: <FaChartPie className="text-info" size={48} />, color: 'info', percentage };
  } else if (percentage >= 40) {
    return { title: '财务成长阶段', message: '您在财务管理方面有一定基础，但需要更多关注。建立系统化预算和应急基金将帮助您改善。', icon: <FaLightbulb className="text-warning" size={48} />, color: 'warning', percentage };
  } else {
    return { title: '财务起步阶段', message: '您可能正面临一些财务挑战，但别担心。从建立基本预算和储蓄习惯开始，逐步改善财务状况。', icon: <FaCoins className="text-secondary" size={48} />, color: 'secondary', percentage };
  }
}

function formatDate(ts) {
  if (!ts) return '未知日期';
  const d = new Date(ts);
  if (isNaN(d)) return ts;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────
// SVG Sparkline Chart Component
// ─────────────────────────────────────────────────

const SparklineChart = ({ history }) => {
  const W = 700;
  const H = 240;
  const PADDING = { top: 20, right: 20, bottom: 40, left: 44 };
  const chartW = W - PADDING.left - PADDING.right;
  const chartH = H - PADDING.top - PADDING.bottom;

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-4 text-muted">
        <FaChartLine size={40} className="mb-2 opacity-25" />
        <p className="mb-0">暂无数据，完成评估后即可查看趋势图</p>
      </div>
    );
  }

  // Reverse → chronological order for chart
  const sorted = [...history].reverse();
  const n = sorted.length;

  const xScale = (i) => PADDING.left + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  const yScale = (v) => PADDING.top + chartH - (v / 100) * chartH;

  const buildPath = (values) => {
    return values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ');
  };

  // Collect all categories present across records
  const allCategories = Array.from(
    new Set(sorted.flatMap(r => Object.keys(r.category_scores_percentage || {})))
  );

  const totalValues = sorted.map(r => Number(r.total_score_percentage) || 0);

  // Y-axis grid lines
  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div className="sparkline-wrapper">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Grid lines */}
        {yTicks.map(tick => (
          <g key={tick}>
            <line
              x1={PADDING.left} y1={yScale(tick)}
              x2={W - PADDING.right} y2={yScale(tick)}
              stroke="#e9ecef" strokeWidth="1"
            />
            <text
              x={PADDING.left - 8} y={yScale(tick) + 4}
              textAnchor="end" fontSize="11" fill="#adb5bd"
            >{tick}%</text>
          </g>
        ))}

        {/* X-axis labels */}
        {sorted.map((r, i) => (
          <text
            key={i}
            x={xScale(i)} y={H - 6}
            textAnchor="middle" fontSize="10" fill="#adb5bd"
          >
            {formatDate(r.timestamp).slice(5)}
          </text>
        ))}

        {/* Category lines (faint, behind total) */}
        {allCategories.map(cat => {
          const values = sorted.map(r => Number((r.category_scores_percentage || {})[cat]) || 0);
          return (
            <path
              key={cat}
              d={buildPath(values)}
              fill="none"
              stroke={LINE_COLORS[cat] || '#ccc'}
              strokeWidth="1.5"
              strokeDasharray="4 3"
              opacity="0.55"
            />
          );
        })}

        {/* Total score line (prominent) */}
        <path
          d={buildPath(totalValues)}
          fill="none"
          stroke={LINE_COLORS.total}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data point dots for total */}
        {totalValues.map((v, i) => (
          <g key={i}>
            <circle cx={xScale(i)} cy={yScale(v)} r="5" fill="white" stroke={LINE_COLORS.total} strokeWidth="2.5" />
            <text
              x={xScale(i)} y={yScale(v) - 10}
              textAnchor="middle" fontSize="11"
              fill={LINE_COLORS.total} fontWeight="600"
            >{Math.round(v)}%</text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="d-flex flex-wrap gap-2 mt-2 px-2">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: LINE_COLORS.total, width: 12, height: 4, borderRadius: 2, display: 'inline-block', marginRight: 4 }} />
          <small className="text-muted">总分</small>
        </span>
        {allCategories.slice(0, 6).map(cat => (
          <span key={cat} className="legend-item d-flex align-items-center gap-1">
            <span style={{ width: 10, height: 3, borderRadius: 2, display: 'inline-block', background: LINE_COLORS[cat] || '#ccc', opacity: 0.7 }} />
            <small className="text-muted">{getCategoryName(cat)}</small>
          </span>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────
// Badge component
// ─────────────────────────────────────────────────

const EnhancedBadge = ({ children, bg, className = '' }) => (
  <Badge
    bg={bg}
    className={`custom-badge px-3 py-2 rounded-pill fw-normal position-relative overflow-hidden ${className}`}
  >
    <span className="badge-content position-relative">{children}</span>
    <span className="badge-glow" />
  </Badge>
);

// ─────────────────────────────────────────────────
// Animated background
// ─────────────────────────────────────────────────

const AnimatedBg = () => (
  <div className="animated-background">
    <div className="floating-shape shape1" />
    <div className="floating-shape shape2" />
    <div className="floating-shape shape3" />
  </div>
);

// ─────────────────────────────────────────────────
// Main Assessment Component
// ─────────────────────────────────────────────────

const Assessment = () => {
  // view: 'home' | 'quiz' | 'result' | 'history'
  const [view, setView] = useState('home');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [categoryScores, setCategoryScores] = useState({});
  const [userName, setUserName] = useState('');

  // History state
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'success' | 'error'

  const navigate = useNavigate();

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await getAssessmentHistory();
      setHistoryData(data.history || []);
    } catch (err) {
      setHistoryError('获取历史记录失败，请检查服务是否运行。');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const handleAnswer = (questionId, optionId, optionScore, category) => {
    const newAnswers = {
      ...answers,
      [questionId]: { optionId, score: optionScore, category }
    };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults(newAnswers);
      setView('result');
    }
  };

  const calculateResults = (resultAnswers) => {
    const totalScore = Object.values(resultAnswers).reduce((sum, a) => sum + a.score, 0);
    setScore(totalScore);

    const categories = {};
    const categoryCounts = {};
    Object.values(resultAnswers).forEach(answer => {
      const cat = answer.category;
      if (!categories[cat]) { categories[cat] = 0; categoryCounts[cat] = 0; }
      categories[cat] += answer.score;
      categoryCounts[cat]++;
    });

    const categoryPercentages = {};
    Object.keys(categories).forEach(cat => {
      const max = categoryCounts[cat] * 4;
      categoryPercentages[cat] = Math.round((categories[cat] / max) * 100);
    });
    setCategoryScores(categoryPercentages);
  };

  const handleSaveResult = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const totalPct = Math.round((score / (questions.length * 4)) * 100);
      await submitAssessmentNew({
        answers,
        scores: Object.fromEntries(
          Object.entries(answers).map(([qid, a]) => [a.category, a.score])
        ),
        categoryScores,
        total_score_percentage: totalPct,
      });
      setSaveStatus('success');
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleStartCoaching = () => {
    const assessmentData = {
      score,
      categoryScores,
      resultMessage: getResultMessage(score),
      userName: userName || '用户',
      completedAt: new Date().toISOString()
    };
    localStorage.setItem('assessmentResults', JSON.stringify(assessmentData));
    navigate('/coach');
  };

  const startOver = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setScore(0);
    setCategoryScores({});
    setUserName('');
    setSaveStatus(null);
    setView('quiz');
  };

  const goHome = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setScore(0);
    setCategoryScores({});
    setUserName('');
    setSaveStatus(null);
    setView('home');
  };

  const openHistory = () => {
    setView('history');
    fetchHistory();
  };

  // ── HOME VIEW ──
  if (view === 'home') {
    return (
      <div className="assessment-page">
        <AnimatedBg />
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col md={10} lg={8}>
              <div className="text-center mb-5">
                <EnhancedBadge bg="primary" className="mb-3">
                  <span className="fw-medium text-white">财务健康评估</span>
                </EnhancedBadge>
                <h1 className="display-5 fw-bold mb-3">心智评估中心</h1>
                <p className="lead text-muted">
                  通过科学的财务问卷，了解您的财务健康状况，获取个性化建议。
                </p>
              </div>

              <Row className="g-4">
                <Col md={6}>
                  <Card
                    className="border-0 rounded-4 shadow-lg h-100 home-card"
                    onClick={() => setView('quiz')}
                    style={{ cursor: 'pointer' }}
                  >
                    <Card.Body className="p-4 d-flex flex-column align-items-center text-center">
                      <div className="home-card-icon mb-3" style={{ background: 'linear-gradient(135deg,#4e73df,#224abe)' }}>
                        <FaClipboardList size={32} color="white" />
                      </div>
                      <h4 className="fw-bold mb-2">开始新评估</h4>
                      <p className="text-muted mb-4">回答10道问题，获得全面的财务健康分析与个性化建议。</p>
                      <Button variant="primary" className="rounded-pill px-4 mt-auto btn-glow">
                        立即开始 <FaArrowRight className="ms-2" />
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card
                    className="border-0 rounded-4 shadow-lg h-100 home-card"
                    onClick={openHistory}
                    style={{ cursor: 'pointer' }}
                  >
                    <Card.Body className="p-4 d-flex flex-column align-items-center text-center">
                      <div className="home-card-icon mb-3" style={{ background: 'linear-gradient(135deg,#1cc88a,#13855c)' }}>
                        <FaHistory size={32} color="white" />
                      </div>
                      <h4 className="fw-bold mb-2">历史记录</h4>
                      <p className="text-muted mb-4">查看过往所有评估记录，通过折线图追踪您的财务心智成长轨迹。</p>
                      <Button variant="success" className="rounded-pill px-4 mt-auto btn-glow-green">
                        查看历史 <FaChartLine className="ms-2" />
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
        <AssessmentStyles />
      </div>
    );
  }

  // ── HISTORY VIEW ──
  if (view === 'history') {
    return (
      <div className="assessment-page">
        <AnimatedBg />
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col md={11} lg={10}>
              <div className="d-flex align-items-center mb-4">
                <Button variant="outline-secondary" className="rounded-pill me-3" onClick={goHome}>
                  <FaArrowLeft className="me-2" />返回
                </Button>
                <div>
                  <h2 className="fw-bold mb-0">评估历史记录</h2>
                  <p className="text-muted mb-0 small">追踪您的财务心智成长轨迹</p>
                </div>
              </div>

              {/* Sparkline chart card */}
              <Card className="border-0 rounded-4 shadow-lg mb-4">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <FaChartLine className="text-primary" />
                    综合分数趋势
                  </h5>
                  {historyLoading ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" variant="primary" />
                      <p className="text-muted mt-2 mb-0">加载中...</p>
                    </div>
                  ) : historyError ? (
                    <Alert variant="warning" className="mb-0">{historyError}</Alert>
                  ) : (
                    <SparklineChart history={historyData} />
                  )}
                </Card.Body>
              </Card>

              {/* History list */}
              {!historyLoading && !historyError && (
                <>
                  <h5 className="fw-bold mb-3">
                    历史评估记录
                    {historyData.length > 0 && (
                      <Badge bg="secondary" className="ms-2 rounded-pill">{historyData.length} 次</Badge>
                    )}
                  </h5>
                  {historyData.length === 0 ? (
                    <Card className="border-0 rounded-4 shadow text-center py-5">
                      <Card.Body>
                        <FaClipboardList size={48} className="text-muted mb-3 opacity-25" />
                        <h5 className="text-muted">暂无历史记录</h5>
                        <p className="text-muted mb-4">完成第一次评估后，记录将显示在这里。</p>
                        <Button variant="primary" className="rounded-pill px-4" onClick={() => setView('quiz')}>
                          立即评估
                        </Button>
                      </Card.Body>
                    </Card>
                  ) : (
                    <Row className="g-3">
                      {historyData.map((record, index) => {
                        const pct = Number(record.total_score_percentage) || 0;
                        const variant = getCategoryVariant(pct);
                        const catScores = record.category_scores_percentage || {};
                        return (
                          <Col xs={12} key={record.id || index}>
                            <Card className="border-0 rounded-4 shadow history-card">
                              <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                                  <div>
                                    <span className="text-muted small">
                                      第 {historyData.length - index} 次评估 · {formatDate(record.timestamp)}
                                    </span>
                                    {index === 0 && (
                                      <Badge bg="primary" className="ms-2 rounded-pill">最新</Badge>
                                    )}
                                  </div>
                                  <div className="d-flex align-items-center gap-2">
                                    <FaTrophy className={`text-${variant}`} />
                                    <span className={`fw-bold fs-5 text-${variant}`}>{Math.round(pct)}%</span>
                                  </div>
                                </div>

                                <ProgressBar
                                  now={pct}
                                  variant={variant}
                                  className="progress-bar-thick mb-3"
                                />

                                {Object.keys(catScores).length > 0 && (
                                  <Row className="g-2">
                                    {Object.entries(catScores).map(([cat, val]) => (
                                      <Col xs={6} sm={4} md={3} key={cat}>
                                        <div className="cat-chip">
                                          <div className="cat-chip-name">{getCategoryName(cat)}</div>
                                          <div className={`cat-chip-val ${getCategoryColorClass(val)}`}>{val}%</div>
                                        </div>
                                      </Col>
                                    ))}
                                  </Row>
                                )}
                              </Card.Body>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  )}
                </>
              )}
            </Col>
          </Row>
        </Container>
        <AssessmentStyles />
      </div>
    );
  }

  // ── RESULT VIEW ──
  if (view === 'result') {
    const result = getResultMessage(score);
    const maxScore = questions.length * 4;
    const pct = Math.round((score / maxScore) * 100);

    return (
      <div className="assessment-page">
        <AnimatedBg />
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

                  <p className="fs-5 mb-4">{result.message}</p>

                  {/* Total score */}
                  <div className="mb-4">
                    <h4 className="mb-3">您的总体得分</h4>
                    <div className="d-flex justify-content-between mb-2">
                      <span>总分: {score} / {maxScore}</span>
                      <span className={`fw-bold text-${result.color}`}>{pct}%</span>
                    </div>
                    <ProgressBar now={pct} variant={result.color} className="progress-bar-thick mb-4" />
                  </div>

                  {/* Category scores */}
                  <div className="mb-4">
                    <h4 className="mb-3">各方面表现</h4>
                    {Object.entries(categoryScores).map(([category, percentage]) => (
                      <div key={category} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span>{getCategoryName(category)}</span>
                          <span className={getCategoryColorClass(percentage)}>{percentage}%</span>
                        </div>
                        <ProgressBar now={percentage} variant={getCategoryVariant(percentage)} className="progress-bar-thick" />
                      </div>
                    ))}
                  </div>

                  {/* Save result */}
                  <div className="mb-4">
                    <h4 className="mb-3">保存评估结果</h4>
                    <p className="text-muted small mb-3">将本次结果保存到历史记录，以便日后追踪进步。</p>
                    {saveStatus === 'success' && (
                      <Alert variant="success" className="rounded-3">
                        <FaCheckCircle className="me-2" />已保存到历史记录！
                      </Alert>
                    )}
                    {saveStatus === 'error' && (
                      <Alert variant="danger" className="rounded-3">
                        保存失败，请检查服务是否正常运行。
                      </Alert>
                    )}
                    {saveStatus !== 'success' && (
                      <div className="d-flex align-items-center">
                        <Button
                          variant="outline-primary"
                          className="rounded-pill px-4 me-3"
                          onClick={handleSaveResult}
                          disabled={saving}
                        >
                          {saving ? <Spinner animation="border" size="sm" className="me-2" /> : <FaSave className="me-2" />}
                          保存结果
                        </Button>
                        <Button
                          variant="outline-secondary"
                          className="rounded-pill px-4"
                          onClick={openHistory}
                        >
                          <FaHistory className="me-2" />查看历史
                        </Button>
                      </div>
                    )}
                    {saveStatus === 'success' && (
                      <Button
                        variant="outline-success"
                        className="rounded-pill px-4"
                        onClick={openHistory}
                      >
                        <FaHistory className="me-2" />查看历史
                      </Button>
                    )}
                  </div>

                  {/* Start coaching */}
                  <div className="mb-4">
                    <h4 className="mb-3">开始财务教练会话</h4>
                    <Form.Control
                      type="text"
                      placeholder="请输入您的名字（可选）"
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
                    <Button
                      variant="outline-dark"
                      size="lg"
                      className="rounded-pill px-4 py-2"
                      onClick={goHome}
                    >
                      返回主页
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
        <AssessmentStyles />
      </div>
    );
  }

  // ── QUIZ VIEW ──
  const question = questions[currentQuestion];

  return (
    <div className="assessment-page">
      <AnimatedBg />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <div className="d-flex align-items-center mb-4">
              <Button variant="outline-secondary" className="rounded-pill me-3" onClick={goHome}>
                <FaArrowLeft className="me-2" />主页
              </Button>
              <div className="text-center flex-grow-1">
                <EnhancedBadge bg="primary" className="mb-2">
                  <span className="fw-medium text-white">财务评估</span>
                </EnhancedBadge>
                <h1 className="display-6 fw-bold mb-0">财务健康问卷</h1>
              </div>
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
                  <span className="text-muted">{currentQuestion + 1} 共 {questions.length} 题</span>
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
      <AssessmentStyles />
    </div>
  );
};

// ─────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────

const AssessmentStyles = () => (
  <style>{`
    .assessment-page {
      position: relative;
      min-height: 100vh;
      padding-bottom: 3rem;
    }

    .animated-background {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
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

    .shape1 { width: 300px; height: 300px; top: -150px; left: 10%; animation-delay: 0s; }
    .shape2 { width: 200px; height: 200px; top: 30%; right: -100px; animation-delay: 2s; background: rgba(34,74,190,0.05); }
    .shape3 { width: 250px; height: 250px; bottom: -125px; left: 20%; animation-delay: 4s; background: rgba(92,159,247,0.05); }

    @keyframes float {
      0%   { transform: translateY(0) rotate(0deg) scale(1); }
      50%  { transform: translateY(30px) rotate(10deg) scale(1.05); }
      100% { transform: translateY(0) rotate(0deg) scale(1); }
    }

    .progress-bar-thick { height: 8px; border-radius: 4px; }

    /* Gradient header colours */
    .bg-gradient-success  { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); }
    .bg-gradient-primary  { background: linear-gradient(135deg, #4e73df 0%, #224abe 100%); }
    .bg-gradient-info     { background: linear-gradient(135deg, #36b9cc 0%, #258391 100%); }
    .bg-gradient-warning  { background: linear-gradient(135deg, #f6c23e 0%, #dda20a 100%); }
    .bg-gradient-secondary{ background: linear-gradient(135deg, #858796 0%, #60616f 100%); }

    /* Glow buttons */
    .btn-glow {
      box-shadow: 0 0 10px rgba(78,115,223,0.3);
      transition: all 0.3s ease;
      border: none;
    }
    .btn-glow:hover { box-shadow: 0 0 20px rgba(78,115,223,0.5); transform: translateY(-2px); }
    .btn-glow-green {
      box-shadow: 0 0 10px rgba(28,200,138,0.3);
      transition: all 0.3s ease;
      border: none;
    }
    .btn-glow-green:hover { box-shadow: 0 0 20px rgba(28,200,138,0.5); transform: translateY(-2px); }

    /* Option buttons */
    .option-button { transition: all 0.3s ease; }
    .option-button:hover { background-color: #4e73df; color: white; transform: translateY(-2px); }
    .option-arrow { opacity: 0; transform: translateX(-10px); transition: all 0.3s ease; }
    .option-button:hover .option-arrow { opacity: 1; transform: translateX(0); }

    /* Home cards */
    .home-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
    .home-card:hover { transform: translateY(-6px); box-shadow: 0 1rem 2rem rgba(0,0,0,0.12) !important; }
    .home-card-icon {
      width: 72px; height: 72px;
      border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 16px rgba(0,0,0,0.15);
    }

    /* History cards */
    .history-card { transition: transform 0.2s ease; }
    .history-card:hover { transform: translateY(-3px); }

    /* Category chip */
    .cat-chip {
      background: #f8f9fa;
      border-radius: 10px;
      padding: 6px 10px;
      font-size: 0.78rem;
    }
    .cat-chip-name { color: #6c757d; margin-bottom: 2px; }
    .cat-chip-val { font-weight: 700; font-size: 0.88rem; }

    /* Badge */
    .custom-badge {
      display: inline-flex; align-items: center; justify-content: center;
      background-image: linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0.2));
      backdrop-filter: blur(5px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }
    .badge-content { z-index: 1; }
    .badge-glow {
      position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
      background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
      transform: rotate(30deg);
      animation: badgeGlow 3s ease-in-out infinite;
    }
    @keyframes badgeGlow {
      0%   { transform: translateX(-100%) rotate(30deg); }
      100% { transform: translateX(100%) rotate(30deg); }
    }

    /* Sparkline */
    .sparkline-wrapper { overflow-x: auto; }
    .legend-item { display: flex; align-items: center; gap: 4px; }
  `}</style>
);

export default Assessment;