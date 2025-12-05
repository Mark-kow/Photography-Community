import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tabs, Select, Tag, Button, message, Spin } from 'antd';
import { CameraOutlined, DollarOutlined, StarOutlined } from '@ant-design/icons';
import api from '../utils/api';
import './Equipments.css';

function Equipments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [lenses, setLenses] = useState([]);
  const [activeTab, setActiveTab] = useState('cameras');
  const [brand, setBrand] = useState('');
  const [sensorType, setSensorType] = useState('');
  const [sortBy, setSortBy] = useState('price');

  useEffect(() => {
    if (activeTab === 'cameras') {
      fetchCameras();
    } else if (activeTab === 'lenses') {
      fetchLenses();
    }
  }, [activeTab, brand, sensorType, sortBy]);

  const fetchCameras = async () => {
    try {
      setLoading(true);
      const params = {
        brand: brand || undefined,
        sensor_type: sensorType || undefined,
        sortBy
      };
      const response = await api.get('/equipments/cameras', { params });
      setCameras(response.data.items || []);
    } catch (error) {
      message.error('获取相机列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchLenses = async () => {
    try {
      setLoading(true);
      const params = {
        brand: brand || undefined,
        sortBy
      };
      const response = await api.get('/equipments/lenses', { params });
      setLenses(response.data.items || []);
    } catch (error) {
      message.error('获取镜头列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getSensorTypeText = (type) => {
    const typeMap = {
      'full-frame': '全画幅',
      'aps-c': 'APS-C',
      'm43': 'M4/3'
    };
    return typeMap[type] || type;
  };

  const renderCameraCard = (camera) => (
    <Card
      key={camera.id}
      hoverable
      className="equipment-card"
      cover={
        <div className="equipment-cover">
          <img alt={camera.model} src={camera.cover_image || 'https://picsum.photos/400/300?random=' + camera.id} />
        </div>
      }
      onClick={() => navigate(`/equipment/camera/${camera.id}`)}
    >
      <Card.Meta
        title={
          <div className="equipment-title">
            <span>{camera.brand} {camera.model}</span>
          </div>
        }
        description={
          <div className="equipment-info">
            <div className="equipment-specs">
              {camera.sensor_type && (
                <Tag color="blue">{getSensorTypeText(camera.sensor_type)}</Tag>
              )}
              {camera.megapixels && (
                <Tag>{camera.megapixels}MP</Tag>
              )}
            </div>
            <div className="equipment-features">
              {camera.iso_range && <div>ISO: {camera.iso_range}</div>}
              {camera.video_capability && <div>视频: {camera.video_capability}</div>}
            </div>
            <div className="equipment-price">
              <DollarOutlined /> ¥{parseFloat(camera.price).toLocaleString()}
            </div>
          </div>
        }
      />
    </Card>
  );

  const renderLensCard = (lens) => (
    <Card
      key={lens.id}
      hoverable
      className="equipment-card"
      cover={
        <div className="equipment-cover">
          <img alt={lens.model} src={lens.cover_image || 'https://picsum.photos/400/300?random=' + (lens.id + 100)} />
        </div>
      }
      onClick={() => navigate(`/equipment/lens/${lens.id}`)}
    >
      <Card.Meta
        title={
          <div className="equipment-title">
            <span>{lens.brand} {lens.model}</span>
          </div>
        }
        description={
          <div className="equipment-info">
            <div className="equipment-specs">
              {lens.focal_length && (
                <Tag color="purple">{lens.focal_length}</Tag>
              )}
              {lens.max_aperture && (
                <Tag>f/{lens.max_aperture}</Tag>
              )}
            </div>
            <div className="equipment-features">
              {lens.mount && <div>卡口: {lens.mount}</div>}
              {lens.lens_type && <div>类型: {lens.lens_type}</div>}
            </div>
            <div className="equipment-price">
              <DollarOutlined /> ¥{parseFloat(lens.price).toLocaleString()}
            </div>
          </div>
        }
      />
    </Card>
  );

  const tabItems = [
    {
      key: 'cameras',
      label: '📷 相机',
      children: (
        <div className="equipment-list">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : (
            <div className="equipment-grid">
              {cameras.map(renderCameraCard)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'lenses',
      label: '🔭 镜头',
      children: (
        <div className="equipment-list">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : (
            <div className="equipment-grid">
              {lenses.map(renderLensCard)}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="equipments-container">
      <div className="equipments-header">
        <h1>📸 器材库</h1>
        <p>探索专业摄影器材，找到最适合你的设备</p>
      </div>

      <div className="equipments-filters">
        <div className="filter-group">
          <Select
            placeholder="选择品牌"
            style={{ width: 150 }}
            allowClear
            value={brand || undefined}
            onChange={setBrand}
          >
            <Select.Option value="Canon">佳能 Canon</Select.Option>
            <Select.Option value="Nikon">尼康 Nikon</Select.Option>
            <Select.Option value="Sony">索尼 Sony</Select.Option>
            <Select.Option value="Fujifilm">富士 Fujifilm</Select.Option>
            <Select.Option value="Panasonic">松下 Panasonic</Select.Option>
          </Select>

          {activeTab === 'cameras' && (
            <Select
              placeholder="传感器类型"
              style={{ width: 150 }}
              allowClear
              value={sensorType || undefined}
              onChange={setSensorType}
            >
              <Select.Option value="full-frame">全画幅</Select.Option>
              <Select.Option value="aps-c">APS-C</Select.Option>
              <Select.Option value="m43">M4/3</Select.Option>
            </Select>
          )}

          <Select
            placeholder="排序方式"
            style={{ width: 150 }}
            value={sortBy}
            onChange={setSortBy}
          >
            <Select.Option value="price">价格排序</Select.Option>
            <Select.Option value="popularity">热度排序</Select.Option>
            <Select.Option value="rating">评分排序</Select.Option>
          </Select>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        items={tabItems}
        onChange={setActiveTab}
        className="equipments-tabs"
      />
    </div>
  );
}

export default Equipments;
