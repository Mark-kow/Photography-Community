-- 挑战赛模块数据库表结构
USE photograph_app;

-- 挑战赛表
CREATE TABLE IF NOT EXISTS challenges (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL COMMENT '挑战赛标题',
  cover_image VARCHAR(500) COMMENT '封面图片',
  description TEXT COMMENT '挑战赛描述',
  theme VARCHAR(100) COMMENT '主题',
  organizer_type VARCHAR(20) COMMENT '主办方类型: official-官方, brand-品牌, user-用户',
  organizer_id BIGINT COMMENT '主办方ID',
  start_time DATETIME NOT NULL COMMENT '开始时间',
  end_time DATETIME NOT NULL COMMENT '结束时间',
  difficulty VARCHAR(20) COMMENT '难度: beginner-入门, intermediate-进阶, advanced-专业',
  requirements TEXT COMMENT '参赛要求',
  rules TEXT COMMENT '评选标准',
  prizes JSON COMMENT '奖品设置 [{rank, prize, description}]',
  participant_count INT DEFAULT 0 COMMENT '参与人数',
  work_count INT DEFAULT 0 COMMENT '作品数量',
  view_count INT DEFAULT 0 COMMENT '浏览量',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-草稿 1-报名中 2-进行中 3-评选中 4-已结束',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_organizer_type (organizer_type),
  INDEX idx_start_time (start_time),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='挑战赛表';

-- 挑战赛作品表
CREATE TABLE IF NOT EXISTS challenge_works (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  challenge_id BIGINT NOT NULL COMMENT '挑战赛ID',
  work_id BIGINT NOT NULL COMMENT '作品ID',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  vote_count INT DEFAULT 0 COMMENT '投票数',
  score DECIMAL(5, 2) DEFAULT 0 COMMENT '评委评分',
  ranking INT COMMENT '排名',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_challenge_id (challenge_id),
  INDEX idx_work_id (work_id),
  INDEX idx_user_id (user_id),
  INDEX idx_vote_count (vote_count),
  INDEX idx_score (score),
  UNIQUE KEY uk_challenge_work (challenge_id, work_id),
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
  FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='挑战赛作品表';

-- 挑战赛投票表
CREATE TABLE IF NOT EXISTS challenge_votes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  challenge_id BIGINT NOT NULL COMMENT '挑战赛ID',
  work_id BIGINT NOT NULL COMMENT '作品ID',
  user_id BIGINT NOT NULL COMMENT '投票用户ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_challenge_id (challenge_id),
  INDEX idx_work_id (work_id),
  INDEX idx_user_id (user_id),
  UNIQUE KEY uk_challenge_work_user (challenge_id, work_id, user_id),
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
  FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='挑战赛投票表';

-- 插入测试数据
INSERT INTO challenges (title, cover_image, description, theme, organizer_type, start_time, end_time, difficulty, prizes) VALUES
('冬日摄影挑战', 'https://picsum.photos/800/600?random=701', '用镜头记录冬日的美好瞬间', '冬季', 'official', '2024-12-01 00:00:00', '2024-12-31 23:59:59', 'beginner', 
 '[{"rank":"一等奖","prize":"Sony A7M4","description":"1名"},{"rank":"二等奖","prize":"镜头","description":"3名"},{"rank":"三等奖","prize":"摄影包","description":"10名"}]'),
('人像摄影大赛', 'https://picsum.photos/800/600?random=702', '展示你的人像摄影技巧', '人像', 'brand', '2024-12-10 00:00:00', '2025-01-10 23:59:59', 'intermediate',
 '[{"rank":"金奖","prize":"现金10000元","description":"1名"},{"rank":"银奖","prize":"现金5000元","description":"2名"},{"rank":"铜奖","prize":"现金2000元","description":"3名"}]');

COMMIT;
