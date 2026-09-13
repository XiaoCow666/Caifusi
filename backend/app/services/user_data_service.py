"""
用户数据服务模块
负责用户数据的存储、检索和管理，支持内存、MySQL 和 Firestore 三种存储引擎。
"""
import os
import datetime
import uuid
from typing import Dict, List, Optional, Any
from .firestore_service import (
    get_db, 
    is_dev_mode,
    get_user_collection_path,
    _dev_db
)
from app.utils.db_mysql import MySQLHelper, to_json_string, from_json_field

def is_mysql_mode():
    """判断当前是否启用 MySQL 数据库"""
    try:
        from flask import current_app
        if current_app and current_app.config.get('DB_TYPE') == 'mysql':
            return True
    except Exception:
        pass
    return os.environ.get('DB_TYPE') == 'mysql'

def ensure_mysql_user_exists(user_id, email=None):
    """确保用户在 MySQL 的 users 表中存在，防外键约束报错"""
    try:
        user = MySQLHelper.execute_one("SELECT id FROM users WHERE id = %s", (user_id,))
        if not user:
            actual_email = email or f"{user_id}@example.com"
            display_name = actual_email.split('@')[0]
            MySQLHelper.execute_update(
                "INSERT INTO users (id, email, display_name, created_at, last_login) VALUES (%s, %s, %s, NOW(), NOW())",
                (user_id, actual_email, display_name)
            )
    except Exception as e:
        print(f"ensure_mysql_user_exists error: {e}")

