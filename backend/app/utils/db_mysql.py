import os
import logging
import json
from flask import current_app

# pymysql 采用延迟导入：仅在实际建立 MySQL 连接时才导入，
# 使 DB_TYPE=memory（默认开发模式）不需要安装 pymysql 也能启动后端。

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('db_mysql')

class MySQLHelper:
    """MySQL 数据库助手类"""
    
    @staticmethod
    def get_db_config():
        """获取 MySQL 配置参数，支持 Flask current_app 配置与环境变量 fallback"""
        config = {}
        try:
            if current_app:
                config['host'] = current_app.config.get('MYSQL_HOST', '127.0.0.1')
                config['port'] = current_app.config.get('MYSQL_PORT', 3306)
                config['user'] = current_app.config.get('MYSQL_USER', 'root')
                config['password'] = current_app.config.get('MYSQL_PASSWORD', '')
                config['database'] = current_app.config.get('MYSQL_DB', 'caifusi')
                return config
        except RuntimeError:
            # 不在 Flask 应用上下文中，回退至直接读取环境变量
            pass
            
        config['host'] = os.environ.get('MYSQL_HOST', '127.0.0.1')
        config['port'] = int(os.environ.get('MYSQL_PORT', 3306))
        config['user'] = os.environ.get('MYSQL_USER', 'root')
        config['password'] = os.environ.get('MYSQL_PASSWORD', '')
        config['database'] = os.environ.get('MYSQL_DB', 'caifusi')
        return config

    @classmethod
    def get_connection(cls, select_db=True):
        """建立数据库连接"""
        try:
            import pymysql
            import pymysql.cursors
        except ImportError:
            raise ImportError('MySQL 模式需要 pymysql 库，请运行: pip install pymysql cryptography')
        config = cls.get_db_config()
        try:
            conn = pymysql.connect(
                host=config['host'],
                port=config['port'],
                user=config['user'],
                password=config['password'],
                database=config['database'] if select_db else None,
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                autocommit=True
            )
            return conn
        except Exception as e:
            logger.error(f"MySQL 连接失败: {e}")
            raise e

    @classmethod
    def execute_query(cls, sql, params=None):
        """
        执行 SELECT 查询语句
        :param sql: SQL 语句
        :param params: 参数元组或列表
        :return: 查询结果列表 (dict 数组)
        """
        conn = cls.get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql, params)
                result = cursor.fetchall()
                return result
        except Exception as e:
            logger.error(f"执行查询失败: {sql}, 错误: {e}")
            raise e
        finally:
            conn.close()

    @classmethod
    def execute_one(cls, sql, params=None):
        """
        执行 SELECT 查询语句并返回单条结果
        :param sql: SQL 语句
        :param params: 参数元组或列表
        :return: 单个字典对象或 None
        """
        conn = cls.get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql, params)
                result = cursor.fetchone()
                return result
        except Exception as e:
            logger.error(f"执行单条查询失败: {sql}, 错误: {e}")
            raise e
        finally:
            conn.close()

    @classmethod
    def execute_update(cls, sql, params=None):
        """
        执行 INSERT/UPDATE/DELETE 写入语句
        :param sql: SQL 语句
        :param params: 参数元组或列表
        :return: 受影响的行数 (affected rows) 或在 INSERT 时返回 lastrowid
        """
        conn = cls.get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql, params)
                # 如果是插入操作且主键自增，返回最后插入的ID
                if sql.strip().upper().startswith('INSERT'):
                    return cursor.lastrowid
                return cursor.rowcount
        except Exception as e:
            logger.error(f"执行写入操作失败: {sql}, 错误: {e}")
            raise e
        finally:
            conn.close()

    @classmethod
    def init_database(cls):
        """
        检查并初始化数据库和表结构
        尝试从 schema.sql 文件读取建表语句并执行
        """
        config = cls.get_db_config()
        logger.info(f"检查 MySQL 数据库服务: {config['host']}:{config['port']}")
        
        # 1. 尝试连接 MySQL，不指定 database，如果 database 不存在则创建它
        try:
            conn = cls.get_connection(select_db=False)
            with conn.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{config['database']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            conn.close()
            logger.info(f"数据库 `{config['database']}` 准备就绪或已成功创建")
        except Exception as e:
            logger.error(f"检查/创建数据库失败: {e}. 请确保 MySQL 已启动并允许免密/密码登录。")
            return False

        # 2. 检查表是否已经存在，不存在则读取并执行 schema.sql
        try:
            tables = cls.execute_query("SHOW TABLES;")
            table_names = [list(t.values())[0] for t in tables]
            logger.info(f"当前数据库已存在表: {table_names}")
            
            # 如果核心表不存在，则加载 schema.sql 进行初始化
            if 'users' not in table_names or 'assessments' not in table_names:
                logger.info("检测到数据库表缺失，正在尝试自动运行 schema.sql 初始化数据库表...")
                
                # 寻找 schema.sql 的路径
                schema_path = None
                possible_paths = [
                    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'schema.sql'), # backend/schema.sql
                    os.path.join(os.getcwd(), 'backend', 'schema.sql'),
                    os.path.join(os.getcwd(), 'schema.sql')
                ]
                
                for path in possible_paths:
                    if os.path.exists(path):
                        schema_path = path
                        break
                
                if schema_path:
                    logger.info(f"读取 schema 脚本: {schema_path}")
                    with open(schema_path, 'r', encoding='utf-8') as f:
                        schema_sql = f.read()
                    
                    # 按照分号切分执行，PyMySQL 默认不支持单个 execute 执行多条 DDL 语句
                    conn = cls.get_connection()
                    try:
                        with conn.cursor() as cursor:
                            # 简单的 SQL 解析，按语句分割
                            statements = []
                            current_stmt = []
                            for line in schema_sql.split('\n'):
                                # 忽略注释和空行
                                if line.strip().startswith('--') or line.strip().startswith('#') or not line.strip():
                                    continue
                                current_stmt.append(line)
                                if line.strip().endswith(';'):
                                    statements.append('\n'.join(current_stmt))
                                    current_stmt = []
                            
                            for stmt in statements:
                                if stmt.strip():
                                    cursor.execute(stmt)
                        logger.info("✓ 数据库表结构初始化及初始演示数据导入成功！")
                    except Exception as e:
                        logger.error(f"运行 schema.sql 语句时出错: {e}")
                    finally:
                        conn.close()
                else:
                    logger.error("未找到 schema.sql 脚本，无法自动建表，请手动在 MySQL 中执行。")
            else:
                logger.info("核心数据库表已存在，跳过初始化。")
            return True
        except Exception as e:
            logger.error(f"初始化数据库表失败: {e}")
            return False

# 提供方便将 JSON 数据转化存储/读取的辅助方法
def to_json_string(data):
    """将 Dict/List 转换为 JSON 字符串用于存入 MySQL JSON 字段"""
    if data is None:
        return None
    if isinstance(data, (str, bytes)):
        return data
    try:
        return json.dumps(data, ensure_ascii=False)
    except Exception:
        return str(data)

def from_json_field(field_data):
    """解析 MySQL 返回的 JSON 字段数据为 Python 结构"""
    if field_data is None:
        return None
    if isinstance(field_data, (dict, list)):
        return field_data
    try:
        return json.loads(field_data)
    except Exception:
        return field_data
