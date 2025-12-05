# 摄影社区 - 拓展模块开发指南

> 本文档记录已完成的模块和后续开发指引

## ✅ 已完成模块

### 1. 拍摄地模块 (100%)
**数据库**: `backend/database/locations.sql`
- ✅ locations 表 - 地点信息
- ✅ location_checkins 表 - 打卡记录
- ✅ location_guides 表 - 拍摄攻略

**后端API**: `backend/src/controllers/locationController.js`
- ✅ 地点列表（支持筛选、排序、距离计算）
- ✅ 地点详情
- ✅ 地点打卡
- ✅ 用户打卡记录
- ✅ 创建拍摄攻略
- ✅ 查看攻略详情

**前端页面**:
- ✅ `Locations.jsx` - 地点列表页
- ✅ `LocationDetail.jsx` - 地点详情页
- ✅ 路由已配置
- ✅ 导航已添加

**访问路径**: `/locations`

---

### 2. 学习模块 (100%)
**数据库**: `backend/database/courses.sql`
- ✅ courses 表 - 课程信息
- ✅ course_chapters 表 - 课程章节
- ✅ course_progress 表 - 学习进度
- ✅ course_notes 表 - 学习笔记
- ✅ tips 表 - 技巧库

**后端API**: `backend/src/controllers/courseController.js`
- ✅ 课程列表
- ✅ 课程详情（含章节列表）
- ✅ 章节内容获取
- ✅ 完成章节（更新进度）
- ✅ 技巧库列表
- ✅ 技巧详情
- ✅ 我的学习记录

**前端页面**:
- ✅ `Courses.jsx` - 课程列表和技巧库
- ✅ 路由已配置
- ✅ 导航已添加

**访问路径**: `/courses`

---

### 3. 器材模块 (100%)
**数据库**: `backend/database/equipments.sql`
- ✅ cameras 表 - 相机数据
- ✅ lenses 表 - 镜头数据
- ✅ user_equipments 表 - 用户器材库
- ✅ equipment_market 表 - 二手市场

**后端API**: `backend/src/controllers/equipmentController.js`
- ✅ 相机列表（支持筛选、排序）
- ✅ 相机详情
- ✅ 镜头列表（支持筛选、排序）
- ✅ 镜头详情
- ✅ 添加到用户器材库
- ✅ 获取用户器材库
- ✅ 删除用户器材
- ✅ 二手市场列表
- ✅ 发布二手商品
- ✅ 更新商品状态

**前端页面**:
- ✅ `Equipments.jsx` - 器材列表页
- ✅ `EquipmentDetail.jsx` - 器材详情页
- ✅ 路由已配置
- ✅ 导航已添加

**访问路径**: `/equipments`

---

### 4. 约拍模块 (100%)
**数据库**: `backend/database/activities.sql`
- ✅ activities 表 - 活动信息
- ✅ activity_participants 表 - 参与者
- ✅ mentors 表 - 导师
- ✅ mentor_students 表 - 师徒关系

**后端API**: `backend/src/controllers/activityController.js`
- ✅ 活动列表（支持筛选、排序）
- ✅ 活动详情
- ✅ 创建活动
- ✅ 更新活动
- ✅ 报名参加
- ✅ 取消报名
- ✅ 获取我的活动

**前端页面**:
- ✅ `Activities.jsx` - 活动列表页
- ✅ `ActivityDetail.jsx` - 活动详情页
- ✅ 路由已配置
- ✅ 导航已添加

**访问路径**: `/activities`

---

### 5. 挑战赛模块 (100%)
**数据库**: `backend/database/challenges.sql`
- ✅ challenges 表 - 挑战赛
- ✅ challenge_works 表 - 参赛作品
- ✅ challenge_votes 表 - 投票记录

**后端API**: `backend/src/controllers/challengeController.js`
- ✅ 挑战赛列表（支持筛选、排序）
- ✅ 挑战赛详情
- ✅ 提交作品参赛
- ✅ 投票
- ✅ 取消投票
- ✅ 获取挑战赛作品列表
- ✅ 获取我的挑战赛

**前端页面**:
- ✅ `Challenges.jsx` - 挑战赛列表页
- ✅ `ChallengeDetail.jsx` - 挑战赛详情页
- ✅ 路由已配置
- ✅ 导航已添加

**访问路径**: `/challenges`

---

## 🚀 快速开始

### 1. 初始化数据库

