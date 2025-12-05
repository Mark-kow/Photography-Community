-- 拍摄地模块数据库表结构
USE photograph_app;

-- 拍摄地点表
CREATE TABLE IF NOT EXISTS locations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '地点名称',
  address VARCHAR(200) NOT NULL COMMENT '详细地址',
  province VARCHAR(50) COMMENT '省份',
  city VARCHAR(50) COMMENT '城市',
  district VARCHAR(50) COMMENT '区县',
  latitude DECIMAL(10, 7) NOT NULL COMMENT '纬度',
  longitude DECIMAL(10, 7) NOT NULL COMMENT '经度',
  cover_image VARCHAR(500) COMMENT '封面图片',
  images JSON COMMENT '地点图片列表',
  description TEXT COMMENT '地点描述',
  category VARCHAR(50) COMMENT '地点类型: natural-自然风光, architecture-建筑, modern-现代建筑, park-公园',
  best_time VARCHAR(100) COMMENT '最佳拍摄时段: sunrise-日出, sunset-日落, night-夜景, star-星空',
  opening_hours VARCHAR(100) COMMENT '开放时间',
  ticket_price VARCHAR(50) COMMENT '门票价格',
  tips TEXT COMMENT '拍摄建议和注意事项',
  recommended_params JSON COMMENT '推荐拍摄参数 {aperture, shutter_speed, iso}',
  checkin_count INT DEFAULT 0 COMMENT '打卡次数',
  work_count INT DEFAULT 0 COMMENT '作品数量',
  rating DECIMAL(3, 2) DEFAULT 0 COMMENT '评分(0-5)',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-已删除 1-正常',
  created_by BIGINT COMMENT '创建者ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_name (name),
  INDEX idx_city (city),
  INDEX idx_category (category),
  INDEX idx_location (latitude, longitude),
  INDEX idx_checkin_count (checkin_count),
  INDEX idx_rating (rating),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='拍摄地点表';

-- 地点打卡记录表
CREATE TABLE IF NOT EXISTS location_checkins (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  location_id BIGINT NOT NULL COMMENT '地点ID',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  work_id BIGINT COMMENT '关联作品ID',
  images JSON COMMENT '打卡照片',
  content TEXT COMMENT '打卡心得',
  rating TINYINT COMMENT '评分(1-5)',
  visit_date DATE COMMENT '访问日期',
  weather VARCHAR(50) COMMENT '天气情况',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_location_id (location_id),
  INDEX idx_user_id (user_id),
  INDEX idx_visit_date (visit_date),
  UNIQUE KEY uk_user_location_date (user_id, location_id, visit_date),
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='地点打卡记录表';

-- 拍摄攻略表
CREATE TABLE IF NOT EXISTS location_guides (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  location_id BIGINT NOT NULL COMMENT '地点ID',
  user_id BIGINT NOT NULL COMMENT '作者ID',
  title VARCHAR(100) NOT NULL COMMENT '攻略标题',
  content TEXT NOT NULL COMMENT '攻略内容(支持Markdown)',
  images JSON COMMENT '配图列表',
  best_positions JSON COMMENT '推荐机位 [{name, latitude, longitude, description}]',
  equipment_suggestions TEXT COMMENT '器材建议',
  transportation TEXT COMMENT '交通指南',
  notes TEXT COMMENT '注意事项',
  like_count INT DEFAULT 0 COMMENT '点赞数',
  collect_count INT DEFAULT 0 COMMENT '收藏数',
  view_count INT DEFAULT 0 COMMENT '浏览量',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-草稿 1-已发布 2-已删除',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_location_id (location_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_like_count (like_count),
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='拍摄攻略表';

-- 插入测试数据
INSERT INTO locations (name, address, province, city, latitude, longitude, cover_image, description, category, best_time, opening_hours, ticket_price, tips) VALUES
('外滩', '上海市黄浦区中山东一路', '上海', '上海', 31.239854, 121.490637, 'https://picsum.photos/800/600?random=101', '上海外滩位于黄浦江畔，是上海最具代表性的地标之一，适合拍摄城市夜景和建筑。', 'architecture', 'sunset,night', '全天开放', '免费', '夜景拍摄建议使用三脚架，注意防风'),
('黄山风景区', '安徽省黄山市黄山区', '安徽', '黄山', 30.134490, 118.167720, 'https://picsum.photos/800/600?random=102', '中国著名的风景名胜区，以奇松、怪石、云海、温泉四绝著称。', 'natural', 'sunrise,sunset', '6:30-17:30', '190元', '建议提前查看日出日落时间，准备好防寒衣物'),
('西湖', '浙江省杭州市西湖区', '浙江', '杭州', 30.259244, 120.152792, 'https://picsum.photos/800/600?random=103', '杭州西湖以其秀丽的湖光山色和众多的名胜古迹闻名。', 'natural', 'sunrise,sunset', '全天开放', '免费', '春季桃花盛开，秋季桂花飘香，都是拍摄的好时节'),
('故宫博物院', '北京市东城区景山前街4号', '北京', '北京', 39.916345, 116.397155, 'https://picsum.photos/800/600?random=104', '中国明清两代的皇家宫殿，是世界上现存规模最大、保存最为完整的木质结构古建筑之一。', 'architecture', 'sunrise,sunset', '8:30-17:00', '60元', '建议早上入场避开人流，注意保护文物不要使用闪光灯');

COMMIT;
