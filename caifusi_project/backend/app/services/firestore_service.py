from flask import current_app
from firebase_admin import firestore
import datetime
import uuid
import json

# --- Firestore Global Variables (Provided by Canvas Environment) ---
# These are placeholders. In a real Canvas environment, these would be injected.
# For local development, you'd typically use environment variables or a config file.
__app_id = 'default-app-id' # Replace with actual __app_id if provided by environment
# __firebase_config is typically a JSON string for client-side SDK,
# Admin SDK uses a service account key.

# 开发模式下使用内存存储
# 这只是一个简单的模拟，生产环境应使用真正的数据库
_dev_db = {
    "users": {},
    "public": {
        "knowledge_base": []
    }
}

def get_db():
    """Helper function to get the Firestore client instance."""
    if hasattr(current_app, 'config') and current_app.config.get('DEV_MODE'):
        # 在开发模式下返回None，表示使用内存存储
        return None
        
    if not hasattr(current_app, 'db') or current_app.db is None:
        # This indicates Firebase Admin SDK was not initialized correctly.
        # In a real app, you might want to raise an error or try re-initializing.
        print("Firestore client (current_app.db) is not available.")
        return None
    return current_app.db

def is_dev_mode():
    """检查是否处于开发模式"""
    return hasattr(current_app, 'config') and current_app.config.get('DEV_MODE')

def get_user_collection_path(user_id, collection_name):
    """Constructs the path for a user's private collection."""
    app_id = getattr(current_app, '__app_id', __app_id) # Use app_id from current_app if set
    return f"artifacts/{app_id}/users/{user_id}/{collection_name}"

def get_public_collection_path(collection_name):
    """Constructs the path for a public collection."""
    app_id = getattr(current_app, '__app_id', __app_id)
    return f"artifacts/{app_id}/public/data/{collection_name}"

# --- User Management ---
def create_user_profile(user_id, email, display_name=""):
    """Creates a new user profile document in Firestore."""
    db = get_db()
    
    if is_dev_mode():
        # 开发模式 - 使用内存存储
        if user_id not in _dev_db["users"]:
            _dev_db["users"][user_id] = {
                "profile": {
                    "email": email,
                    "displayName": display_name or email.split('@')[0],
                    "createdAt": datetime.datetime.now().isoformat(),
                    "lastLogin": datetime.datetime.now().isoformat(),
                    "assessmentCompleted": False,
                    "goals": []
                },
                "coach_messages": [],
                "assessments": {}
            }
        return user_id, None
        
    if not db: return None, "Firestore not initialized"
    try:
        user_profile_ref = db.collection(get_user_collection_path(user_id, "profile")).document(user_id)
        user_profile_ref.set({
            "email": email,
            "displayName": display_name or email.split('@')[0],
            "createdAt": firestore.SERVER_TIMESTAMP,
            "lastLogin": firestore.SERVER_TIMESTAMP,
            "assessmentCompleted": False,
            "goals": [] # Example: [{ "id": "goal1", "description": "Save for travel", "targetAmount": 1000, "currentAmount": 0 }]
        })
        return user_profile_ref.id, None
    except Exception as e:
        return None, str(e)

def get_user_profile(user_id):
    """Retrieves a user profile from Firestore."""
    db = get_db()
    
    if is_dev_mode():
        # 开发模式 - 使用内存存储
        if user_id in _dev_db["users"] and "profile" in _dev_db["users"][user_id]:
            return _dev_db["users"][user_id]["profile"], None
        return None, "User not found"
        
    if not db: return None, "Firestore not initialized"
    try:
        user_ref = db.collection(get_user_collection_path(user_id, "profile")).document(user_id)
        user_doc = user_ref.get()
        if user_doc.exists:
            return user_doc.to_dict(), None
        else:
            return None, "User not found"
    except Exception as e:
        return None, str(e)

def update_user_profile(user_id, data_to_update):
    """Updates a user profile in Firestore."""
    db = get_db()
    
    if is_dev_mode():
        # 开发模式 - 使用内存存储
        if user_id in _dev_db["users"] and "profile" in _dev_db["users"][user_id]:
            # 确保lastLogin被更新
            if "lastLogin" not in data_to_update:
                data_to_update["lastLogin"] = datetime.datetime.now().isoformat()
            # 更新用户资料
            _dev_db["users"][user_id]["profile"].update(data_to_update)
            return True, None
        return False, "User not found"
        
    if not db: return None, "Firestore not initialized"
    try:
        # Ensure lastLogin is updated if not explicitly provided
        if "lastLogin" not in data_to_update:
            data_to_update["lastLogin"] = firestore.SERVER_TIMESTAMP

        user_ref = db.collection(get_user_collection_path(user_id, "profile")).document(user_id)
        user_ref.update(data_to_update)
        return True, None
    except Exception as e:
        return False, str(e)

