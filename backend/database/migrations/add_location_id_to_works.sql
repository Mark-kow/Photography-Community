-- 为作品表添加location_id字段，关联拍摄地表
-- 执行时间: 2024-12-05

USE photograph_app;

-- 1. 添加location_id字段
ALTER TABLE works 
ADD COLUMN location_id BIGINT COMMENT '拍摄地ID(关联locations表)' AFTER images,
ADD INDEX idx_location_id (location_id);

-- 2. 添加外键约束（可选，根据需要决定是否启用）
-- ALTER TABLE works 
-- ADD FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

-- 3. 更新locations表，添加work_count更新触发器会更好，但这里先手动维护
-- 当作品关联地点时，自动增加该地点的work_count

COMMIT;