class UserDataService:
    """用户数据服务类"""
    
    def __init__(self):
        """初始化用户数据服务"""
        self.db = get_db()
    
    def save_user_data(self, user_id: str, data_type: str, data: Dict[str, Any]) -> tuple:
        """
        保存用户数据
        
        Args:
            user_id: 用户ID
            data_type: 数据类型 (assessments, goals, coach_messages 等)
            data: 要保存的数据
            
        Returns:
            (success: bool, message: str)
        """
        try:
            # 1. MySQL 模式
            if is_mysql_mode():
                ensure_mysql_user_exists(user_id)

                if data_type == 'assessments':
                    # total_score_percentage_scale（得分率口径标识）必须一并落库：
                    # 读取侧靠它区分「0~100 得分率的新记录」与「1~4 平均分错写的旧记录」，
                    # 漏写会让 MySQL 往返后的新记录退化成旧记录、被二次换算。
                    sql = """
                        INSERT INTO assessments
                        (user_id, answers, scores, total_score, total_score_percentage,
                         total_score_percentage_scale, category_scores_percentage,
                         categories, recommendations, completed, timestamp)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                    """
                    params = (
                        user_id,
                        to_json_string(data.get('answers')),
                        to_json_string(data.get('scores')),
                        data.get('total_score', 0.0),
                        data.get('total_score_percentage', 0.0),
                        data.get('total_score_percentage_scale'),
                        to_json_string(data.get('category_scores_percentage')),
                        to_json_string(data.get('categories')),
                        to_json_string(data.get('recommendations')),
                        1 if data.get('completed', True) else 0
                    )
                    last_id = MySQLHelper.execute_update(sql, params)
                    data['id'] = last_id
                    return True, "评估数据保存成功"

                elif data_type == 'goals':
                    goal_id = data.get('id') or str(uuid.uuid4())
                    sql = """
                        INSERT INTO goals 
                        (id, user_id, title, description, target_amount, current_amount, progress, deadline, status, timestamp)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                        ON DUPLICATE KEY UPDATE
                        title = VALUES(title), description = VALUES(description), 
                        target_amount = VALUES(target_amount), current_amount = VALUES(current_amount), 
                        progress = VALUES(progress), deadline = VALUES(deadline), 
                        status = VALUES(status), updated_at = NOW()
                    """
                    params = (
                        goal_id,
                        user_id,
                        data.get('title'),
                        data.get('description', ''),
                        data.get('target_amount', 0.0),
                        data.get('current_amount', 0.0),
                        data.get('progress', 0.0),
                        data.get('deadline'),
                        data.get('status', 'active')
                    )
                    MySQLHelper.execute_update(sql, params)
                    data['id'] = goal_id
                    return True, "目标数据保存成功"

                elif data_type in ('coach_messages', 'messages'):
                    sender = data.get('sender') or data.get('role') or 'user'
                    text = data.get('text') or data.get('content') or ''
                    sql = """
                        INSERT INTO coach_messages (user_id, sender, text, timestamp)
                        VALUES (%s, %s, %s, NOW())
                    """
                    params = (user_id, sender, text)
                    last_id = MySQLHelper.execute_update(sql, params)
                    data['id'] = last_id
                    return True, "消息数据保存成功"
                
                else:
                    return False, f"未知的 MySQL 数据存储类型: {data_type}"

            # 2. 开发内存模式
            if is_dev_mode():
                if user_id not in _dev_db["users"]:
                    _dev_db["users"][user_id] = {}
                
                if data_type not in _dev_db["users"][user_id]:
                    _dev_db["users"][user_id][data_type] = []
                elif isinstance(_dev_db["users"][user_id][data_type], dict):
                    _dev_db["users"][user_id][data_type] = list(_dev_db["users"][user_id][data_type].values())
                
                data['timestamp'] = datetime.datetime.now().isoformat()
                data['id'] = f"{data_type}_{len(_dev_db['users'][user_id][data_type])}"
                
                _dev_db["users"][user_id][data_type].append(data)
                return True, "数据保存成功"
            
            # 3. 生产 Firestore 模式
            if not self.db:
                return False, "数据库未初始化"
            
            collection_path = get_user_collection_path(user_id, data_type)
            doc_ref = self.db.collection(collection_path).document()
            
            data['timestamp'] = datetime.datetime.now()
            data['id'] = doc_ref.id
            
            doc_ref.set(data)
            return True, "数据保存成功"
            
        except Exception as e:
            return False, f"保存数据失败: {str(e)}"
    
    def get_user_data(self, user_id: str, data_type: str, limit: int = 10) -> tuple:
        """
        获取用户数据
        
        Args:
            user_id: 用户ID
            data_type: 数据类型
            limit: 返回数据条数限制
            
        Returns:
            (data: List[Dict], error: Optional[str])
        """
        try:
            # 1. MySQL 模式
            if is_mysql_mode():
                ensure_mysql_user_exists(user_id)
                
                if data_type == 'assessments':
                    sql = "SELECT * FROM assessments WHERE user_id = %s ORDER BY timestamp DESC LIMIT %s"
                    rows = MySQLHelper.execute_query(sql, (user_id, limit))
                    result = []
                    for row in rows:
                        result.append({
                            'id': row['id'],
                            'answers': from_json_field(row['answers']),
                            'scores': from_json_field(row['scores']),
                            'total_score': row['total_score'],
                            'total_score_percentage': row['total_score_percentage'],
                            # 用 .get 而非 []：老库若尚未执行 schema.sql 的补列迁移，
                            # 该列不存在，取成 None 即可回退到「旧记录」口径，
                            # 不该因为少一列就让整个读接口 500。
                            'total_score_percentage_scale': row.get('total_score_percentage_scale'),
                            'category_scores_percentage': from_json_field(row['category_scores_percentage']),
                            'categories': from_json_field(row['categories']),
                            'recommendations': from_json_field(row['recommendations']),
                            'completed': bool(row['completed']),
                            'timestamp': row['timestamp'].isoformat() if row['timestamp'] else None
                        })
                    return result, None

                elif data_type == 'goals':
                    sql = "SELECT * FROM goals WHERE user_id = %s ORDER BY timestamp DESC LIMIT %s"
                    rows = MySQLHelper.execute_query(sql, (user_id, limit))
                    result = []
                    for row in rows:
                        result.append({
                            'id': row['id'],
                            'title': row['title'],
                            'description': row['description'],
                            'target_amount': row['target_amount'],
                            'current_amount': row['current_amount'],
                            'progress': row['progress'],
                            'deadline': row['deadline'],
                            'status': row['status'],
                            'timestamp': row['timestamp'].isoformat() if row['timestamp'] else None,
                            'updated_at': row['updated_at'].isoformat() if row['updated_at'] else None
                        })
                    return result, None

                elif data_type in ('coach_messages', 'messages'):
                    sql = "SELECT * FROM coach_messages WHERE user_id = %s ORDER BY timestamp ASC"
                    rows = MySQLHelper.execute_query(sql, (user_id,))
                    result = []
                    for row in rows:
                        result.append({
                            'id': row['id'],
                            'sender': row['sender'],
                            'role': row['sender'],
                            'text': row['text'],
                            'content': row['text'],
                            'timestamp': row['timestamp'].isoformat() if row['timestamp'] else None
                        })
                    return result[-limit:] if limit else result, None
                
                else:
                    return [], None

            # 2. 开发内存模式
            if is_dev_mode():
                if user_id not in _dev_db["users"]:
                    return [], None
                
                data_list = _dev_db["users"][user_id].get(data_type, [])
                if isinstance(data_list, dict):
                    data_list = list(data_list.values())
                    
                return data_list[-limit:] if data_list else [], None
            
            # 3. 生产 Firestore 模式
            if not self.db:
                return [], "数据库未初始化"
            
            collection_path = get_user_collection_path(user_id, data_type)
            docs = self.db.collection(collection_path)\
                         .order_by('timestamp', direction='DESCENDING')\
                         .limit(limit)\
                         .stream()
            
            data_list = [doc.to_dict() for doc in docs]
            return data_list, None
            
        except Exception as e:
            return [], f"获取数据失败: {str(e)}"
    
    def get_latest_data(self, user_id: str, data_type: str) -> tuple:
        """获取用户最新的一条数据"""
        try:
            data_list, error = self.get_user_data(user_id, data_type, limit=1)
            if error:
                return None, error
            
            return data_list[0] if data_list else None, None
            
        except Exception as e:
            return None, f"获取最新数据失败: {str(e)}"
    
    def update_user_data(self, user_id: str, data_type: str, data_id: str, updates: Dict[str, Any]) -> tuple:
        """更新用户数据"""
        try:
            # 1. MySQL 模式
            if is_mysql_mode():
                if data_type == 'goals':
                    if not updates:
                        return True, "没有更新内容"
                    
                    fields = []
                    params = []
                    for k, v in updates.items():
                        if k in ('title', 'description', 'target_amount', 'current_amount', 'progress', 'deadline', 'status'):
                            fields.append(f"{k} = %s")
                            params.append(v)
                    
                    if not fields:
                        return True, "没有可更新的合法字段"
                        
                    sql = f"UPDATE goals SET {', '.join(fields)}, updated_at = NOW() WHERE id = %s AND user_id = %s"
                    params.extend([data_id, user_id])
                    
                    affected = MySQLHelper.execute_update(sql, params)
                    if affected > 0:
                        return True, "目标更新成功"
                    return False, "目标更新失败或数据未改变"
                else:
                    return False, f"MySQL 暂不支持动态更新该类型数据: {data_type}"

            # 2. 开发内存模式
            if is_dev_mode():
                if user_id not in _dev_db["users"] or data_type not in _dev_db["users"][user_id]:
                    return False, "数据不存在"
                
                data_list = _dev_db["users"][user_id][data_type]
                for i, data in enumerate(data_list):
                    if data.get('id') == data_id:
                        data_list[i].update(updates)
                        data_list[i]['updated_at'] = datetime.datetime.now().isoformat()
                        return True, "数据更新成功"
                
                return False, "未找到指定数据"
            
            # 3. 生产 Firestore 模式
            if not self.db:
                return False, "数据库未初始化"
            
            collection_path = get_user_collection_path(user_id, data_type)
            doc_ref = self.db.collection(collection_path).document(data_id)
            
            updates['updated_at'] = datetime.datetime.now()
            doc_ref.update(updates)
            
            return True, "数据更新成功"
            
        except Exception as e:
            return False, f"更新数据失败: {str(e)}"
    
    def delete_user_data(self, user_id: str, data_type: str, data_id: str) -> tuple:
        """删除用户数据"""
        try:
            # 1. MySQL 模式
            if is_mysql_mode():
                if data_type == 'goals':
                    sql = "DELETE FROM goals WHERE id = %s AND user_id = %s"
                    affected = MySQLHelper.execute_update(sql, (data_id, user_id))
                    if affected > 0:
                        return True, "数据删除成功"
                    return False, "数据不存在或删除失败"
                elif data_type == 'assessments':
                    sql = "DELETE FROM assessments WHERE id = %s AND user_id = %s"
                    affected = MySQLHelper.execute_update(sql, (data_id, user_id))
                    if affected > 0:
                        return True, "评估数据删除成功"
                    return False, "评估数据不存在或删除失败"
                else:
                    return False, f"MySQL 暂不支持删除该类型数据: {data_type}"

            # 2. 开发内存模式
            if is_dev_mode():
                if user_id not in _dev_db["users"] or data_type not in _dev_db["users"][user_id]:
                    return False, "数据不存在"
                
                data_list = _dev_db["users"][user_id][data_type]
                _dev_db["users"][user_id][data_type] = [
                    data for data in data_list if data.get('id') != data_id
                ]
                return True, "数据删除成功"
            
            # 3. 生产 Firestore 模式
            if not self.db:
                return False, "数据库未初始化"
            
            collection_path = get_user_collection_path(user_id, data_type)
            self.db.collection(collection_path).document(data_id).delete()
            
            return True, "数据删除成功"
            
        except Exception as e:
            return False, f"删除数据失败: {str(e)}"
    
    def get_user_statistics(self, user_id: str) -> Dict[str, Any]:
        """获取用户统计数据"""
        try:
            stats = {
                'total_assessments': 0,
                'total_goals': 0,
                'total_transactions': 0,
                'last_assessment_date': None,
                'last_login': None
            }
            
            # 1. MySQL 模式
            if is_mysql_mode():
                ensure_mysql_user_exists(user_id)
                # 获取 assessments 统计
                assessments_info = MySQLHelper.execute_one(
                    "SELECT COUNT(*) as cnt, MAX(timestamp) as max_ts FROM assessments WHERE user_id = %s",
                    (user_id,)
                )
                if assessments_info:
                    stats['total_assessments'] = assessments_info['cnt']
                    stats['last_assessment_date'] = assessments_info['max_ts'].isoformat() if assessments_info['max_ts'] else None
                
                # 获取 goals 统计
                goals_info = MySQLHelper.execute_one(
                    "SELECT COUNT(*) as cnt FROM goals WHERE user_id = %s",
                    (user_id,)
                )
                if goals_info:
                    stats['total_goals'] = goals_info['cnt']
                
                # 获取用户最后登录时间
                user_info = MySQLHelper.execute_one(
                    "SELECT last_login FROM users WHERE id = %s",
                    (user_id,)
                )
                if user_info and user_info['last_login']:
                    stats['last_login'] = user_info['last_login'].isoformat()
                
                return stats

            # 2. 开发内存模式
            if is_dev_mode():
                if user_id in _dev_db["users"]:
                    user_data = _dev_db["users"][user_id]
                    stats['total_assessments'] = len(user_data.get('assessments', []))
                    stats['total_goals'] = len(user_data.get('goals', []))
                    stats['total_transactions'] = len(user_data.get('transactions', []))
                    
                    assessments = user_data.get('assessments', [])
                    if assessments:
                        stats['last_assessment_date'] = assessments[-1].get('timestamp')
            
            # 3. 生产 Firestore 模式
            else:
                if self.db:
                    for data_type in ['assessments', 'goals', 'transactions']:
                        collection_path = get_user_collection_path(user_id, data_type)
                        docs = self.db.collection(collection_path).stream()
                        stats[f'total_{data_type}'] = len(list(docs))
            
            return stats
            
        except Exception as e:
            print(f"获取用户统计数据失败: {str(e)}")
            return {}

# 创建全局实例
user_data_service = UserDataService()
