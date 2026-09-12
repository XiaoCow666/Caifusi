/**
 * Assessment 历史页「总分百分比」渲染口径回归测试（跨模块契约）
 * ------------------------------------------------------------------
 * 背景：后端 /api/assessment/submit 曾把 1~4 分制的平均分写进语义为 0~100 得分率
 *       的 total_score_percentage（backend/schema.sql:37「评分百分比/得分率」），
 *       后端修复见 backend/tests/test_assessment_score_scale.py。
 *
 * 本文件锁定链路的最后一环——用户最终看到的反馈：
 *
 *   用户答题 → Assessment.js:431 算得 0~100 → POST /assessment/submit
 *            → GET /assessment/history → Assessment.js:610 取 pct
 *            → 历史卡片文本 / 进度条 / 配色档位（Assessment.js:628 / :632 / :171）
 *
 * 断言方式：用真实后端返回的记录形状喂给组件，断言界面上的总分文本与配色档位。
 *   修复后：满分记录 → 界面显示 100%、进度条为 success 档
 *   修复前：同一次提交落库为 4.0 → 界面显示 4%、进度条被判为 danger 档（红色）
 *   后者作为「症状固证」用例保留，用于说明缺陷完全来自服务端写入值，
 *   组件本身是忠实的渲染方（故本次不改动任何前端代码）。
 *
 * 运行命令：CI=true npm test -- --watchAll=false --testPathPattern=Assessment.historyScale
 */

import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { getAssessmentHistory } from '../services/api';
import Assessment from './Assessment';

// 只替换网络层：组件与渲染逻辑均为被测真实代码
// （jest.mock 由 babel-jest 提升到 import 之前，运行时语义与写在顶部一致）
jest.mock('../services/api', () => ({
  getAssessmentHistory: jest.fn(),
  submitAssessmentNew: jest.fn(),
}));

/** 后端 /assessment/history 一条记录的完整形状（对照 assessment_routes.get_history）。 */
const makeRecord = (percentage, timestamp) => ({
  id: 'assessments_0',
  timestamp,
  total_score_percentage: percentage,
  category_scores_percentage: {
    savings: 100, risk: 100, emergency: 100, debt: 100, knowledge: 100,
    income: 100, goals: 100, tracking: 100, insurance: 100, pressure: 100,
  },
  recommendations: [],
  completed: true,
});

/**
 * 历史卡片中「总分」元素（Assessment.js:615-628 内唯一带 fs-5 的 fw-bold span）。
 * 各维度 chip 用 .cat-chip-val，趋势图 y 轴刻度在 SVG <text> 内，均不会命中该选择器。
 */
const totalScore = (text) =>
  screen.queryByText(text, { selector: '.history-card .fw-bold.fs-5' });

const renderHistory = async (record) => {
  getAssessmentHistory.mockResolvedValue({ history: [record], total: 1 });
  render(
    <MemoryRouter>
      <Assessment />
    </MemoryRouter>
  );
  // 首页「历史记录」卡片 → openHistory() → getAssessmentHistory()
  fireEvent.click(screen.getByText('查看历史'));
  await waitFor(() => expect(getAssessmentHistory).toHaveBeenCalled());
};

describe('Assessment 历史页总分百分比渲染', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('修复后的记录（100.0）渲染为 100%，配色为 success 档', async () => {
    await renderHistory(makeRecord(100.0, '2026-09-12T21:00:00'));

    await waitFor(() => expect(totalScore('100%')).not.toBeNull());

    // Assessment.js:171 getCategoryVariant(100) === 'success'
    const bar = screen.getByRole('progressbar');
    expect(bar.className).toContain('bg-success');
    expect(bar.className).not.toContain('bg-danger');
  });

  it('跳题后的合法小百分比（10.0）原样渲染，不被误当作已修复值', async () => {
    await renderHistory(makeRecord(10.0, '2026-09-12T21:00:00'));

    await waitFor(() => expect(totalScore('10%')).not.toBeNull());
    expect(totalScore('100%')).toBeNull();
  });

  it('症状固证：修复前落库的 4.0 会被渲染成 4%（满分显示为红色的 danger 档）', async () => {
    // 该值即修复前后端对「满分提交」实际落库的内容
    await renderHistory(makeRecord(4.0, '2026-09-12T21:00:00'));

    await waitFor(() => expect(totalScore('4%')).not.toBeNull());
    // Assessment.js:171 getCategoryVariant(4) === 'danger'
    expect(screen.getByRole('progressbar').className).toContain('bg-danger');
  });

  it('无历史记录时仍渲染空态（兼容路径）', async () => {
    getAssessmentHistory.mockResolvedValue({ history: [], total: 0 });
    render(
      <MemoryRouter>
        <Assessment />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('查看历史'));

    expect(await screen.findByText('暂无历史记录')).not.toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});
