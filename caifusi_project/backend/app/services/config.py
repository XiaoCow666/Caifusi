import os

class Config:
    """应用配置"""
    # 智谱AI API密钥
    ZHIPUAI_API_KEY = os.environ.get("ZHIPUAI_API_KEY", "d569cc60785b4cd8a9cc3c033ac5a72f.MmbuHzbqGEsGntG5")
    
    # 应用设置
    DEBUG = os.environ.get("DEBUG", "true").lower() == "true"
    ENV = os.environ.get("ENV", "development")
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev_secret_key_for_finance_coach")
    
    # API配置
    API_PREFIX = "/api"
    
    # 跨域配置
    CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"] 