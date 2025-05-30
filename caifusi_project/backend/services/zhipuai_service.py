import os
import re
import json
import zhipuai
import sys

# 调整路径以正确导入配置
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.config import Config

def filter_thinking_tags(text):
    """
    过滤掉文本中的<think>...</think>标签及其内容
    保持Markdown格式不变
    """
    # 使用非贪婪匹配来移除<think>...</think>和任何嵌套的标签
    filtered_text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    
    # 移除可能存在的空行（连续多个换行符）
    filtered_text = re.sub(r'\n{3,}', '\n\n', filtered_text)
    
    # 确保Markdown格式保持不变
    # 如果需要，可以在这里添加额外的格式处理
    
    return filtered_text.strip()

class ZhipuAIService:
    def __init__(self):
        self.api_key = Config.ZHIPUAI_API_KEY
        zhipuai.api_key = self.api_key
        # 会话记忆，使用字典存储不同用户的对话历史
        self.chat_history = {}
        # 最大历史记忆长度（消息数量）
        self.max_history_length = 10

    def get_chat_response(self, data):
        """
        获取AI聊天回复，支持对话记忆和问卷结果集成
        :param data: 包含消息内容、用户ID、可选的聊天历史和问卷结果的字典
        :return: 包含回复内容的字典
        """
        try:
            # 提取数据
            message = data.get('message', '')
            user_id = data.get('user_id', 'default_user')
            chat_history = data.get('chat_history', [])
            assessment_results = data.get('assessment_results', None)
            
            # 如果前端提供了聊天历史，则使用它，否则使用服务端存储的历史
            if not chat_history and user_id in self.chat_history:
                chat_history = self.chat_history[user_id]
            
            # 构建系统提示词
            system_prompt = self._build_system_prompt(assessment_results)
            
            # 构建对话历史
            messages = [{"role": "system", "content": system_prompt}]
            
            # 添加历史消息，确保不超过限制
            if chat_history:
                # 如果历史太长，只保留最近的几条
                recent_history = chat_history[-self.max_history_length:] if len(chat_history) > self.max_history_length else chat_history
                for msg in recent_history:
                    messages.append({"role": msg.get('role', 'user'), "content": msg.get('content', '')})
            
            # 添加当前用户消息
            messages.append({"role": "user", "content": message})
            
            # 调用智谱AI API
            response = zhipuai.model_api.invoke(
                model="glm-z1-air",
                messages=messages,
                temperature=0.7,
                top_p=0.9
            )
            
            # 检查API调用是否成功
            if response["code"] == 200:
                # 获取AI回复
                ai_reply = response["data"]["choices"][0]["content"]
                
                # 过滤掉思考标签
                filtered_response = filter_thinking_tags(ai_reply)
                
                # 更新对话历史
                if user_id not in self.chat_history:
                    self.chat_history[user_id] = []
                
                # 添加用户消息和AI回复到历史记录
                self.chat_history[user_id].append({"role": "user", "content": message})
                self.chat_history[user_id].append({"role": "assistant", "content": filtered_response})
                
                # 如果历史太长，移除最早的消息
                if len(self.chat_history[user_id]) > self.max_history_length * 2:  # 乘以2是因为每轮对话有用户和AI两条消息
                    self.chat_history[user_id] = self.chat_history[user_id][-self.max_history_length * 2:]
                
                return {"status": "success", "reply": filtered_response}
            else:
                return {"status": "error", "message": f"API调用失败: {response['msg']}"}
                
        except Exception as e:
            return {"status": "error", "message": f"调用ZhipuAI服务时发生错误: {str(e)}"}

    def _build_system_prompt(self, assessment_results=None):
        """
        构建系统提示词，根据是否有评估结果进行调整
        :param assessment_results: 用户的财务评估结果
        :return: 系统提示词
        """
        prompt = """你是一个专业的金融心智教练，名为"财赋思"。你的主要职责是帮助用户培养健康的金钱观念和财务习惯，提供个性化的财务建议，并回答用户关于个人理财的问题。

请注意以下要求：
1. 回答要专业、友好且富有同理心
2. 提供具体、可行的财务建议，而不是空泛的建议
3. 遵循Markdown格式规范，保持良好的排版和结构
4. 适当使用表格、列表等Markdown元素提高回答的可读性
5. 不要在回复中使用<think>标签或类似的元标签
6. 如需强调重点，可以使用**加粗**或*斜体*格式
7. 保持对话连贯性，记住用户之前提到的信息
8. 如果用户表达负面情绪或财务困境，给予支持和鼓励"""

        # 如果有评估结果，则添加到系统提示中
        if assessment_results:
            try:
                # 提取关键评估数据
                score = assessment_results.get('score', 0)
                category_scores = assessment_results.get('categoryScores', {})
                result_message = assessment_results.get('resultMessage', {})
                category_advice = assessment_results.get('categoryAdvice', [])
                user_name = assessment_results.get('userName', '用户')
                
                # 计算总分百分比
                max_score = 40  # 假设总分为40
                score_percentage = (score / max_score) * 100 if max_score > 0 else 0
                
                # 找出用户的强项和弱项
                strengths = []
                weaknesses = []
                for category, score in category_scores.items():
                    category_name = self._get_category_name(category)
                    if score >= 70:
                        strengths.append(category_name)
                    elif score <= 40:
                        weaknesses.append(category_name)
                
                # 添加评估结果到提示词
                prompt += f"""

用户财务评估数据：
- 用户姓名: {user_name}
- 财务状况: {result_message.get('title', '财务成长阶段')}
- 评估得分: {score}/{max_score} ({round(score_percentage)}%)
- 强项领域: {', '.join(strengths) if strengths else '暂无明显强项'}
- 待提升领域: {', '.join(weaknesses) if weaknesses else '总体表现平衡'}
- 建议重点关注: {', '.join(category_advice[:3]) if category_advice else '建立预算习惯，增加储蓄比例'}

请根据上述评估结果，为用户提供更个性化的建议。在对话中自然地引用这些信息，但不要机械地重复。关注用户当前的问题和需求，并将建议与其评估结果关联起来。"""

            except Exception as e:
                # 如果处理评估结果时出错，记录错误但继续使用基本提示词
                print(f"处理评估结果时出错: {str(e)}")
        
        return prompt

    def _get_category_name(self, category):
        """
        获取分类的中文名称
        :param category: 分类代码
        :return: 中文名称
        """
        category_names = {
            'savings': '储蓄能力',
            'risk': '风险管理',
            'emergency': '应急准备',
            'debt': '债务管理',
            'knowledge': '财务知识',
            'income': '收入稳定性',
            'goals': '财务目标',
            'tracking': '支出追踪',
            'insurance': '保险保障',
            'pressure': '应对能力'
        }
        return category_names.get(category, category) 