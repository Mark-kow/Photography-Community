-- 器材模块数据库表结构
USE photograph_app;

-- 相机表
CREATE TABLE IF NOT EXISTS cameras (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  brand VARCHAR(50) NOT NULL COMMENT '品牌',
  model VARCHAR(100) NOT NULL COMMENT '型号',
  cover_image VARCHAR(500) COMMENT '封面图片',
  images JSON COMMENT '产品图片列表',
  sensor_type VARCHAR(50) COMMENT '传感器类型: full-frame-全画幅, aps-c, m43, medium-format-中画幅',
  megapixels DECIMAL(4, 1) COMMENT '像素(MP)',
  iso_range VARCHAR(50) COMMENT 'ISO范围',
  shutter_speed VARCHAR(50) COMMENT '快门速度范围',
  continuous_shooting DECIMAL(4, 1) COMMENT '连拍速度(fps)',
  focus_points INT COMMENT '对焦点数量',
  video_spec VARCHAR(100) COMMENT '视频规格',
  weight INT COMMENT '重量(g)',
  dimensions VARCHAR(50) COMMENT '尺寸(mm)',
  release_date DATE COMMENT '发布日期',
  price DECIMAL(10, 2) COMMENT '参考价格',
  description TEXT COMMENT '产品描述',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-停产 1-在售',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_brand (brand),
  INDEX idx_sensor_type (sensor_type),
  INDEX idx_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='相机表';

-- 镜头表
CREATE TABLE IF NOT EXISTS lenses (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  brand VARCHAR(50) NOT NULL COMMENT '品牌',
  model VARCHAR(100) NOT NULL COMMENT '型号',
  cover_image VARCHAR(500) COMMENT '封面图片',
  images JSON COMMENT '产品图片列表',
  mount VARCHAR(50) COMMENT '卡口类型',
  focal_length VARCHAR(50) COMMENT '焦距',
  max_aperture VARCHAR(20) COMMENT '最大光圈',
  lens_type VARCHAR(50) COMMENT '镜头类型: prime-定焦, zoom-变焦',
  image_stabilization TINYINT COMMENT '是否防抖: 0-否 1-是',
  autofocus TINYINT COMMENT '是否自动对焦: 0-否 1-是',
  weight INT COMMENT '重量(g)',
  filter_diameter INT COMMENT '滤镜口径(mm)',
  release_date DATE COMMENT '发布日期',
  price DECIMAL(10, 2) COMMENT '参考价格',
  description TEXT COMMENT '产品描述',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-停产 1-在售',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_brand (brand),
  INDEX idx_mount (mount),
  INDEX idx_lens_type (lens_type),
  INDEX idx_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='镜头表';

-- 用户器材库表
CREATE TABLE IF NOT EXISTS user_equipments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  equipment_type VARCHAR(20) NOT NULL COMMENT '器材类型: camera-相机, lens-镜头, accessory-配件',
  equipment_id BIGINT COMMENT '器材ID(关联cameras或lenses表)',
  custom_name VARCHAR(100) COMMENT '自定义名称(配件使用)',
  purchase_date DATE COMMENT '购买日期',
  purchase_price DECIMAL(10, 2) COMMENT '购买价格',
  shutter_count INT COMMENT '快门数(相机)',
  notes TEXT COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_equipment_type (equipment_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户器材库表';

-- 二手市场表
CREATE TABLE IF NOT EXISTS equipment_market (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  seller_id BIGINT NOT NULL COMMENT '卖家ID',
  equipment_type VARCHAR(20) NOT NULL COMMENT '器材类型',
  equipment_id BIGINT COMMENT '器材ID',
  custom_name VARCHAR(100) COMMENT '自定义名称',
  title VARCHAR(100) NOT NULL COMMENT '标题',
  description TEXT COMMENT '描述',
  images JSON COMMENT '图片列表',
  condition_level VARCHAR(20) COMMENT '成色: new-全新, 99-99新, 95-95新, 90-90新, 80-80新',
  shutter_count INT COMMENT '快门数',
  accessories TEXT COMMENT '配件清单',
  price DECIMAL(10, 2) NOT NULL COMMENT '售价',
  original_price DECIMAL(10, 2) COMMENT '原价',
  trade_method VARCHAR(50) COMMENT '交易方式: local-当面, mail-邮寄, both-都可',
  location VARCHAR(100) COMMENT '所在地',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-已下架 1-在售 2-已售出',
  view_count INT DEFAULT 0 COMMENT '浏览量',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_seller_id (seller_id),
  INDEX idx_equipment_type (equipment_type),
  INDEX idx_status (status),
  INDEX idx_price (price),
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='二手市场表';

-- 插入测试数据
INSERT INTO cameras (brand, model, cover_image, sensor_type, megapixels, iso_range, continuous_shooting, focus_points, video_spec, weight, price, description) VALUES
('Sony', 'A7M4', 'https://picsum.photos/400/300?random=401', 'full-frame', 33.0, '100-51200', 10.0, 759, '4K 60p', 658, 15999, '全能型全画幅微单相机，适合各类摄影题材'),
('Canon', 'EOS R6', 'https://picsum.photos/400/300?random=402', 'full-frame', 20.1, '100-102400', 12.0, 6072, '4K 60p', 680, 15999, '专业全画幅微单，强大的对焦和连拍性能'),
('Nikon', 'Z6 II', 'https://picsum.photos/400/300?random=403', 'full-frame', 24.5, '100-51200', 14.0, 273, '4K 60p', 705, 13999, '尼康全画幅微单，双卡槽设计'),
('Fujifilm', 'X-T4', 'https://picsum.photos/400/300?random=404', 'aps-c', 26.1, '160-12800', 15.0, 425, '4K 60p', 607, 10999, '富士APS-C画幅旗舰，胶片模拟出色');

INSERT INTO lenses (brand, model, cover_image, mount, focal_length, max_aperture, lens_type, image_stabilization, autofocus, weight, filter_diameter, price, description) VALUES
('Sony', 'FE 24-70mm F2.8 GM II', 'https://picsum.photos/400/300?random=501', 'E-mount', '24-70mm', '2.8', 'zoom', 1, 1, 695, 82, 14999, '索尼大师镜头，标准变焦之选'),
('Canon', 'RF 50mm F1.8 STM', 'https://picsum.photos/400/300?random=502', 'RF', '50mm', '1.8', 'prime', 0, 1, 160, 43, 1399, '高性价比标准定焦镜头'),
('Nikon', 'Z 24-120mm f/4 S', 'https://picsum.photos/400/300?random=503', 'Z-mount', '24-120mm', '4', 'zoom', 1, 1, 630, 77, 7999, '尼康S系列大范围变焦镜头');

COMMIT;
