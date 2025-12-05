import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tabs, Select, Input, Tag, Rate, message, Spin } from 'antd';
import { EnvironmentOutlined, CameraOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../utils/api';
import LocationMap from '../components/LocationMap';
import './Locations.css';

const { Search } = Input;

function Locations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [activeTab, setActiveTab] = useState('list');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [sortBy, setSortBy] = useState('checkin_count');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    fetchLocations();
  }, [category, city, sortBy]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const params = {
        category: category || undefined,
        city: city || undefined,
        sortBy
      };
      const response = await api.get('/locations', { params });
      setLocations(response.data.list);
    } catch (error) {
      message.error('获取地点列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchKeyword(value);
    // 实现搜索逻辑
  };

  const getBestTimeText = (bestTime) => {
    const timeMap = {
      sunrise: '日出',
      sunset: '日落',
      night: '夜景',
      star: '星空'
    };
    if (!bestTime) return '';
    return bestTime.split(',').map(t => timeMap[t] || t).join('、');
  };

  const getCategoryText = (cat) => {
    const categoryMap = {
      natural: '自然风光',
      architecture: '古建筑',
      modern: '现代建筑',
      park: '公园'
    };
    return categoryMap[cat] || cat;
  };

  const renderLocationCard = (location) => (
    <Card
      key={location.id}
      hoverable
      className="location-card"
      cover={
        <div className="location-cover">
          <img alt={location.name} src={location.cover_image} />
          <div className="location-overlay">
            <Tag color="blue">{getCategoryText(location.category)}</Tag>
            {location.best_time && (
              <Tag color="orange">{getBestTimeText(location.best_time)}</Tag>
            )}
          </div>
        </div>
      }
      onClick={() => navigate(`/location/${location.id}`)}
    >
      <Card.Meta
        title={
          <div className="location-title">
            <span>{location.name}</span>
            <Rate disabled value={location.rating || 0} style={{ fontSize: 14 }} />
          </div>
        }
        description={
          <div className="location-info">
            <div className="location-address">
              <EnvironmentOutlined /> {location.city} · {location.address}
            </div>
            <div className="location-description">{location.description}</div>
            <div className="location-stats">
              <span>
                <UserOutlined /> {location.checkin_count || 0} 次打卡
              </span>
              <span>
                <CameraOutlined /> {location.work_count || 0} 作品
              </span>
            </div>
          </div>
        }
      />
    </Card>
  );

  const tabItems = [
    {
      key: 'list',
      label: '列表视图',
      children: (
        <div className="location-list">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : (
            <div className="location-grid">
              {locations.map(renderLocationCard)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'map',
      label: '📍 地图视图',
      children: (
        <div className="location-map">
          <LocationMap 
            locations={locations}
            onMarkerClick={(location) => {
              navigate(`/location/${location.id}`);
            }}
          />
        </div>
      )
    }
  ];

  return (
    <div className="locations-container">
      <div className="locations-header">
        <h1>📍 拍摄地发现</h1>
        <p>探索全球优质拍摄地点，获取专业拍摄建议</p>
      </div>

      <div className="locations-filters">
        <Search
          placeholder="搜索地点名称或地址"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          style={{ maxWidth: 400 }}
        />

        <div className="filter-group">
          <Select
            placeholder="选择分类"
            style={{ width: 150 }}
            allowClear
            value={category || undefined}
            onChange={setCategory}
          >
            <Select.Option value="natural">自然风光</Select.Option>
            <Select.Option value="architecture">古建筑</Select.Option>
            <Select.Option value="modern">现代建筑</Select.Option>
            <Select.Option value="park">公园</Select.Option>
          </Select>

          <Select
            placeholder="选择城市"
            style={{ width: 150 }}
            allowClear
            value={city || undefined}
            onChange={setCity}
          >
            <Select.Option value="北京">北京</Select.Option>
            <Select.Option value="上海">上海</Select.Option>
            <Select.Option value="杭州">杭州</Select.Option>
            <Select.Option value="黄山">黄山</Select.Option>
          </Select>

          <Select
            placeholder="排序方式"
            style={{ width: 150 }}
            value={sortBy}
            onChange={setSortBy}
          >
            <Select.Option value="checkin_count">热度排序</Select.Option>
            <Select.Option value="rating">评分排序</Select.Option>
            <Select.Option value="created_at">最新添加</Select.Option>
          </Select>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        items={tabItems}
        onChange={setActiveTab}
        className="locations-tabs"
      />
    </div>
  );
}

export default Locations;
