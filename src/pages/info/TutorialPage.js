import React, { useState } from 'react';
import InfoPageHeader from './InfoPageHeader';
import { FaVideo, FaBook, FaUser, FaChartBar, FaCog, FaGraduationCap, FaSearch } from 'react-icons/fa';

const TutorialPage = () => {
  // 状态
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeDifficulty, setActiveDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 教程分类
  const categories = [
    { id: 'all', name: '全部', icon: <FaBook /> },
    { id: 'getting-started', name: '入门指南', icon: <FaUser /> },
    { id: 'assessment', name: '财务评估', icon: <FaChartBar /> },
    { id: 'coaching', name: 'AI教练', icon: <FaGraduationCap /> },
    { id: 'settings', name: '设置与账户', icon: <FaCog /> }
  ];

  // 难度级别
  const difficulties = [
    { id: 'all', name: '所有难度' },
    { id: 'beginner', name: '初级' },
    { id: 'intermediate', name: '中级' },
    { id: 'advanced', name: '高级' }
  ];

  // 教程数据
  const tutorials = [
    {
      id: 1,
      title: '如何注册和设置您的账户',
      description: '本教程指导您完成财赋思账户的注册流程和初始设置，包括个人资料完善和偏好设置。',
      category: 'getting-started',
      difficulty: 'beginner',
      type: 'video',
      duration: '3:45',
      thumbnail: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
      featured: true
    },
    {
      id: 2,
      title: '完成您的首次财务健康评估',
      description: '了解如何填写财务健康评估问卷，获取您的初始财务健康分数和个性化报告。',
      category: 'assessment',
      difficulty: 'beginner',
      type: 'video',
      duration: '5:20',
      thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 3,
      title: '与AI教练进行首次对话',
      description: '学习如何与AI金融教练进行有效对话，提出正确的问题以获取有价值的财务建议。',
      category: 'coaching',
      difficulty: 'beginner',
      type: 'article',
      readTime: '5 分钟',
      thumbnail: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 4,
      title: '设置您的财务目标',
      description: '本教程指导您如何在系统中设置明确、可衡量的财务目标，并跟踪进度。',
      category: 'getting-started',
      difficulty: 'beginner',
      type: 'video',
      duration: '4:15',
      thumbnail: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 5,
      title: '理解您的财务健康报告',
      description: '深入解析财务健康报告中的各项指标，了解它们的含义以及如何改善这些指标。',
      category: 'assessment',
      difficulty: 'intermediate',
      type: 'video',
      duration: '8:30',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
      featured: true
    },
    {
      id: 6,
      title: '高级AI教练功能：情景分析',
      description: '学习如何使用AI教练的情景分析功能，模拟不同财务决策的潜在结果和长期影响。',
      category: 'coaching',
      difficulty: 'advanced',
      type: 'article',
      readTime: '10 分钟',
      thumbnail: 'https://images.unsplash.com/photo-1617791160536-598cf32026fb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 7,
      title: '账户安全设置与隐私保护',
      description: '了解如何配置双重认证、管理第三方接入权限以及设置数据分享偏好，保护您的财务信息安全。',
      category: 'settings',
      difficulty: 'intermediate',
      type: 'video',
      duration: '6:50',
      thumbnail: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 8,
      title: '自定义您的学习路径',
      description: '根据您的学习偏好和财务目标，定制个性化的金融教育内容和学习计划。',
      category: 'getting-started',
      difficulty: 'intermediate',
      type: 'article',
      readTime: '7 分钟',
      thumbnail: 'https://images.unsplash.com/photo-1571260898938-0fe5057e7208?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 9,
      title: '财务健康评估的季度回顾',
      description: '学习如何分析您的财务健康趋势，识别进步和改进机会，并调整您的财务计划。',
      category: 'assessment',
      difficulty: 'intermediate',
      type: 'video',
      duration: '7:15',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 10,
      title: 'AI教练的专业术语解析功能',
      description: '了解如何使用AI教练解释复杂的金融术语，使专业金融概念变得通俗易懂。',
      category: 'coaching',
      difficulty: 'beginner',
      type: 'article',
      readTime: '4 分钟',
      thumbnail: 'https://images.unsplash.com/photo-1591696205602-2f950c417cb9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 11,
      title: '导出和分享您的财务数据',
      description: '学习如何安全地导出您的财务数据和报告，以及与您的财务顾问共享特定信息。',
      category: 'settings',
      difficulty: 'intermediate',
      type: 'video',
      duration: '5:40',
      thumbnail: 'https://images.unsplash.com/photo-1556742077-0a6b6a4a4ac4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 12,
      title: '高级财务健康评估：压力测试',
      description: '了解如何使用财务健康评估的压力测试功能，评估您的财务状况在不同经济环境下的稳健性。',
      category: 'assessment',
      difficulty: 'advanced',
      type: 'video',
      duration: '9:25',
      thumbnail: 'https://images.unsplash.com/photo-1569025743873-ea3a9ade89f9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
      featured: true
    }
  ];

  // 处理搜索输入
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // 筛选教程
  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesCategory = activeCategory === 'all' || tutorial.category === activeCategory;
    const matchesDifficulty = activeDifficulty === 'all' || tutorial.difficulty === activeDifficulty;
    const matchesSearch = !searchQuery || 
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  // 获取特色教程
  const featuredTutorials = tutorials.filter(tutorial => tutorial.featured);

  return (
    <div className="tutorial-page bg-gray-50 min-h-screen pb-20">
      {/* 页面标题 */}
      <InfoPageHeader 
        title="使用教程" 
        subtitle="学习如何充分利用财赋思的功能，提升您的金融素养"
        category="resources"
      />
      
      <div className="container mx-auto px-4">
        {/* 特色教程 */}
        {!searchQuery && activeCategory === 'all' && activeDifficulty === 'all' && (
          <div className="featured-tutorials mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">推荐教程</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredTutorials.map(tutorial => (
                <div key={tutorial.id} className="relative h-72 rounded-xl overflow-hidden group">
                  <img 
                    src={tutorial.thumbnail} 
                    alt={tutorial.title} 
                    className="absolute w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                    <span className="inline-flex items-center bg-green-600 text-white text-xs px-2 py-1 rounded-full uppercase tracking-wide mb-2">
                      {tutorial.type === 'video' ? <FaVideo className="mr-1" /> : <FaBook className="mr-1" />}
                      {tutorial.type === 'video' ? `视频 · ${tutorial.duration}` : `文章 · ${tutorial.readTime}`}
                    </span>
                    <h3 className="text-xl font-bold text-white mb-2">{tutorial.title}</h3>
                    <p className="text-white/80 text-sm line-clamp-2">{tutorial.description}</p>
                  </div>
                  <a href="#/" className="absolute inset-0" aria-label={`查看 ${tutorial.title} 教程`}></a>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 搜索和筛选 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="搜索教程..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className="text-sm text-gray-600">分类:</span>
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className="text-sm text-gray-600">难度:</span>
              <select
                value={activeDifficulty}
                onChange={(e) => setActiveDifficulty(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty.id} value={difficulty.id}>{difficulty.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* 筛选标签 */}
          {(activeCategory !== 'all' || activeDifficulty !== 'all' || searchQuery) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchQuery && (
                <span className="inline-flex items-center bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                  搜索: "{searchQuery}"
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >×</button>
                </span>
              )}
              
              {activeCategory !== 'all' && (
                <span className="inline-flex items-center bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                  分类: {categories.find(c => c.id === activeCategory)?.name}
                  <button 
                    onClick={() => setActiveCategory('all')}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >×</button>
                </span>
              )}
              
              {activeDifficulty !== 'all' && (
                <span className="inline-flex items-center bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                  难度: {difficulties.find(d => d.id === activeDifficulty)?.name}
                  <button 
                    onClick={() => setActiveDifficulty('all')}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >×</button>
                </span>
              )}
              
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                  setActiveDifficulty('all');
                }}
                className="ml-auto text-sm text-green-600 hover:text-green-800"
              >
                清除所有筛选
              </button>
            </div>
          )}
        </div>
        
        {/* 教程列表 */}
        {filteredTutorials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map(tutorial => (
              <div key={tutorial.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  <img 
                    src={tutorial.thumbnail} 
                    alt={tutorial.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-0 right-0 m-3">
                    <span className={`inline-block px-2 py-1 text-xs font-bold text-white rounded-full ${
                      tutorial.difficulty === 'beginner' ? 'bg-green-500' :
                      tutorial.difficulty === 'intermediate' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}>
                      {
                        tutorial.difficulty === 'beginner' ? '初级' :
                        tutorial.difficulty === 'intermediate' ? '中级' :
                        '高级'
                      }
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="inline-flex items-center text-xs font-medium text-gray-500">
                      {categories.find(c => c.id === tutorial.category)?.icon}
                      <span className="ml-1">{categories.find(c => c.id === tutorial.category)?.name}</span>
                    </span>
                    <span className="inline-flex items-center text-xs font-medium text-gray-500">
                      {tutorial.type === 'video' ? <FaVideo className="mr-1" /> : <FaBook className="mr-1" />}
                      {tutorial.type === 'video' ? tutorial.duration : tutorial.readTime}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{tutorial.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{tutorial.description}</p>
                  <a 
                    href="#/" 
                    className="inline-block text-green-600 font-medium hover:text-green-800 transition-colors"
                  >
                    {tutorial.type === 'video' ? '观看视频' : '阅读教程'} →
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-5xl text-gray-300 mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">未找到相关教程</h3>
            <p className="text-gray-600 mb-6">
              尝试调整搜索关键词或筛选条件
            </p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
                setActiveDifficulty('all');
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              查看所有教程
            </button>
          </div>
        )}
        
        {/* 教学课程广告 */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            <div className="lg:col-span-3 p-8 lg:p-12">
              <h2 className="text-3xl font-bold text-white mb-4">完整的金融素养课程</h2>
              <p className="text-white/90 mb-6 text-lg">
                除了上述使用教程外，我们还提供完整的金融素养系列课程，帮助您从基础到进阶，全方位提升金融知识和理财能力。
              </p>
              <ul className="space-y-3 text-white/90 mb-8">
                <li className="flex items-center">
                  <span className="h-5 w-5 mr-2 rounded-full bg-white/30 flex items-center justify-center text-white">✓</span>
                  由金融专家精心打造的系统化课程
                </li>
                <li className="flex items-center">
                  <span className="h-5 w-5 mr-2 rounded-full bg-white/30 flex items-center justify-center text-white">✓</span>
                  实用案例和互动练习巩固学习成果
                </li>
                <li className="flex items-center">
                  <span className="h-5 w-5 mr-2 rounded-full bg-white/30 flex items-center justify-center text-white">✓</span>
                  根据学习进度获得专业认证
                </li>
              </ul>
              <a 
                href="#/" 
                className="inline-block bg-white text-blue-700 font-medium px-6 py-3 rounded-md hover:bg-blue-50 transition-colors"
              >
                探索课程
              </a>
            </div>
            <div className="hidden lg:block lg:col-span-2 bg-blue-800">
              <div className="h-full w-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-7xl text-white/20 mb-2">🎓</div>
                  <p className="text-white/60">课程图片</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialPage; 