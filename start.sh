#!/bin/bash

# ============================================
# 摄影社区项目快速启动脚本
# 版本: 2.0
# 更新日期: 2024-12-06
# ============================================

set -e  # 遇到错误立即退出

# 项目根目录（自动获取当前用户主目录）
PROJECT_ROOT="$HOME/www/app"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 打印欢迎信息
print_banner() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                   📸 摄影社区项目启动                       ║"
    echo "║                    Version 2.0 (MVP+)                      ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
}

# 检查环境依赖
check_dependencies() {
    log_info "检查系统环境依赖..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "未安装 Node.js，请先安装 Node.js >= 16.0.0"
        exit 1
    fi
    NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        log_error "Node.js 版本过低，当前版本: $(node -v)，需要 >= 16.0.0"
        exit 1
    fi
    log_success "Node.js 版本正常: $(node -v)"
    
    # 检查 MySQL
    log_info "检查 MySQL 服务..."
    if ! systemctl is-active --quiet mysql && ! systemctl is-active --quiet mysqld; then
        log_error "MySQL 服务未运行"
        log_info "尝试启动 MySQL..."
        sudo systemctl start mysql || sudo systemctl start mysqld || {
            log_error "无法启动 MySQL，请手动启动服务"
            exit 1
        }
    fi
    log_success "MySQL 服务正常运行"
    
    # 检查 Redis
    log_info "检查 Redis 服务..."
    if ! systemctl is-active --quiet redis && ! systemctl is-active --quiet redis-server; then
        log_error "Redis 服务未运行"
        log_info "尝试启动 Redis..."
        sudo systemctl start redis || sudo systemctl start redis-server || {
            log_error "无法启动 Redis，请手动启动服务"
            exit 1
        }
    fi
    
    # 测试 Redis 连接
    if ! redis-cli ping &> /dev/null; then
        log_error "Redis 连接失败"
        exit 1
    fi
    log_success "Redis 服务正常运行"
}

# 检查并创建必要的目录
check_directories() {
    log_info "检查项目目录结构..."
    
    # 创建日志目录
    mkdir -p "$BACKEND_DIR/logs"
    mkdir -p "$FRONTEND_DIR/logs"
    
    # 创建上传目录
    mkdir -p "$BACKEND_DIR/uploads"
    
    log_success "目录结构检查完成"
}

# 检查环境配置文件
check_env_files() {
    log_info "检查环境配置文件..."
    
    # 检查后端 .env 文件
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        log_warning "后端 .env 文件不存在，从 .env.example 复制"
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        log_warning "请修改 $BACKEND_DIR/.env 中的配置信息"
    fi
    
    # 检查关键配置
    if ! grep -q "QWEN_API_KEY" "$BACKEND_DIR/.env" || grep -q "your-api-key" "$BACKEND_DIR/.env"; then
        log_warning "未配置千问 API 密钥，AI 功能将无法使用"
    fi
    
    # 检查前端 .env 文件
    if [ ! -f "$FRONTEND_DIR/.env" ]; then
        log_warning "前端 .env 文件不存在，从 .env.example 复制"
        if [ -f "$FRONTEND_DIR/.env.example" ]; then
            cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
        fi
    fi
    
    log_success "环境配置文件检查完成"
}

# 检查依赖安装
check_node_modules() {
    log_info "检查项目依赖..."
    
    # 检查后端依赖
    if [ ! -d "$BACKEND_DIR/node_modules" ]; then
        log_warning "后端依赖未安装，开始安装..."
        cd "$BACKEND_DIR"
        npm install
        log_success "后端依赖安装完成"
    fi
    
    # 检查前端依赖
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        log_warning "前端依赖未安装，开始安装..."
        cd "$FRONTEND_DIR"
        npm install
        log_success "前端依赖安装完成"
    fi
}

# 初始化数据库
init_database() {
    log_info "检查数据库初始化状态..."
    
    # 从 .env 文件读取数据库配置
    source "$BACKEND_DIR/.env"
    
    # 检查数据库是否存在
    DB_EXISTS=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e "SHOW DATABASES LIKE '$DB_NAME';" 2>/dev/null | grep -c "$DB_NAME" || true)
    
    if [ "$DB_EXISTS" -eq 0 ]; then
        log_warning "数据库不存在，开始初始化..."
        cd "$BACKEND_DIR/database"
        chmod +x migrate.sh
        ./migrate.sh
        log_success "数据库初始化完成"
    else
        log_success "数据库已存在"
    fi
}

# 停止已运行的服务
stop_services() {
    log_info "停止旧的服务进程..."
    
    # 停止后端服务
    pkill -f "node.*server.js" 2>/dev/null || true
    
    # 停止前端服务（更精确的匹配）
    pkill -f "vite.*5173" 2>/dev/null || true
    
    sleep 1
    log_success "旧服务已停止"
}

