-- 添加编辑角色支持
USE photograph_app;

-- 修改role字段注释以支持editor角色
ALTER TABLE users MODIFY COLUMN role VARCHAR(20) DEFAULT 'user' COMMENT '角色: user-普通用户 editor-平台编辑 admin-管理员';

-- 插入一个测试编辑账号
INSERT INTO users (phone, password, nickname, avatar, bio, role) VALUES
('13800138888', '$2a$10$2g.iKwvFQd8N355y6hy9POSMUDEvUjBPv.GqLd.oN386j7Diz/gB2', '平台编辑', 'https://picsum.photos/203', '负责内容审核与编辑', 'editor')
ON DUPLICATE KEY UPDATE role = 'editor';

-- 插入一个测试管理员账号
INSERT INTO users (phone, password, nickname, avatar, bio, role) VALUES
('13800139999', '$2a$10$2g.iKwvFQd8N355y6hy9POSMUDEvUjBPv.GqLd.oN386j7Diz/gB2', '平台管理员', 'https://picsum.photos/204', '系统管理员', 'admin')
ON DUPLICATE KEY UPDATE role = 'admin';

COMMIT;
