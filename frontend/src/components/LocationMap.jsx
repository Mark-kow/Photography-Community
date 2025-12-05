import { useEffect, useRef } from 'react';
import { Spin } from 'antd';
import MAP_CONFIG from '../config/map';

/**
 * 高德地图组件
 * @param {Array} locations - 地点列表
 * @param {Function} onMarkerClick - 标记点击回调
 * @param {Number} zoom - 缩放级别 (默认12)
 * @param {Array} center - 中心点 [lng, lat] (默认北京)
 */
function LocationMap({ locations = [], onMarkerClick, zoom = 12, center = [116.397428, 39.90923] }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // 加载高德地图 JS API
    const loadAMapScript = () => {
      return new Promise((resolve, reject) => {
        if (window.AMap) {
          resolve(window.AMap);
          return;
        }

        const script = document.createElement('script');
        script.type = 'text/javascript';
        // 使用配置文件中的 API Key
        const plugins = MAP_CONFIG.PLUGINS.join(',');
        script.src = `https://webapi.amap.com/maps?v=${MAP_CONFIG.VERSION}&key=${MAP_CONFIG.AMAP_KEY}&plugin=${plugins}`;
        script.onload = () => resolve(window.AMap);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const initMap = async () => {
      try {
        const AMap = await loadAMapScript();
        
        // 创建地图实例
        const map = new AMap.Map(mapContainerRef.current, {
          zoom: zoom,
          center: center,
          viewMode: '2D',
          showLabel: true,
          features: ['bg', 'road', 'building', 'point']
        });

        // 添加工具条和比例尺
        map.addControl(new AMap.Scale());
        map.addControl(new AMap.ToolBar({
          position: 'RB'
        }));

        mapRef.current = map;

        // 添加地点标记
        if (locations.length > 0) {
          addMarkers(map, locations);
        }
      } catch (error) {
        console.error('地图加载失败:', error);
      }
    };

    initMap();

    return () => {
      // 清理地图实例
      if (mapRef.current) {
        mapRef.current.destroy();
      }
    };
  }, []);

  // 当地点列表变化时更新标记
  useEffect(() => {
    if (mapRef.current && locations.length > 0) {
      // 清除旧标记
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      addMarkers(mapRef.current, locations);
    }
  }, [locations]);

  const addMarkers = (map, locations) => {
    const AMap = window.AMap;
    const bounds = [];

    locations.forEach(location => {
      if (!location.longitude || !location.latitude) return;

      const position = [parseFloat(location.longitude), parseFloat(location.latitude)];
      bounds.push(position);

      // 创建标记
      const marker = new AMap.Marker({
        position: position,
        title: location.name,
        label: {
          content: location.name,
          offset: new AMap.Pixel(0, -30),
          direction: 'top'
        }
      });

      // 创建信息窗体
      const infoWindow = new AMap.InfoWindow({
        isCustom: false,
        content: `
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 10px 0;">${location.name}</h3>
            <p style="margin: 5px 0; color: #666;">${location.city} · ${location.address}</p>
            <p style="margin: 5px 0;">${location.description || ''}</p>
            <div style="margin-top: 10px;">
              <span style="margin-right: 15px;">👤 ${location.checkin_count || 0} 次打卡</span>
              <span>📷 ${location.work_count || 0} 作品</span>
            </div>
          </div>
        `,
        offset: new AMap.Pixel(0, -30)
      });

      // 点击标记显示信息窗体
      marker.on('click', () => {
        infoWindow.open(map, marker.getPosition());
        if (onMarkerClick) {
          onMarkerClick(location);
        }
      });

      marker.setMap(map);
      markersRef.current.push(marker);
    });

    // 自动调整视野以显示所有标记
    if (bounds.length > 0) {
      map.setFitView();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '600px' }}>
      <div 
        ref={mapContainerRef} 
        style={{ width: '100%', height: '100%' }}
      />
      {!mapRef.current && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <Spin size="large" tip="地图加载中..." />
        </div>
      )}
    </div>
  );
}

export default LocationMap;
