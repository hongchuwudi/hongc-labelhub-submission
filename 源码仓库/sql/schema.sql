-- =============================================================================
-- LabelHub 数据库建表语句（不含数据）
-- 导出日期: 2026-06-10
-- 数据库:   labelhub
-- 字符集:   utf8mb4 / utf8mb4_unicode_ci
-- 引擎:     InnoDB
-- 共 11 张表: users / datasets / dataset_items / label_schemas / tasks / task_items
--             results / ai_reviews / ai_agents / audit_logs / export_jobs
-- =============================================================================

-- MySQL dump 10.13  Distrib 8.0.44, for Linux (x86_64)
--
-- Host: localhost    Database: labelhub
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ai_agents`
--

DROP TABLE IF EXISTS `ai_agents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_agents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Agent 名称',
  `email` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '邮箱',
  `password_hash` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密码哈希',
  `system_prompt` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'System Prompt 模板',
  `scoring_dimensions` json NOT NULL COMMENT '评分维度',
  `llm_model` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'LLM 模型',
  `created_by` int NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `ai_agents_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ai_reviews`
--

DROP TABLE IF EXISTS `ai_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `item_id` int NOT NULL,
  `result_id` int NOT NULL,
  `agent_id` int NOT NULL,
  `verdict` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `summary` text COLLATE utf8mb4_unicode_ci,
  `dimensions` json DEFAULT NULL COMMENT '各维度评分 [{name,score,reason}]',
  `overall_score` float DEFAULT NULL COMMENT '综合分 0-100',
  `model` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prompt_template` text COLLATE utf8mb4_unicode_ci,
  `prompt_vars` json DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'pending/processing/done/failed',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `duration_ms` int DEFAULT NULL COMMENT '执行耗时(毫秒)',
  `created_at` datetime NOT NULL,
  `finished_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  KEY `item_id` (`item_id`),
  KEY `result_id` (`result_id`),
  KEY `agent_id` (`agent_id`),
  CONSTRAINT `ai_reviews_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`),
  CONSTRAINT `ai_reviews_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `dataset_items` (`id`),
  CONSTRAINT `ai_reviews_ibfk_3` FOREIGN KEY (`result_id`) REFERENCES `results` (`id`),
  CONSTRAINT `ai_reviews_ibfk_4` FOREIGN KEY (`agent_id`) REFERENCES `ai_agents` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `actor_id` int NOT NULL COMMENT '操作者用户 ID',
  `actor_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作者姓名（冗余，方便查询）',
  `actor_role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作者角色',
  `entity_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '实体类型: LabelResult / TaskItem / LabelTask',
  `entity_id` int NOT NULL COMMENT '实体 ID',
  `task_id` int NOT NULL COMMENT '所属任务——级联删除',
  `action` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '动作: submit / skip / approve / reject / publish / pause / end',
  `from_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '变更前状态',
  `to_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '变更后状态',
  `detail` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '备注: 驳回理由 / AI 评分摘要等',
  `created_at` datetime NOT NULL COMMENT '记录时间',
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dataset_items`
--

DROP TABLE IF EXISTS `dataset_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dataset_items` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `dataset_id` int NOT NULL COMMENT '所属数据集 ID',
  `index` int NOT NULL COMMENT '在数据集中的序号（从 0 开始）',
  `data` json NOT NULL COMMENT '原始数据内容，如 {''text'': ''...'', ''image_url'': ''...''}',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '最近更新时间',
  PRIMARY KEY (`id`),
  KEY `dataset_id` (`dataset_id`),
  CONSTRAINT `dataset_items_ibfk_1` FOREIGN KEY (`dataset_id`) REFERENCES `datasets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `datasets`
--

DROP TABLE IF EXISTS `datasets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `datasets` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '数据集名称，如「图片分类样本 v1」',
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '数据集描述说明',
  `format` enum('json','jsonl','csv','excel') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '数据文件格式：json / jsonl / csv / excel',
  `item_count` int NOT NULL COMMENT '数据条目总数（如 1000 条文本）',
  `owner_id` int NOT NULL COMMENT '数据集创建者（Owner）的用户 ID',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '最近更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `export_jobs`
--