# --- Assessment Data ---
def save_assessment_results(user_id, assessment_data):
    """Saves assessment results for a user."""
    db = get_db()
    
    if is_dev_mode():
        # 开发模式 - 使用内存存储
        if user_id in _dev_db["users"]:
            _dev_db["users"][user_id]["assessments"]["latest"] = {
                **assessment_data,
                "completedAt": datetime.datetime.now().isoformat()
            }
            # 标记评估已完成
            if "profile" in _dev_db["users"][user_id]:
                _dev_db["users"][user_id]["profile"]["assessmentCompleted"] = True
            return "latest", None
        return None, "User not found"
        
    if not db: return None, "Firestore not initialized"
    try:
        # Example: assessment_data = {"risk_profile": "moderate", "biases": ["confirmation_bias"]}
        assessment_ref = db.collection(get_user_collection_path(user_id, "assessments")).document("latest") # Or use a timestamped ID
        assessment_ref.set({
            **assessment_data,
            "completedAt": firestore.SERVER_TIMESTAMP
        })
        # Update user profile to mark assessment as completed
        update_user_profile(user_id, {"assessmentCompleted": True})
        return assessment_ref.id, None
    except Exception as e:
        return None, str(e)

def get_assessment_results(user_id):
    """Retrieves the latest assessment results for a user."""
    db = get_db()
    
    if is_dev_mode():
        # 开发模式 - 使用内存存储
        if user_id in _dev_db["users"] and "assessments" in _dev_db["users"][user_id] and "latest" in _dev_db["users"][user_id]["assessments"]:
            return _dev_db["users"][user_id]["assessments"]["latest"], None
        return None, "Assessment not found"
        
    if not db: return None, "Firestore not initialized"
    try:
        doc_ref = db.collection(get_user_collection_path(user_id, "assessments")).document("latest")
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict(), None
        return None, "Assessment not found"
    except Exception as e:
        return None, str(e)

# --- Coach Conversations ---
def save_coach_message(user_id, message_data):
    """Saves a message from/to the AI coach."""
    db = get_db()
    
    if is_dev_mode():
        # 开发模式 - 使用内存存储
        if user_id not in _dev_db["users"]:
            _dev_db["users"][user_id] = {
                "coach_messages": []
            }
            
        # 确保timestamp已设置
        if "timestamp" not in message_data:
            message_data["timestamp"] = datetime.datetime.now().isoformat()
            
        # 生成唯一ID
        msg_id = str(uuid.uuid4())
        message_data["id"] = msg_id
        
        # 添加消息
        _dev_db["users"][user_id]["coach_messages"].append(message_data)
        return msg_id, None
    
    if not db: return None, "Firestore not initialized"
    try:
        # message_data = {"sender": "user" or "ai", "text": "message content", "timestamp": firestore.SERVER_TIMESTAMP}
        # Store conversations in a subcollection for better querying if needed, or as an array in a single doc for simplicity
        # For longer conversations, a subcollection is better.
        # Path: artifacts/{app_id}/users/{user_id}/coach_conversations/{conversation_id}/messages/{message_id}
        # Or simpler: artifacts/{app_id}/users/{user_id}/coach_log (array of messages) - less scalable
        
        # Using a simple log in user's profile for MVP, but subcollection is better for production
        # This example appends to an array in the user's profile document.
        # This is NOT recommended for long conversations due to document size limits (1MB).
        # A dedicated 'coach_conversations' collection per user is better.
        
        # Let's assume a dedicated collection for messages:
        # artifacts/{app_id}/users/{user_id}/coach_messages/
        
        # Ensure timestamp is set
        if "timestamp" not in message_data:
            message_data["timestamp"] = firestore.SERVER_TIMESTAMP

        msg_ref = db.collection(get_user_collection_path(user_id, "coach_messages")).add(message_data)
        return msg_ref[1].id, None # add() returns a tuple (timestamp, DocumentReference)
    except Exception as e:
        return None, str(e)

