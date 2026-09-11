import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import InfoPageHeader from './InfoPageHeader';
import { FaFileAlt, FaShieldAlt, FaCookieBite, FaHandshake } from 'react-icons/fa';

const LegalPage = () => {
  const [activeTab, setActiveTab] = useState('privacy-policy');
  
  // 标签数据
  const tabs = [
    { id: 'privacy-policy', name: '隐私政策', icon: <FaShieldAlt /> },
    { id: 'user-agreement', name: '用户协议', icon: <FaHandshake /> },
    { id: 'cookie-policy', name: 'Cookie政策', icon: <FaCookieBite /> },
    { id: 'data-usage', name: '数据使用说明', icon: <FaFileAlt /> }
  ];
  
  // 法律文本内容 (示例文本，实际应用中应当使用专业的法律文本)
  const legalContents = {
    'privacy-policy': {
      title: '隐私政策',
      updatedDate: '2024年1月15日',
      content: `
## 1. 引言

财赋思（"我们"、"我们的"或"本公司"）致力于保护您的个人信息和隐私。本隐私政策详细说明了我们如何收集、使用、分享和保护您的个人信息，以及您对这些信息的控制权。

请在使用我们的服务前仔细阅读本政策。使用财赋思的服务表示您同意本隐私政策中描述的做法。

## 2. 信息收集

### 2.1 您直接提供的信息
- 账户信息：注册时提供的姓名、电子邮件地址、手机号码和密码
- 个人资料信息：年龄、性别、教育背景、职业等
- 财务信息：收入、支出、资产、负债、投资等财务数据

### 2.2 自动收集的信息
- 设备信息：设备类型、操作系统、唯一设备标识符
- 日志信息：IP地址、浏览器类型、访问时间、访问页面
- 使用数据：功能使用情况、学习进度、交互记录

### 2.3 来自第三方的信息
经您授权，我们可能从第三方获取某些信息，例如通过社交媒体登录或金融账户连接服务获取的信息。

## 3. 信息使用

我们使用收集的信息用于：
- 提供、维护和改进我们的服务
- 创建和维护您的账户
- 提供个性化的内容和建议
- 响应您的问题和请求
- 进行研究和分析，改进用户体验
- 发送服务通知和更新
- 防止欺诈和增强安全性

## 4. 信息共享

我们不会出售您的个人信息。我们可能在以下情况下共享您的信息：
- 经您明确同意
- 与服务提供商：帮助我们提供服务的第三方（如云存储提供商）
- 法律要求：遵守法律、法规或法律程序
- 业务转让：与合并、收购或资产出售相关

## 5. 信息安全

我们采取合理的技术和组织措施来保护您的个人信息，包括：
- 数据加密传输和存储
- 定期安全评估
- 员工访问控制和培训
- 安全监控系统

## 6. 您的权利

根据适用法律，您可能拥有以下权利：
- 访问您的个人信息
- 更正不准确的信息
- 删除您的信息
- 限制或反对处理
- 数据可携带权
- 撤回同意

要行使这些权利，请通过privacy@caifusi.com与我们联系。

## 7. Cookie和类似技术

我们使用Cookie和类似技术来收集和存储信息。您可以通过浏览器设置控制Cookie的使用，但这可能影响某些功能的使用。

## 8. 隐私政策的变更

我们可能会不时更新本隐私政策。变更生效前，我们会通过网站通知或电子邮件告知您。继续使用我们的服务表示您同意修订后的政策。

## 9. 联系我们

如果您对本隐私政策有任何疑问，请联系我们的隐私团队：
- 电子邮件：privacy@caifusi.com
- 地址：北京市海淀区中关村科技园区8号楼15层
      `
    },
    'user-agreement': {
      title: '用户协议',
      updatedDate: '2024年1月15日',
      content: `
## 1. 协议接受

欢迎使用财赋思平台（"服务"）。本用户协议（"协议"）是您与财赋思科技有限公司（"财赋思"、"我们"）之间就服务使用达成的法律协议。

使用我们的服务，即表示您同意本协议的条款。如果您不同意这些条款，请勿使用本服务。

## 2. 服务描述

财赋思是一个AI金融心智教练平台，旨在通过人工智能技术提供个性化的金融教育和建议。我们提供的服务包括但不限于：
- 金融素养评估和学习内容
- AI金融教练互动
- 个人财务健康分析
- 个性化金融学习路径

## 3. 账户注册与安全

### 3.1 账户创建
注册使用我们的服务需要创建账户。您必须：
- 提供准确、完整、最新的个人信息
- 维护您的账户信息的准确性和完整性
- 保护账户安全，包括保密您的密码
- 对在您账户下发生的所有活动负责

### 3.2 账户终止
我们保留在以下情况下暂停或终止您账户的权利：
- 违反本协议
- 长期不活动
- 我们善意认为有必要保护服务安全和完整性的情况

## 4. 用户行为

使用我们的服务时，您同意：
- 遵守所有适用法律和法规
- 不上传或传播任何违法、有害、威胁、滥用、骚扰、侵权、诽谤、淫秽或其他不当内容
- 不尝试干扰或破坏服务的正常运行
- 不使用自动化程序访问服务
- 不冒充他人或虚假陈述您与任何人的关系

## 5. 知识产权

### 5.1 我们的知识产权
服务中的所有内容、功能和特性，包括但不限于文本、图形、标识、按钮图标、图像、音频剪辑、数据编辑、软件和代码，均为财赋思或其许可方的财产，受国内外版权、商标、专利和其他知识产权法保护。

### 5.2 授权使用
我们授予您有限的、非排他性的、不可转让的许可，仅为个人非商业目的使用我们的服务。您不得复制、修改、分发、销售或出租服务的任何部分。

## 6. 责任限制

在适用法律允许的最大范围内：
- 服务"按原样"和"按可用性"提供，不提供任何明示或暗示的保证
- 我们不对任何直接、间接、附带、特殊、后果性或惩罚性损害负责
- 我们不保证服务将不间断、及时、安全或无错误
- 我们不对服务提供的建议或信息的准确性、可靠性负责

## 7. 赔偿

您同意赔偿并使财赋思及其关联公司、高管、员工和代理人免受因您违反本协议、使用服务或侵犯第三方权利而引起的任何索赔、损害、损失、责任、成本和费用的损害。

## 8. 协议修改

我们保留随时修改本协议的权利。修改后的协议将在网站上发布后立即生效。您继续使用服务则视为接受修改后的协议。

## 9. 通知

我们可能通过电子邮件、站内通知或公告向您发送通知。您同意电子通知满足任何法律通信要求。

## 10. 适用法律

本协议受中华人民共和国法律管辖，不考虑法律冲突原则。
      `
    },
    'cookie-policy': {
      title: 'Cookie政策',
      updatedDate: '2024年1月15日',
      content: `
## 1. 什么是Cookie？

Cookie是包含少量数据的文件，由网站存储在您的设备上。它们用于记住您和您的偏好，使您的在线体验更加个性化和便捷。

## 2. 我们如何使用Cookie

财赋思使用Cookie和类似技术（如网络信标、像素和本地存储）出于以下目的：

### 2.1 基本功能Cookie
这些Cookie对于网站运行至关重要，不能在我们的系统中关闭：
- 记住您的登录状态
- 确保您的账户安全
- 记住您的隐私设置

### 2.2 性能和分析Cookie
这些Cookie收集有关您如何使用我们网站的信息，帮助我们改进功能和监控性能：
- 了解哪些页面最受欢迎
- 跟踪网站错误
- 测试不同的网站设计和功能

### 2.3 功能性Cookie
这些Cookie使网站能够记住您的选择，提供增强的个性化功能：
- 记住您的语言和地区设置
- 保存您的自定义设置
- 记住您之前访问过的内容

### 2.4 定位Cookie
这些Cookie用于显示与您更相关的内容：
- 跟踪您的学习偏好
- 提供个性化的学习体验
- 显示与您兴趣相关的内容

## 3. 第三方Cookie

我们的网站可能包含来自第三方服务提供商的Cookie，例如：
- 分析服务（如Google Analytics）
- 内容分享工具
- 支付处理服务

这些第三方可能会收集有关您的信息。我们建议您查阅这些第三方的隐私政策以了解他们如何使用您的数据。

## 4. 管理Cookie

您可以通过浏览器设置控制和管理Cookie：
- 阻止所有Cookie
- 删除已存储的Cookie
- 允许来自特定网站的Cookie

请注意，限制Cookie可能会影响我们网站的某些功能和用户体验。

每种浏览器的Cookie管理方式略有不同。请查阅您的浏览器的"帮助"部分获取具体说明。

## 5. Cookie政策的变更

我们可能会不时更新本Cookie政策。我们建议您定期查看以了解任何变更。

## 6. 联系我们

如果您对我们的Cookie使用有任何疑问，请联系我们：
- 电子邮件：privacy@caifusi.com
      `
    },
    'data-usage': {
      title: '数据使用说明',
      updatedDate: '2024年1月15日',
      content: `
## 1. 数据处理概述

财赋思致力于透明地处理用户数据。本说明详细描述了我们如何收集、处理和利用用户数据，以确保您了解我们的数据处理实践。

## 2. 数据收集目的

我们收集和处理您的数据用于以下特定目的：

### 2.1 提供核心服务
- 创建和管理用户账户
- 提供个性化的金融教育内容
- 生成财务健康分析和建议
- 支持AI教练功能

### 2.2 改进产品和服务
- 分析用户行为和偏好
- 识别功能改进机会
- 开发新的产品特性
- 提高AI模型的准确性和相关性

### 2.3 用户支持和沟通
- 回应您的查询和请求
- 提供技术支持
- 发送重要通知和更新
- 征求用户反馈

## 3. 数据处理活动

以下是我们主要的数据处理活动：

### 3.1 用户行为分析
我们分析用户与平台的互动，包括学习内容的消费、AI教练对话和功能使用，以便改进用户体验。这些数据以汇总和匿名形式用于内部分析。

### 3.2 AI模型训练
我们使用去标识化的用户交互数据来训练和改进我们的AI金融教练。这包括问题类型、回答评价和交流模式，但不会包含能够直接识别个人的信息。

### 3.3 个性化
我们处理您的学习历史和偏好数据，以提供量身定制的学习体验。这包括推荐相关内容、适应您的学习进度和提供个性化的财务建议。

## 4. 数据保留期限

我们在满足数据处理目的所需的时间内保留您的个人数据：
- 账户数据：在您的账户活跃期间以及账户删除后的法定期限内保留
- 交易数据：根据财务和税务法规的要求期限保留
- 使用数据：通常保留24个月，之后匿名化处理
- 通信记录：保留不超过36个月

## 5. 数据安全措施

为保护您的数据，我们实施了严格的安全措施：
- 数据加密：传输和存储中的加密
- 访问控制：基于角色的权限系统
- 数据隔离：生产数据与测试环境分离
- 安全审计：定期漏洞评估和渗透测试
- 员工培训：数据保护和安全意识培训

## 6. 数据主体权利

作为数据主体，您拥有以下权利：
- 访问权：获取我们处理的关于您的个人数据的确认和副本
- 更正权：更正不准确的个人数据
- 删除权：在特定情况下请求删除您的数据
- 处理限制权：在某些情况下限制对您数据的处理
- 反对权：基于您特定情况反对处理
- 数据可携带权：以结构化、常用的机器可读格式接收您的数据

要行使这些权利，请联系我们的数据保护团队：dataprotection@caifusi.com

## 7. 数据国际传输

我们的服务器主要位于中国大陆。如果我们需要将您的数据传输到其他国家或地区，我们将确保采取适当的保障措施保护您的数据，并遵守相关法律要求。

## 8. 联系信息

如果您对我们的数据处理活动有任何疑问或关切，请联系：
- 数据保护团队：dataprotection@caifusi.com
- 地址：北京市海淀区中关村科技园区8号楼15层

最后更新日期：2024年1月15日
      `
    }
  };
  
  const currentContent = legalContents[activeTab];
  
  // 将Markdown文本转换为HTML (简化版本，实际生产环境应使用成熟的Markdown解析库如markdown-it)
  const simpleMarkdownToHtml = (markdownText) => {
    return markdownText
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-6 mb-3 text-gray-800">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-4 mb-2 text-gray-800">$1</h3>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n- (.*$)/gm, '<li class="ml-4 mb-1 list-disc text-gray-700">$1</li>');
  };

  return (
    <div className="legal-page bg-gray-50 min-h-screen pb-20">
      {/* 页面标题 */}
      <InfoPageHeader 
        title="法律条款" 
        subtitle="了解财赋思的法律政策和用户协议"
        category="legal"
      />
      
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-10">
          <div className="flex flex-col md:flex-row">
            {/* 侧边栏标签 */}
            <div className="md:w-1/4 border-r border-gray-200">
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-700 mb-4">法律文档</h3>
                <div className="space-y-1">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      className={`w-full flex items-center px-4 py-3 rounded-md text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-gray-100 text-gray-800 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <span className="mr-3 text-gray-500">{tab.icon}</span>
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 内容区域 */}
            <div className="md:w-3/4 p-6 md:p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">{currentContent.title}</h1>
                <p className="text-sm text-gray-500 mt-1">最后更新：{currentContent.updatedDate}</p>
              </div>
              
              <div className="legal-content prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(currentContent.content) }} />
              </div>
            </div>
          </div>
        </div>
        
        {/* 联系信息 */}
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-6">
          <h3 className="font-bold text-lg text-gray-800 mb-3">需要进一步的法律信息？</h3>
          <p className="text-gray-700 mb-4">
            如果您对我们的法律文件有任何疑问或需要进一步的解释，请联系我们的法务团队：
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a 
              href="mailto:legal@caifusi.com" 
              className="inline-block bg-gray-800 hover:bg-gray-900 text-white px-5 py-3 rounded-md transition-colors text-center"
            >
              联系法务团队
            </a>
            <Link
              to="/info/contact"
              className="inline-block bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-md transition-colors text-center"
            >
              联系客服
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalPage; 