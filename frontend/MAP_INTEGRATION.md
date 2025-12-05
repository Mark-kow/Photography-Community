# 高德地图集成说明

## 📍 功能概述

拍摄地模块已集成高德地图 JS API 2.0，实现以下功能：

- ✅ 地图视图展示所有拍摄地点
- ✅ 自定义标记点（Marker）显示地点位置
- ✅ 点击标记显示信息窗体（InfoWindow）
- ✅ 自动调整视野显示所有标记
- ✅ 工具条和比例尺控件
- ✅ 点击标记跳转到地点详情页

## 🔑 API Key 申请步骤

### 1. 注册高德开放平台账号

访问 [高德开放平台](https://lbs.amap.com/) 并注册账号。

### 2. 创建应用

1. 登录后进入 [控制台](https://console.amap.com/dev/index)
2. 点击「应用管理」→「我的应用」→「创建新应用」
3. 填写应用名称（如：摄影社区）和应用类型（选择「其他」）

### 3. 添加 Key

1. 在应用下点击「添加」
2. **服务平台**：选择「Web端(JS API)」
3. **Key名称**：填写描述性名称（如：摄影社区-前端）
4. 点击「提交」生成 Key

### 4. 配置 Key

将生成的 Key 配置到项目中：

**方法一：环境变量（推荐）**

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件
VITE_AMAP_KEY=你申请到的Key
```

**方法二：直接修改配置文件**

编辑 `src/config/map.js`：

```javascript
export const MAP_CONFIG = {
  AMAP_KEY: '你申请到的Key',
  // ...
};
```

## 📦 项目结构

```
frontend/
├── src/
│   ├── components/
│   │   └── LocationMap.jsx          # 地图组件
│   ├── config/
│   │   └── map.js                   # 地图配置
│   └── pages/
│       ├── Locations.jsx            # 拍摄地列表页（含地图视图）
│       └── Locations.css            # 样式
├── .env.example                     # 环境变量示例
└── MAP_INTEGRATION.md              # 本文档
```

## 🚀 使用方式

### 在 Locations 页面使用

地图视图已集成到拍摄地列表页面的 Tab 中：

```jsx
import LocationMap from '../components/LocationMap';

<LocationMap 
  locations={locations}
  onMarkerClick={(location) => {
    navigate(`/location/${location.id}`);
  }}
/>
```

### 组件 Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| locations | Array | [] | 地点列表数据 |
| onMarkerClick | Function | - | 标记点击回调 |
| zoom | Number | 12 | 初始缩放级别 |
| center | Array | [116.397428, 39.90923] | 初始中心点 [经度, 纬度] |

### 地点数据格式

```javascript
{
  id: 1,
  name: '故宫博物院',
  longitude: 116.397428,
  latitude: 39.90923,
  city: '北京',
  address: '北京市东城区景山前街4号',
  description: '...',
  checkin_count: 1000,
  work_count: 500
}
```

## ⚙️ 配置说明

### 地图配置项

编辑 `src/config/map.js` 可自定义：

```javascript
export const MAP_CONFIG = {
  // API Key
  AMAP_KEY: import.meta.env.VITE_AMAP_KEY,
  
  // API 版本
  VERSION: '2.0',
  
  // 插件列表
  PLUGINS: [
    'AMap.Scale',         // 比例尺
    'AMap.ToolBar',       // 工具条
    'AMap.InfoWindow',    // 信息窗体
    'AMap.Marker',        // 点标记
    'AMap.Geolocation'    // 定位
  ],
  
  // 默认中心点（北京）
  DEFAULT_CENTER: [116.397428, 39.90923],
  
  // 默认缩放级别（3-18）
  DEFAULT_ZOOM: 12,
  
  // 地图样式
  MAP_STYLE: 'amap://styles/normal'
};
```

### 地图样式选项

- `amap://styles/normal` - 标准样式
- `amap://styles/dark` - 深色样式
- `amap://styles/light` - 浅色样式
- `amap://styles/whitesmoke` - 月光银
- `amap://styles/fresh` - 草色青

## 🎨 自定义样式

### 信息窗体样式

在 `Locations.css` 中已添加样式优化：

```css
.amap-info-content {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
}

.amap-marker-label {
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid #1890ff;
  border-radius: 4px;
  padding: 4px 8px;
  color: #1890ff;
}
```

## 🔧 开发调试

### 本地测试

1. 确保后端服务运行在 `http://localhost:3000`
2. 启动前端开发服务器：

```bash
cd frontend
npm run dev
```

3. 访问 `http://localhost:5173/locations`
4. 切换到「📍 地图视图」Tab

### 常见问题

**1. 地图显示空白？**

- 检查 API Key 是否正确配置
- 打开浏览器控制台查看错误信息
- 确认高德地图 JS API 已成功加载

**2. 标记点不显示？**

- 检查地点数据中的 `longitude` 和 `latitude` 字段
- 确保经纬度格式正确（数字类型）

**3. CORS 错误？**

- 高德地图 API 使用 JSONP 方式加载，不存在跨域问题
- 如遇到跨域，检查是否是 API 请求的问题

## 📚 API 文档

- [高德地图 JS API 2.0 文档](https://lbs.amap.com/api/javascript-api-v2/summary)
- [点标记（Marker）](https://lbs.amap.com/api/javascript-api-v2/documentation#marker)
- [信息窗体（InfoWindow）](https://lbs.amap.com/api/javascript-api-v2/documentation#infowindow)

## 🔐 安全建议

### 开发环境

- 可以不设置安全密钥
- API Key 可以直接配置在代码中

### 生产环境

1. **设置域名白名单**
   - 进入控制台 → 应用管理 → 选择 Key
   - 配置「域名白名单」，只允许指定域名调用

2. **启用 JS API 安全密钥**
   - 在控制台中设置安全密钥
   - 前端代码中配置 `securityJsCode`

3. **使用环境变量**
   - 不要将 API Key 提交到 Git
   - 使用 `.env` 文件管理密钥
   - 确保 `.env` 在 `.gitignore` 中

## 🚧 后续扩展

可以继续添加以下功能：

- [ ] 用户定位（获取当前位置）
- [ ] 路线规划（导航到拍摄地）
- [ ] 热力图（显示热门拍摄地）
- [ ] 聚合点（大量标记点时聚合显示）
- [ ] 地点搜索（输入框搜索地点）
- [ ] 附近拍摄地（基于当前位置推荐）

## 📝 更新日志

### v1.0.0 (2025-12-04)

- ✅ 集成高德地图 JS API 2.0
- ✅ 实现地图视图功能
- ✅ 支持标记点显示和交互
- ✅ 自动调整视野
- ✅ 信息窗体展示
