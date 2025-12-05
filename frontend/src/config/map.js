/**
 * 地图配置文件
 * 
 * 高德地图 API Key 申请步骤：
 * 1. 访问高德开放平台：https://lbs.amap.com/
 * 2. 注册并登录账号
 * 3. 进入控制台 -> 应用管理 -> 我的应用
 * 4. 创建新应用，添加 Key
 * 5. 选择 "Web端(JS API)" 类型
 * 6. 将生成的 Key 复制到下方 AMAP_KEY 配置中
 * 
 * 注意：
 * - 开发环境可以不设置安全密钥
 * - 生产环境建议配置域名白名单和 JS API 安全密钥
 */

export const MAP_CONFIG = {
  // 高德地图 Web 端 API Key
  // 优先使用环境变量，如果未设置则使用默认值
  // 请在 .env 文件中设置 VITE_AMAP_KEY=你的Key
  AMAP_KEY: import.meta.env.VITE_AMAP_KEY || 'YOUR_AMAP_KEY_HERE',
  
  // API 版本
  VERSION: '2.0',
  
  // 需要加载的插件
  PLUGINS: [
    'AMap.Scale',         // 比例尺
    'AMap.ToolBar',       // 工具条
    'AMap.InfoWindow',    // 信息窗体
    'AMap.Marker',        // 点标记
    'AMap.Geolocation'    // 定位
  ],
  
  // 默认中心点（北京天安门）
  DEFAULT_CENTER: [116.397428, 39.90923],
  
  // 默认缩放级别
  DEFAULT_ZOOM: 12,
  
  // 地图样式
  MAP_STYLE: 'amap://styles/normal'  // normal: 标准, dark: 深色, light: 浅色
};

export default MAP_CONFIG;
