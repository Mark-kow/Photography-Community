-- 学习模块数据库表结构
USE photograph_app;

-- 课程表
CREATE TABLE IF NOT EXISTS courses (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL COMMENT '课程标题',
  cover_image VARCHAR(500) COMMENT '课程封面',
  description TEXT COMMENT '课程简介',
  category VARCHAR(50) COMMENT '课程分类: shooting-拍摄, post-后期, equipment-器材',
  difficulty VARCHAR(20) COMMENT '难度: beginner-入门, intermediate-进阶, advanced-高级',
  type VARCHAR(20) COMMENT '课程类型: video-视频, article-图文',
  instructor_id BIGINT COMMENT '讲师ID',
  duration INT DEFAULT 0 COMMENT '课程时长(分钟)',
  chapter_count INT DEFAULT 0 COMMENT '章节数',
  student_count INT DEFAULT 0 COMMENT '学习人数',
  rating DECIMAL(3, 2) DEFAULT 0 COMMENT '评分(0-5)',
  price DECIMAL(10, 2) DEFAULT 0 COMMENT '价格(0为免费)',
  is_free TINYINT DEFAULT 1 COMMENT '是否免费: 0-收费 1-免费',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-草稿 1-已发布 2-已下架',
  view_count INT DEFAULT 0 COMMENT '浏览量',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_category (category),
  INDEX idx_difficulty (difficulty),
  INDEX idx_instructor_id (instructor_id),
  INDEX idx_status (status),
  INDEX idx_student_count (student_count),
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程表';

-- 课程章节表
CREATE TABLE IF NOT EXISTS course_chapters (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  course_id BIGINT NOT NULL COMMENT '课程ID',
  title VARCHAR(100) NOT NULL COMMENT '章节标题',
  description TEXT COMMENT '章节描述',
  video_url VARCHAR(500) COMMENT '视频URL',
  content TEXT COMMENT '章节内容(图文课程)',
  duration INT DEFAULT 0 COMMENT '时长(秒)',
  order_num INT DEFAULT 0 COMMENT '排序序号',
  is_free TINYINT DEFAULT 0 COMMENT '是否试看: 0-否 1-是',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-已删除 1-正常',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_course_id (course_id),
  INDEX idx_order_num (order_num),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程章节表';

-- 学习进度表
CREATE TABLE IF NOT EXISTS course_progress (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  course_id BIGINT NOT NULL COMMENT '课程ID',
  chapter_id BIGINT COMMENT '当前章节ID',
  progress INT DEFAULT 0 COMMENT '学习进度(0-100)',
  last_learn_time TIMESTAMP NULL COMMENT '最后学习时间',
  completed_chapters JSON COMMENT '已完成的章节ID列表',
  is_completed TINYINT DEFAULT 0 COMMENT '是否完成: 0-未完成 1-已完成',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '开始学习时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_user_id (user_id),
  INDEX idx_course_id (course_id),
  UNIQUE KEY uk_user_course (user_id, course_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES course_chapters(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习进度表';

-- 课程笔记表
CREATE TABLE IF NOT EXISTS course_notes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  course_id BIGINT NOT NULL COMMENT '课程ID',
  chapter_id BIGINT COMMENT '章节ID',
  content TEXT NOT NULL COMMENT '笔记内容',
  video_time INT COMMENT '视频时间点(秒)',
  screenshot VARCHAR(500) COMMENT '截图URL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_user_id (user_id),
  INDEX idx_course_id (course_id),
  INDEX idx_chapter_id (chapter_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES course_chapters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程笔记表';

-- 技巧库表
CREATE TABLE IF NOT EXISTS tips (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL COMMENT '技巧标题',
  cover_image VARCHAR(500) COMMENT '封面图',
  content TEXT NOT NULL COMMENT '技巧内容(支持Markdown)',
  images JSON COMMENT '配图列表',
  category VARCHAR(50) COMMENT '分类: portrait-人像, landscape-风光, street-街拍, architecture-建筑',
  technique_type VARCHAR(50) COMMENT '技术类型: exposure-曝光, focus-对焦, composition-构图, lighting-用光',
  difficulty VARCHAR(20) COMMENT '难度: beginner-入门, intermediate-进阶, advanced-高级',
  reading_time INT DEFAULT 0 COMMENT '阅读时间(分钟)',
  author_id BIGINT COMMENT '作者ID',
  like_count INT DEFAULT 0 COMMENT '点赞数',
  collect_count INT DEFAULT 0 COMMENT '收藏数',
  view_count INT DEFAULT 0 COMMENT '浏览量',
  practice_count INT DEFAULT 0 COMMENT '实践次数',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-草稿 1-已发布 2-已删除',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_category (category),
  INDEX idx_technique_type (technique_type),
  INDEX idx_difficulty (difficulty),
  INDEX idx_author_id (author_id),
  INDEX idx_like_count (like_count),
  INDEX idx_status (status),
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='技巧库表';

-- 插入测试数据
INSERT INTO courses (title, cover_image, description, category, difficulty, type, instructor_id, duration, is_free) VALUES
('摄影入门完全指南', 'https://picsum.photos/800/450?random=201', '从零开始学习摄影，掌握相机基本操作和摄影基础知识', 'shooting', 'beginner', 'video', 1, 180, 1),
('人像摄影用光技巧', 'https://picsum.photos/800/450?random=202', '深入学习人像摄影中的用光技巧，打造专业人像作品', 'shooting', 'intermediate', 'video', 2, 240, 0),
('Lightroom后期处理', 'https://picsum.photos/800/450?random=203', '系统学习Lightroom软件，掌握RAW格式照片后期处理', 'post', 'intermediate', 'video', 1, 300, 0),
('风光摄影实战', 'https://picsum.photos/800/450?random=204', '跟随大师学习风光摄影的拍摄技巧和后期处理', 'shooting', 'advanced', 'video', 2, 360, 0);

INSERT INTO tips (title, cover_image, content, category, technique_type, difficulty, reading_time, author_id) VALUES
('三分法构图详解', 'https://picsum.photos/600/400?random=301', '## 什么是三分法构图\n\n三分法是摄影构图中最基础也是最实用的构图方法...', 'portrait', 'composition', 'beginner', 5, 1),
('黄金时刻拍摄技巧', 'https://picsum.photos/600/400?random=302', '## 什么是黄金时刻\n\n黄金时刻是指日出后和日落前的一段时间...', 'landscape', 'lighting', 'intermediate', 8, 2),
('街拍中的抓拍技巧', 'https://picsum.photos/600/400?random=303', '## 街拍抓拍的核心要素\n\n街拍最重要的是要快、准、稳...', 'street', 'focus', 'intermediate', 6, 1);

-- 更新课程章节数
UPDATE courses SET chapter_count = 0;

COMMIT;
