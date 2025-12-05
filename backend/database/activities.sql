-- 约拍模块数据库表结构
USE photograph_app;

-- 活动表
CREATE TABLE IF NOT EXISTS activities (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  creator_id BIGINT NOT NULL COMMENT '创建者ID',
  title VARCHAR(100) NOT NULL COMMENT '活动标题',
  cover_image VARCHAR(500) COMMENT '封面图片',
  description TEXT COMMENT '活动描述',
  activity_type VARCHAR(50) COMMENT '活动类型: sunrise-晨拍, sunset-日落, night-夜拍, theme-主题拍摄',
  location VARCHAR(100) COMMENT '活动地点',
  latitude DECIMAL(10, 7) COMMENT '纬度',
  longitude DECIMAL(10, 7) COMMENT '经度',
  start_time DATETIME NOT NULL COMMENT '开始时间',
  end_time DATETIME COMMENT '结束时间',
  max_participants INT DEFAULT 0 COMMENT '人数限制(0为不限)',
  current_participants INT DEFAULT 0 COMMENT '当前参与人数',
  fee_type VARCHAR(20) COMMENT '费用类型: free-免费, aa-AA制, paid-收费',
  fee_amount DECIMAL(10, 2) DEFAULT 0 COMMENT '费用金额',
  requirements TEXT COMMENT '活动要求',
  schedule TEXT COMMENT '活动流程',
  notes TEXT COMMENT '注意事项',
  tags JSON COMMENT '活动标签',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-已取消 1-招募中 2-已满员 3-进行中 4-已结束',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_creator_id (creator_id),
  INDEX idx_activity_type (activity_type),
  INDEX idx_start_time (start_time),
  INDEX idx_status (status),
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动表';

-- 活动参与者表
CREATE TABLE IF NOT EXISTS activity_participants (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  activity_id BIGINT NOT NULL COMMENT '活动ID',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-已取消 1-已报名 2-已参加',
  message TEXT COMMENT '报名留言',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activity_id (activity_id),
  INDEX idx_user_id (user_id),
  UNIQUE KEY uk_activity_user (activity_id, user_id),
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动参与者表';

-- 导师表
CREATE TABLE IF NOT EXISTS mentors (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  expertise JSON COMMENT '擅长领域',
  teaching_experience TEXT COMMENT '教学经验',
  student_count INT DEFAULT 0 COMMENT '学生数量',
  rating DECIMAL(3, 2) DEFAULT 0 COMMENT '评分',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-已禁用 1-正常',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='导师表';

-- 师徒关系表
CREATE TABLE IF NOT EXISTS mentor_students (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  mentor_id BIGINT NOT NULL COMMENT '导师ID',
  student_id BIGINT NOT NULL COMMENT '学生ID',
  status TINYINT DEFAULT 0 COMMENT '状态: 0-待审核 1-已接受 2-已拒绝 3-已结束',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mentor_id (mentor_id),
  INDEX idx_student_id (student_id),
  UNIQUE KEY uk_mentor_student (mentor_id, student_id),
  FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='师徒关系表';

-- 插入测试数据
INSERT INTO activities (creator_id, title, cover_image, description, activity_type, location, start_time, max_participants, fee_type) VALUES
(1, '周末外滩日落拍摄', 'https://picsum.photos/800/600?random=601', '一起去外滩拍摄美丽的日落，欢迎新手参加', 'sunset', '上海外滩', '2024-12-07 17:00:00', 10, 'free'),
(2, '黄山云海摄影团', 'https://picsum.photos/800/600?random=602', '3天2晚黄山摄影之旅，拍摄云海日出', 'theme', '安徽黄山', '2024-12-15 06:00:00', 15, 'aa'),
(1, '夜景人像拍摄练习', 'https://picsum.photos/800/600?random=603', '学习夜景人像拍摄技巧，带模特', 'night', '北京三里屯', '2024-12-10 19:00:00', 8, 'aa');

COMMIT;
