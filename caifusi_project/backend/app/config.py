import os
from dotenv import load_dotenv

load_dotenv() # 加载 .env 文件中的环境变量

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key'
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY') or 'AIzaSyBm2js5YYeDyLKPrvU8jHVU9Zo1e1pqhzA'  # 用户提供的API密钥
    # 添加智谱AI的API密钥配置
    ZHIPUAI_API_KEY = os.environ.get('ZHIPUAI_API_KEY') or 'd569cc60785b4cd8a9cc3c033ac5a72f.MmbuHzbqGEsGntG5'
    FIREBASE_ADMIN_SDK_PATH = os.environ.get('FIREBASE_ADMIN_SDK_PATH') # e.g., "path/to/your/serviceAccountKey.json"
    # Firebase Web SDK config (如果前端需要直接与Firebase交互，通常后端用Admin SDK)
    # FIREBASE_CONFIG = {
    #     "apiKey": os.environ.get("FIREBASE_API_KEY"),
    #     "authDomain": os.environ.get("FIREBASE_AUTH_DOMAIN"),
    #     "projectId": os.environ.get("FIREBASE_PROJECT_ID"),
    #     "storageBucket": os.environ.get("FIREBASE_STORAGE_BUCKET"),
    #     "messagingSenderId": os.environ.get("FIREBASE_MESSAGING_SENDER_ID"),
    #     "appId": os.environ.get("FIREBASE_APP_ID")
    # } 