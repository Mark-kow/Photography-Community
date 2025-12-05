#!/bin/bash

# 摄影社区数据库初始化脚本
# 用于一次性创建所有数据库表和测试数据

echo "开始初始化摄影社区数据库..."

# 从后端 .env 加载环境变量（.env 已在 .gitignore 中，不会提交）
ENV_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)/.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  . "$ENV_FILE"
  set +a
fi

# 数据库配置
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}

# 执行SQL文件
execute_sql() {
  local sql_file=$1
  echo "执行: $sql_file"
  
  if [ -n "$DB_PASSWORD" ]; then
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" < "$sql_file"
  else
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" < "$sql_file"
  fi
  
  if [ $? -eq 0 ]; then
    echo "✓ $sql_file 执行成功"
  else
    echo "✗ $sql_file 执行失败"
    exit 1
  fi
}

# 切换到数据库目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 按顺序执行SQL文件
echo ""
echo "1. 初始化基础表结构（用户、作品、评论等）..."
execute_sql "init.sql"

echo ""
echo "2. 初始化拍摄地模块..."
execute_sql "locations.sql"

echo ""
echo "3. 初始化学习模块..."
execute_sql "courses.sql"

echo ""
echo "4. 初始化器材模块..."
execute_sql "equipments.sql"

echo ""
echo "5. 初始化约拍模块..."
execute_sql "activities.sql"

echo ""
echo "6. 初始化挑战赛模块..."
execute_sql "challenges.sql"

echo ""
echo "========================================="
echo "✓ 数据库初始化完成！"
echo "========================================="
echo ""
echo "已创建的模块:"
echo "  ✓ 核心模块 (用户、作品、社交)"
echo "  ✓ 拍摄地模块"
echo "  ✓ 学习模块"
echo "  ✓ 器材模块"
echo "  ✓ 约拍模块"
echo "  ✓ 挑战赛模块"
echo ""
echo "测试数据已插入，可以开始使用了！"
echo ""