def get_coach_history(user_id, limit=20):
    """Retrieves the last N messages from the AI coach conversation."""
    db = get_db()
    
    if is_dev_mode():
        # 开发模式 - 使用内存存储
        if user_id in _dev_db["users"] and "coach_messages" in _dev_db["users"][user_id]:
            # 获取最近的消息并按时间排序
            messages = _dev_db["users"][user_id]["coach_messages"][-limit:]
            return messages, None
        return [], None
        
    if not db: return [], "Firestore not initialized"
    try:
        messages_ref = db.collection(get_user_collection_path(user_id, "coach_messages"))
        # Order by timestamp descending to get the latest messages
        # Note: Firestore requires a composite index for queries with orderBy and filters on different fields.
        # For simple orderBy on timestamp, it might work without explicit index if it's the only filter.
        # However, it's good practice to create indexes.
        # For MVP, if orderBy causes issues without an index, fetch and sort in Python, or ensure an index exists.
        # query = messages_ref.order_by("timestamp", direction=firestore.Query.DESCENDING).limit(limit)
        
        # Simpler fetch for MVP if ordering is an issue without pre-configured indexes:
        # Fetch all and sort in code (not efficient for large datasets)
        # For now, let's assume an index on "timestamp" exists or we sort client-side/app-side.
        # For robust ordering, ensure your Firestore has the necessary indexes.
        # For MVP, let's try without explicit orderBy to avoid index issues in a fresh setup.
        # You would typically sort this on the client or after fetching if not using orderBy.
        
        # Correct way with ordering (requires index on 'timestamp'):
        query = messages_ref.order_by("timestamp", direction=firestore.Query.DESCENDING).limit(limit)
        docs = query.stream()
        
        history = []
        for doc in docs:
            msg = doc.to_dict()
            msg["id"] = doc.id
            history.append(msg)
        return list(reversed(history)), None # Reverse to get chronological order (oldest to newest)
    except Exception as e:
        # Fallback if ordering fails (e.g., missing index) - fetch without order and sort later
        print(f"Error fetching coach history with ordering: {e}. Trying without explicit order.")
        try:
            docs = messages_ref.limit(limit).stream() # No specific order
            history = []
            for doc in docs:
                msg = doc.to_dict()
                msg["id"] = doc.id
                history.append(msg)
            # Sort by timestamp in Python (if timestamp is a proper Firestore Timestamp or comparable)
            history.sort(key=lambda x: x.get("timestamp"))
            return history, None
        except Exception as e_fallback:
            return [], str(e_fallback)


# --- Knowledge Base (Public Data Example) ---
def add_kb_article(article_data):
    """Adds a new article to the public knowledge base."""
    db = get_db()
    
    if is_dev_mode():
        # 开发模式 - 使用内存存储
        article_data["createdAt"] = datetime.datetime.now().isoformat()
        article_data["id"] = str(uuid.uuid4())
        _dev_db["public"]["knowledge_base"].append(article_data)
        return article_data["id"], None
        
    if not db: return None, "Firestore not initialized"
    try:
        # article_data = {"title": "Understanding ETFs", "content": "...", "category": "Investing", "tags": ["etf", "stocks"]}
        article_data["createdAt"] = firestore.SERVER_TIMESTAMP
        article_ref = db.collection(get_public_collection_path("knowledge_base")).add(article_data)
        return article_ref[1].id, None
    except Exception as e:
        return None, str(e)

def get_kb_articles(category=None, limit=10):
    """Retrieves articles from the public knowledge base."""
    db = get_db()
    
    if is_dev_mode():
        # 开发模式 - 使用内存存储
        articles = _dev_db["public"]["knowledge_base"]
        
        # 如果有类别过滤，则进行过滤
        if category:
            articles = [article for article in articles if article.get("category") == category]
            
        # 限制结果数量
        articles = articles[:limit]
        return articles, None
        
    if not db: return [], "Firestore not initialized"
    try:
        articles_ref = db.collection(get_public_collection_path("knowledge_base"))
        query = articles_ref
        if category:
            query = query.where("category", "==", category) # Requires index on 'category'
        
        # Add ordering if needed, e.g., by createdAt (requires index)
        # query = query.order_by("createdAt", direction=firestore.Query.DESCENDING)
        
        docs = query.limit(limit).stream()
        articles = []
        for doc in docs:
            article = doc.to_dict()
            article["id"] = doc.id
            articles.append(article)
        return articles, None
    except Exception as e:
        return [], str(e)

# You would add more functions here for other data types:
# - Goals (CRUD)
# - Financial Tools Data (e.g., budget templates, savings plans)
# - User Feedback 