# 启动后端服务
start_backend() {
    log_info "启动后端服务..."
    
    cd "$BACKEND_DIR"
    
    # 清空旧日志
    > logs/server.log
    
    # 启动服务
    nohup node src/server.js > logs/server.log 2>&1 &
    BACKEND_PID=$!
    
    # 等待启动
    sleep 3
    
    # 检查服务是否启动成功
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        log_success "后端服务启动成功 (PID: $BACKEND_PID)"
        log_info "  → API地址: http://localhost:3000"
        log_info "  → 健康检查: http://localhost:3000/health"
    else
        log_error "后端服务启动失败，查看日志: tail -f $BACKEND_DIR/logs/server.log"
        exit 1
    fi
}

# 启动前端服务
start_frontend() {
    log_info "启动前端服务..."
    
    cd "$FRONTEND_DIR"
    
    # 清空旧日志
    > logs/vite.log
    
    # 启动服务
    nohup npm run dev > logs/vite.log 2>&1 &
    FRONTEND_PID=$!
    
    # 等待启动
    sleep 5
    
    # 检查服务是否启动
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        log_success "前端服务启动成功 (PID: $FRONTEND_PID)"
        log_info "  → 访问地址: http://localhost:5173"
    else
        log_warning "前端服务可能需要更长时间启动，请稍后访问"
        log_info "  → 查看日志: tail -f $FRONTEND_DIR/logs/vite.log"
    fi
}

# 打印服务信息
print_summary() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                    ✅ 所有服务启动完成                      ║"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║                                                            ║"
    echo "║  🌐 前端服务:  http://localhost:5173                       ║"
    echo "║  📡 后端API:   http://localhost:3000                       ║"
    echo "║  💾 数据库:    MySQL (photograph_app)                      ║"
    echo "║  📦 缓存:      Redis (localhost:6379)                      ║"
    echo "║                                                            ║"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║  📚 核心功能模块                                            ║"
    echo "║  ✓ 用户系统 (注册/登录/个人主页)                            ║"
    echo "║  ✓ 作品系统 (发布/浏览/编辑)                                ║"
    echo "║  ✓ 社交系统 (关注/点赞/评论/收藏)                           ║"
    echo "║  ✓ 拍摄地系统 (地图集成/位置推荐)                           ║"
    echo "║  ✓ 课程学习 (教程/笔记/进度)                                ║"
    echo "║  ✓ 器材百科 (器材库/我的器材)                               ║"
    echo "║  ✓ 约拍活动 (活动发布/报名/管理)                            ║"
    echo "║  ✓ 挑战赛 (赛事/投票/排行)                                  ║"
    echo "║  ✓ AI功能 (智能标签/拍摄建议/器材推荐)                      ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📋 测试账号:"
    echo "   手机号: 13800138001  密码: 123456 (管理员)"
    echo "   手机号: 13800138002  密码: 123456 (编辑)"
    echo "   手机号: 13800138003  密码: 123456 (普通用户)"
    echo ""
    echo "📝 常用命令:"
    echo "   查看后端日志: tail -f $BACKEND_DIR/logs/server.log"
    echo "   查看前端日志: tail -f $FRONTEND_DIR/logs/vite.log"
    echo "   停止所有服务: pkill -f 'node.*server.js'; pkill -f 'vite'"
    echo ""
    echo "⚠️  重要提醒:"
    
    # 检查 AI 配置
    source "$BACKEND_DIR/.env"
    if [ -z "$QWEN_API_KEY" ] || [ "$QWEN_API_KEY" = "your-api-key" ]; then
        echo "   ❌ 未配置千问 API 密钥，AI 功能无法使用"
        echo "      请编辑 $BACKEND_DIR/.env 配置 QWEN_API_KEY"
        echo "      申请地址: https://dashscope.aliyun.com/"
    else
        echo "   ✅ 千问 API 已配置，AI 功能可用"
    fi
    
    # 检查高德地图配置
    if [ -f "$FRONTEND_DIR/.env" ]; then
        source "$FRONTEND_DIR/.env"
        if [ -z "$VITE_AMAP_KEY" ] || [ "$VITE_AMAP_KEY" = "YOUR_AMAP_KEY_HERE" ]; then
            echo "   ⚠️  未配置高德地图 API Key，地图功能可能受限"
            echo "      请编辑 $FRONTEND_DIR/.env 配置 VITE_AMAP_KEY"
        else
            echo "   ✅ 高德地图 API 已配置"
        fi
    fi
    
    echo ""
}

# ============================================
# 主流程
# ============================================

main() {
    print_banner
    check_dependencies
    check_directories
    check_env_files
    check_node_modules
    init_database
    stop_services
    start_backend
    start_frontend
    print_summary
}

# 执行主流程
main
