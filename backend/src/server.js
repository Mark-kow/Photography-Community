const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 导入配置
require('./config/database');
require('./config/redis');

// 导入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const workRoutes = require('./routes/works');
const commentRoutes = require('./routes/comments');
const locationRoutes = require('./routes/locations');
const courseRoutes = require('./routes/courses');
const equipmentRoutes = require('./routes/equipments');
const activityRoutes = require('./routes/activities');
const challengeRoutes = require('./routes/challenges');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API路由
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/works', workRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/equipments', equipmentRoutes);
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/challenges', challengeRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/admin', adminRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'photograph-api'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: 40400,
    message: '请求的资源不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('错误:', err);
  res.status(err.status || 500).json({
    code: err.code || 50000,
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   📸 摄影社区 API 服务已启动           ║
║   🚀 运行环境: ${process.env.NODE_ENV}
║   🌐 访问地址: http://localhost:${PORT}  ║
║   📚 API文档: http://localhost:${PORT}/api/v1  ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
