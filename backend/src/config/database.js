const mysql = require('mysql2/promise');
require('dotenv').config();

// 创建MySQL连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// 测试连接
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL数据库连接成功');
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL数据库连接失败:', err.message);
  });

module.exports = pool;
