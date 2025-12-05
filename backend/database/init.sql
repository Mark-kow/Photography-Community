-- 摄影社区数据库初始化 (MVP阶段)
-- 创建数据库
CREATE DATABASE IF NOT EXISTS photograph_app DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE photograph_app;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(20) UNIQUE NOT NULL COMMENT '手机号',
  password VARCHAR(255) COMMENT '密码(加密)',
  nickname VARCHAR(50) NOT NULL COMMENT '昵称',
  avatar VARCHAR(500) COMMENT '头像URL',
  bio VARCHAR(200) COMMENT '个人简介',
  gender TINYINT DEFAULT 0 COMMENT '性别: 0-未知 1-男 2-女',
  birthday DATE COMMENT '生日',
  location VARCHAR(100) COMMENT '所在地',
  role VARCHAR(20) DEFAULT 'user' COMMENT '角色: user-普通用户 admin-管理员',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用 1-正常',
  followers_count INT DEFAULT 0 COMMENT '粉丝数',
  following_count INT DEFAULT 0 COMMENT '关注数',
  works_count INT DEFAULT 0 COMMENT '作品数',
  likes_count INT DEFAULT 0 COMMENT '获赞数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_phone (phone),
  INDEX idx_nickname (nickname),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 作品表
CREATE TABLE IF NOT EXISTS works (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  title VARCHAR(100) COMMENT '标题',
  description TEXT COMMENT '描述',
  images JSON NOT NULL COMMENT '图片URL列表',
  location VARCHAR(100) COMMENT '拍摄地点',
  camera VARCHAR(100) COMMENT '相机型号',
  lens VARCHAR(100) COMMENT '镜头型号',
  aperture VARCHAR(20) COMMENT '光圈',
  shutter_speed VARCHAR(20) COMMENT '快门速度',
  iso VARCHAR(20) COMMENT 'ISO',
  focal_length VARCHAR(20) COMMENT '焦距',
  tags JSON COMMENT '标签列表',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-草稿 1-已发布 2-已删除',
  view_count INT DEFAULT 0 COMMENT '浏览量',
  like_count INT DEFAULT 0 COMMENT '点赞数',
  comment_count INT DEFAULT 0 COMMENT '评论数',
  collect_count INT DEFAULT 0 COMMENT '收藏数',
  share_count INT DEFAULT 0 COMMENT '分享数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_like_count (like_count),
  INDEX idx_user_status_time (user_id, status, created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作品表';

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  work_id BIGINT NOT NULL COMMENT '作品ID',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  parent_id BIGINT DEFAULT NULL COMMENT '父评论ID',
  content TEXT NOT NULL COMMENT '评论内容',
  like_count INT DEFAULT 0 COMMENT '点赞数',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-已删除 1-正常',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_work_id (work_id),
  INDEX idx_user_id (user_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论表';

-- 关注表
CREATE TABLE IF NOT EXISTS follows (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  follower_id BIGINT NOT NULL COMMENT '关注者ID',
  followee_id BIGINT NOT NULL COMMENT '被关注者ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_follower_id (follower_id),
  INDEX idx_followee_id (followee_id),
  UNIQUE KEY uk_follower_followee (follower_id, followee_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (followee_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='关注表';

-- 点赞表
CREATE TABLE IF NOT EXISTS likes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  target_id BIGINT NOT NULL COMMENT '目标ID',
  target_type VARCHAR(20) NOT NULL COMMENT '目标类型: work-作品 comment-评论',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_user_target (user_id, target_id, target_type),
  UNIQUE KEY uk_user_target (user_id, target_id, target_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='点赞表';

-- 收藏表
CREATE TABLE IF NOT EXISTS collections (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  work_id BIGINT NOT NULL COMMENT '作品ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_user_id (user_id),
  INDEX idx_work_id (work_id),
  UNIQUE KEY uk_user_work (user_id, work_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏表';

-- 插入测试用户数据
INSERT INTO users (phone, password, nickname, avatar, bio) VALUES
('13800138001', '$2a$10$2g.iKwvFQd8N355y6hy9POSMUDEvUjBPv.GqLd.oN386j7Diz/gB2', '摄影师小王', 'https://picsum.photos/200', '热爱摄影，记录生活'),
('13800138002', '$2a$10$2g.iKwvFQd8N355y6hy9POSMUDEvUjBPv.GqLd.oN386j7Diz/gB2', '风光大师', 'https://picsum.photos/201', '专注风光摄影10年'),
('13800138003', '$2a$10$2g.iKwvFQd8N355y6hy9POSMUDEvUjBPv.GqLd.oN386j7Diz/gB2', '人像达人', 'https://picsum.photos/202', '擅长人像和街拍');
-- 默认密码都是: 123456

-- 插入测试作品数据
INSERT INTO works (user_id, title, description, images, location, camera, tags) VALUES
(1, '夕阳下的城市', '傍晚时分拍摄的城市风光', '["https://picsum.photos/800/600?random=1"]', '上海外滩', 'Sony A7M3', '["风光", "城市", "夕阳"]'),
(1, '街头瞬间', '捕捉街头行人的精彩瞬间', '["https://picsum.photos/800/600?random=2"]', '北京王府井', 'Canon EOS R5', '["街拍", "人文"]'),
(2, '山间云海', '清晨山顶拍摄的云海美景', '["https://picsum.photos/800/600?random=3", "https://picsum.photos/800/600?random=4"]', '黄山', 'Nikon Z9', '["风光", "自然", "云海"]'),
(3, '人像作品', '清新自然的人像摄影', '["https://picsum.photos/800/600?random=5"]', '杭州西湖', 'Fujifilm X-T4', '["人像", "清新"]');

-- 更新用户作品数
UPDATE users SET works_count = (SELECT COUNT(*) FROM works WHERE works.user_id = users.id);

COMMIT;