```bash
cd backend/database

# 方式1: 使用迁移脚本（推荐）
chmod +x migrate.sh
./migrate.sh

# 方式2: 手动执行
mysql -u root -p < init.sql
mysql -u root -p < locations.sql
mysql -u root -p < courses.sql
mysql -u root -p < equipments.sql
mysql -u root -p < activities.sql
mysql -u root -p < challenges.sql
```

### 2. 启动服务

**后端**:
```bash
cd backend
npm install
npm run dev
```

**前端**:
```bash
cd frontend
npm install
npm run dev
```

### 3. 访问应用
- 前端: http://localhost:5173
- 后端: http://localhost:3000

---

## 📝 开发规范

### Controller 开发模板

参考 `locationController.js` 或 `courseController.js`：

```javascript
const db = require('../config/database');

// 获取列表
exports.getList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    // ... 实现代码
    res.json({ code: 200, message: 'success', data });
  } catch (error) {
    res.status(500).json({ code: 50000, message: '错误信息' });
  }
};
```

### 路由注册流程

1. 创建 `backend/src/routes/xxx.js`
2. 在 `backend/src/server.js` 中导入并注册：
   ```javascript
   const xxxRoutes = require('./routes/xxx');
   app.use('/api/v1/xxx', xxxRoutes);
   ```

### 前端页面开发流程

1. 创建页面组件 `frontend/src/pages/Xxx.jsx`
2. 创建样式文件 `frontend/src/pages/Xxx.css`
3. 在 `App.jsx` 中添加路由
4. 在 `Layout.jsx` 中添加导航入口

---

## 📊 数据库概览

### 核心模块（MVP已完成）
- users - 用户表
- works - 作品表
- comments - 评论表
- follows - 关注表
- likes - 点赞表
- collections - 收藏表

### 拓展模块
**拍摄地**: 3张表
**学习**: 5张表
**器材**: 4张表
**约拍**: 4张表
**挑战赛**: 3张表

**总计**: 25张表

---

## 🎯 后续开发优先级

### 优先级1: 二手市场功能完善
添加二手器材市场的完整页面和交互

### 优先级2: 活动创建功能
完善活动创建表单和流程

### 优先级3: 挑战赛管理功能
添加挑战赛创建、管理和评分系统

---

## 📁 项目结构

```
backend/
├── database/
│   ├── init.sql (基础表)
│   ├── locations.sql (拍摄地)
│   ├── courses.sql (学习)
│   ├── equipments.sql (器材)
│   ├── activities.sql (约拍)
│   ├── challenges.sql (挑战赛)
│   └── migrate.sh (迁移脚本)
├── src/
│   ├── controllers/
│   │   ├── locationController.js ✅
│   │   ├── courseController.js ✅
│   │   ├── equipmentController.js ✅
│   │   ├── activityController.js ✅
│   │   └── challengeController.js ✅
│   ├── routes/
│   │   ├── locations.js ✅
│   │   ├── courses.js ✅
│   │   ├── equipments.js ✅
│   │   ├── activities.js ✅
│   │   └── challenges.js ✅
│   └── server.js

frontend/
└── src/
    └── pages/
        ├── Locations.jsx ✅
        ├── LocationDetail.jsx ✅
        ├── Courses.jsx ✅
        ├── CourseDetail.jsx ✅
        ├── Equipments.jsx ✅
        ├── EquipmentDetail.jsx ✅
        ├── Activities.jsx ✅
        ├── ActivityDetail.jsx ✅
        ├── Challenges.jsx ✅
        └── ChallengeDetail.jsx ✅
```

---

## 🔧 开发工具

### API测试
推荐使用 Postman 或 VS Code REST Client 扩展

### 数据库管理
推荐使用 MySQL Workbench 或 Navicat

---

## 📚 参考文档

- 项目需求书: `photography_requirements_v2.md`
- MVP总结: `PROJECT_SUMMARY.md`
- 部署文档: `DEPLOYMENT.md`
- 推荐算法: `backend/RECOMMENDATION_ALGORITHM.md`

---

## ⚠️ 注意事项

1. **数据库字段**: JSON字段在查询时需注意MySQL驱动的双重解析问题
2. **认证中间件**: 需要登录的接口记得使用 `authenticate` 中间件
3. **错误处理**: 统一使用 try-catch 并返回规范的JSON格式
4. **测试数据**: 所有SQL文件都包含测试数据，可直接使用

---

最后更新: 2024-12-05
