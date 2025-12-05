const redis = require('redis');
require('dotenv').config();

// 创建Redis客户端
const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  },
  password: process.env.REDIS_PASSWORD || undefined
});

// 错误处理
client.on('error', (err) => {
  console.error('❌ Redis连接错误:', err);
});

// 连接Redis
client.connect()
  .then(() => {
    console.log('✅ Redis连接成功');
  })
  .catch(err => {
    console.error('❌ Redis连接失败:', err.message);
  });

module.exports = client;
