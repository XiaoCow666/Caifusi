-- ==========================================
-- 财赋思 (Cái Fù Sī) - MySQL 数据库初始化脚本
-- 适用范围：数据库实验、大创答辩、本地持久化展示
-- ==========================================

-- 1. 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `caifusi` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `caifusi`;

-- 2. 移除旧表以确保重新初始化（可选，如需清空请取消注释）
-- SET FOREIGN_KEY_CHECKS = 0;
-- DROP TABLE IF EXISTS `coach_messages`;
-- DROP TABLE IF EXISTS `goals`;
-- DROP TABLE IF EXISTS `assessments`;
-- DROP TABLE IF EXISTS `users`;
-- SET FOREIGN_KEY_CHECKS = 1;

-- 3. 创建用户表
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(64) NOT NULL COMMENT '用户唯一标识 (Firebase UID 或开发端 test_user_id)',
    `email` VARCHAR(128) NOT NULL COMMENT '电子邮箱',
    `display_name` VARCHAR(64) DEFAULT NULL COMMENT '昵称/显示名',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    `last_login` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    `assessment_completed` TINYINT(1) DEFAULT 0 COMMENT '是否已完成评测',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户基础信息表';

-- 4. 创建财务评估结果表
CREATE TABLE IF NOT EXISTS `assessments` (
    `id` INT AUTO_INCREMENT NOT NULL COMMENT '主键自增ID',
    `user_id` VARCHAR(64) NOT NULL COMMENT '关联的用户ID',
    `answers` JSON DEFAULT NULL COMMENT '问卷答案 (JSON格式)',
    `scores` JSON DEFAULT NULL COMMENT '各个模块的原始评分 (JSON格式)',
    `total_score` DOUBLE NOT NULL COMMENT '平均总得分',
    `total_score_percentage` DOUBLE NOT NULL COMMENT '评分百分比/得分率',
    `total_score_percentage_scale` VARCHAR(32) DEFAULT NULL COMMENT '得分率口径标识 (percent_0_100=修复后新记录; NULL=修复前的旧记录，读取侧按旧口径还原)',
    `category_scores_percentage` JSON DEFAULT NULL COMMENT '各维度的百分制得分 (JSON格式)',
    `categories` JSON DEFAULT NULL COMMENT '维度分类具体数据 (JSON格式)',
    `recommendations` JSON DEFAULT NULL COMMENT '理财建议列表 (JSON格式)',
    `completed` TINYINT(1) DEFAULT 1 COMMENT '是否完成评估',
    `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '评估时间',
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_assessments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_assessment_user` (`user_id`, `timestamp` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='财务评估及画像数据表';

-- 5. 创建财务目标表
CREATE TABLE IF NOT EXISTS `goals` (
    `id` VARCHAR(64) NOT NULL COMMENT '目标ID (UUID或自增字符串)',
    `user_id` VARCHAR(64) NOT NULL COMMENT '关联的用户ID',
    `title` VARCHAR(128) NOT NULL COMMENT '目标标题',
    `description` TEXT DEFAULT NULL COMMENT '目标具体描述',
    `target_amount` DOUBLE NOT NULL COMMENT '目标金额',
    `current_amount` DOUBLE DEFAULT 0.0 COMMENT '当前攒钱金额',
    `progress` DOUBLE DEFAULT 0.0 COMMENT '攒钱进度百分比',
    `deadline` VARCHAR(64) DEFAULT NULL COMMENT '截止日期 (YYYY-MM-DD)',
    `status` VARCHAR(32) DEFAULT 'active' COMMENT '状态 (active: 进行中, completed: 已完成, cancelled: 已取消)',
    `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT NULL COMMENT '最后修改时间',
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_goals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_goals_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户理财目标表';

-- 6. 创建AI教练聊天记录表
CREATE TABLE IF NOT EXISTS `coach_messages` (
    `id` INT AUTO_INCREMENT NOT NULL COMMENT '自增主键',
    `user_id` VARCHAR(64) NOT NULL COMMENT '关联的用户ID',
    `sender` VARCHAR(32) NOT NULL COMMENT '发送者 (user: 用户, assistant: AI教练)',
    `text` TEXT NOT NULL COMMENT '消息正文',
    `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '消息发送时间',
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_messages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_messages_user` (`user_id`, `timestamp` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI教练对话记录表';


-- ==========================================
-- 7. 兼容迁移：给已存在的库补上得分率口径标识列
-- ==========================================
-- CREATE TABLE IF NOT EXISTS 不会给已存在的表补列，所以这里单独处理。
-- MySQL 8 不支持 ADD COLUMN IF NOT EXISTS，故用 information_schema 判断 + 动态 SQL，
-- 保证本脚本可重复执行（新库走上面的建表语句，老库走这里的 ALTER）。
-- 老库补列后历史行该列为 NULL，读取侧即按「修复前的旧记录」还原得分率。
SET @scale_col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'assessments'
      AND COLUMN_NAME = 'total_score_percentage_scale'
);
SET @scale_ddl := IF(@scale_col_exists = 0,
    'ALTER TABLE `assessments` ADD COLUMN `total_score_percentage_scale` VARCHAR(32) DEFAULT NULL COMMENT ''得分率口径标识 (percent_0_100=修复后新记录、NULL=修复前的旧记录)'' AFTER `total_score_percentage`',
    'SELECT 1');
PREPARE scale_stmt FROM @scale_ddl;
EXECUTE scale_stmt;
DEALLOCATE PREPARE scale_stmt;


-- ==========================================
-- 插入初始演示数据 (用于本地测试与检查)
-- ==========================================

-- 1. 插入默认测试用户（对应开发模式的 test_user_id）
INSERT INTO `users` (`id`, `email`, `display_name`, `assessment_completed`) 
VALUES ('test_user_id', 'test@example.com', '测试财务官', 1)
ON DUPLICATE KEY UPDATE `display_name` = VALUES(`display_name`);

-- 2. 插入一条理财目标
INSERT INTO `goals` (`id`, `user_id`, `title`, `description`, `target_amount`, `current_amount`, `progress`, `deadline`, `status`)
VALUES ('goal_default_01', 'test_user_id', '紧急备用金', '储蓄6个月的日常开销，建立第一道防线', 30000.0, 15000.0, 50.0, '2026-12-31', 'active')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 3. 插入初始AI对话问候
INSERT INTO `coach_messages` (`user_id`, `sender`, `text`)
VALUES ('test_user_id', 'assistant', '你好！我是你的AI金融心智教练“财赋思”。我已经准备好帮助你分析你的财务观念、制定合理的储蓄目标并规划理财方案。今天有什么想聊的吗？')
ON DUPLICATE KEY UPDATE `text` = VALUES(`text`);