DROP TABLE IF EXISTS `export_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `export_jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL COMMENT '所属任务',
  `requested_by` int NOT NULL COMMENT '发起导出的 Owner ID',
  `format` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'json / jsonl / csv / xlsx',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'pending / processing / done / failed',
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '导出文件路径',
  `file_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '下载显示文件名',
  `field_mapping` text COLLATE utf8mb4_unicode_ci COMMENT 'JSON 字符串: {fields:[...], rename:{...}}，为空则全量导出',
  `error_message` text COLLATE utf8mb4_unicode_ci COMMENT '失败原因',
  `item_count` int DEFAULT NULL COMMENT '导出的记录数',
  `created_at` datetime NOT NULL,
  `finished_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  KEY `requested_by` (`requested_by`),
  CONSTRAINT `export_jobs_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `export_jobs_ibfk_2` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `label_schemas`
--

DROP TABLE IF EXISTS `label_schemas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `label_schemas` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Schema 名称，如「图片分类标注模板」',
  `version` int NOT NULL COMMENT '版本号，每次修改自增，用于追溯历史版本',
  `schema` json NOT NULL COMMENT 'JSON Schema 定义内容，描述标注表单的字段、类型、校验规则',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '最近更新时间',
  `owner_id` int NOT NULL DEFAULT '1' COMMENT '创建者 ID',
  `version_history` json DEFAULT NULL COMMENT '历史版本记录',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `results`
--

DROP TABLE IF EXISTS `results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `results` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `task_id` int NOT NULL COMMENT '所属标注任务 ID',
  `item_id` int NOT NULL COMMENT '对应的数据条目 ID（数据集中的一条数据）',
  `labeler_id` int NOT NULL COMMENT '标注者 ID：用户 ID 或 AI Agent 标识',
  `labeler_type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'human' COMMENT 'human/AI',
  `data` json NOT NULL COMMENT '标注结果数据，结构由 Schema 定义',
  `round` int NOT NULL COMMENT '标注轮次：1=初次标注, 2=驳回后修正, 3=再次修正...',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'submitted' COMMENT '审核状态',
  `comment` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '审核意见，驳回时填写驳回原因',
  `created_at` datetime NOT NULL COMMENT '提交时间',
  `reviewer_id` int DEFAULT NULL COMMENT '审核人ID',
  `reviewed_at` datetime DEFAULT NULL COMMENT '审核时间',
  `ai_scores` json DEFAULT NULL COMMENT 'AI评分',
  PRIMARY KEY (`id`),
  KEY `reviewer_id` (`reviewer_id`),
  CONSTRAINT `results_ibfk_1` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `task_items`
--

DROP TABLE IF EXISTS `task_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `dataset_item_id` int NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'pending/labeled/skipped',
  `labeler_id` int DEFAULT NULL COMMENT '完成标注的用户 ID',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `flow_history` json DEFAULT NULL COMMENT '条目完整流转历史',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_task_item` (`task_id`,`dataset_item_id`),
  KEY `dataset_item_id` (`dataset_item_id`),
  KEY `labeler_id` (`labeler_id`),
  KEY `idx_task_items_claim` (`task_id`,`labeler_id`,`status`),
  CONSTRAINT `task_items_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_items_ibfk_2` FOREIGN KEY (`dataset_item_id`) REFERENCES `dataset_items` (`id`),
  CONSTRAINT `task_items_ibfk_3` FOREIGN KEY (`labeler_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `dataset_id` int NOT NULL COMMENT '所属数据集 ID',
  `schema_id` int NOT NULL COMMENT '使用的标注 Schema ID',
  `assignee_id` int DEFAULT NULL,
  `assignee_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'labeler' COMMENT 'labeler/ai_agent',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft' COMMENT 'draft/published/paused/ended',
  `total_items` int NOT NULL COMMENT '任务分配的总条目数',
  `completed_items` int NOT NULL COMMENT '已完成标注的条目数',
  `created_at` datetime NOT NULL COMMENT '任务创建时间',
  `updated_at` datetime NOT NULL COMMENT '最近更新时间',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '任务标题',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '任务描述',
  `tags` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '标签',
  `owner_id` int NOT NULL DEFAULT '0' COMMENT '创建者ID',
  `deadline` datetime DEFAULT NULL COMMENT '截止时间',
  `quota` int DEFAULT '0' COMMENT '配额',
  `distribution_strategy` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'first_come' COMMENT 'first_come/assigned/quota_grab',
  `reward_per_item` float DEFAULT NULL COMMENT '每条奖励金额（元）',
  `reward_cap` float DEFAULT NULL COMMENT '月度奖励封顶（元）',
  `grab_limit` int DEFAULT NULL COMMENT '配额抢单每人最大认领数',
  `ai_agent_id` int DEFAULT NULL,
  `schema_snapshot` json DEFAULT NULL COMMENT '任务发布时冻结的Schema副本',
  `schema_version` int NOT NULL DEFAULT '1' COMMENT '使用的Schema版本号',
  PRIMARY KEY (`id`),
  KEY `owner_id` (`owner_id`),
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户显示名称',
  `role` enum('owner','labeler','reviewer','ai_agent') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'labeler' COMMENT '角色',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '登录邮箱，全局唯一',
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密码哈希值（bcrypt）',
  `created_at` datetime NOT NULL COMMENT '账号创建时间',
  `updated_at` datetime NOT NULL COMMENT '最近更新时间',
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '头像URL',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping events for database 'labelhub'
--

--
-- Dumping routines for database 'labelhub'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-10  7:37:18
