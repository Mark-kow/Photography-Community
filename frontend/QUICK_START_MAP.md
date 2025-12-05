# 🗺️ 高德地图快速配置指南

## 📋 30秒完成配置

### 第1步：申请 API Key（5分钟）

1. 访问：https://lbs.amap.com/
2. 注册/登录账号
3. 进入控制台 → 应用管理 → 我的应用 → 创建新应用
4. 添加 Key → 选择「Web端(JS API)」→ 提交
5. 复制生成的 Key

### 第2步：配置 Key（10秒）

```bash
cd ./frontend

# 创建 .env 文件
echo "VITE_AMAP_KEY=你的Key" > .env
```

或者直接编辑 `.env` 文件：

```env
VITE_AMAP_KEY=你申请到的Key
```

### 第3步：重启前端服务（如果正在运行）

```bash
# Ctrl+C 停止当前服务
# 然后重新启动
npm run dev
```

### 第4步：查看效果

1. 访问：http://localhost:5173/locations
2. 点击「📍 地图视图」Tab
3. 查看地图上的拍摄地标记点

## ✅ 验证是否成功

打开浏览器控制台（F12），如果看到：

- ✅ 没有 `Failed to load AMap` 错误
- ✅ 地图正常显示
- ✅ 能看到标记点

说明集成成功！

## ❌ 如果遇到问题

### 地图不显示？

1. 检查 `.env` 文件中的 Key 是否正确
2. 检查 Key 是否启用了「Web端(JS API)」服务
3. 打开浏览器控制台查看错误信息

### 显示 "INVALID_USER_KEY"？

Key 配置错误，请检查：
- Key 是否复制完整
- 是否选择了正确的服务平台（Web端 JS API）
- Key 是否已启用

## 🎉 完成！

现在你可以：
- 在地图上查看所有拍摄地
- 点击标记查看地点信息
- 点击地点跳转到详情页

详细文档请查看：`MAP_INTEGRATION.md`
