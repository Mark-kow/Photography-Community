import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Select, Tag, Button, message, Spin, Avatar } from 'antd';
import { DollarOutlined, EyeOutlined, PlusOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useUserStore } from '../store';
import api from '../utils/api';
import './MarketPlace.css';

function MarketPlace() {
  const navigate = useNavigate();
  const { accessToken } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [equipmentType, setEquipmentType] = useState('');
  const [conditionLevel, setConditionLevel] = useState('');

  useEffect(() => {
    fetchMarketItems();
  }, [equipmentType, conditionLevel]);

  const fetchMarketItems = async () => {
    try {
      setLoading(true);
      const params = {
        equipmentType: equipmentType || undefined,
        conditionLevel: conditionLevel || undefined
      };
      const response = await api.get('/equipments/market', { params });
      setItems(response.data.items || []);
    } catch (error) {
      message.error('获取二手市场列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getConditionText = (level) => {
    const levelMap = {
      excellent: '99新',
      good: '95新',
      fair: '9成新',
      used: '8成新'
    };
    return levelMap[level] || level;
  };

  const getConditionColor = (level) => {
    const colorMap = {
      excellent: 'green',
      good: 'blue',
      fair: 'orange',
      used: 'default'
    };
    return colorMap[level] || 'default';
  };

  const renderMarketCard = (item) => {
    const images = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
    const firstImage = Array.isArray(images) && images.length > 0 
      ? images[0] 
      : `https://picsum.photos/400/300?random=${item.id}`;

    return (
      <Card
        key={item.id}
        hoverable
        className="market-card"
        cover={
          <div className="market-cover">
            <img alt={item.title} src={firstImage} />
            <div className="market-overlay">
              <Tag color={getConditionColor(item.condition_level)}>
                {getConditionText(item.condition_level)}
              </Tag>
            </div>
          </div>
        }
        onClick={() => navigate(`/market/${item.id}`)}
      >
        <Card.Meta
          avatar={<Avatar src={item.avatar}>{item.nickname?.[0]}</Avatar>}
          title={
            <div className="market-title">
              <span className="title-text">{item.title}</span>
            </div>
          }
          description={
            <div className="market-info">
              <div className="market-description">
                {item.description || '暂无描述'}
              </div>
              
              <div className="market-meta">
                {item.shutter_count && (
                  <div className="meta-item">
                    <span>快门: {item.shutter_count.toLocaleString()}</span>
                  </div>
                )}
                {item.location && (
                  <div className="meta-item">
                    <span>📍 {item.location}</span>
                  </div>
                )}
              </div>

              <div className="market-footer">
                <div className="market-price">
                  <DollarOutlined />
                  <span className="price-amount">¥{parseFloat(item.price).toLocaleString()}</span>
                  {item.original_price && (
                    <span className="original-price">原价: ¥{parseFloat(item.original_price).toLocaleString()}</span>
                  )}
                </div>
                <div className="market-stats">
                  <span><EyeOutlined /> {item.view_count || 0}</span>
                </div>
              </div>
            </div>
          }
        />
      </Card>
    );
  };

  return (
    <div className="marketplace-container">
      <div className="marketplace-header">
        <div>
          <h1><ShoppingOutlined /> 二手市场</h1>
          <p>买卖二手摄影器材，让闲置器材物尽其用</p>
        </div>
        {accessToken && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/market/create')}
          >
            发布商品
          </Button>
        )}
      </div>

      <div className="marketplace-filters">
        <div className="filter-group">
          <Select
            placeholder="器材类型"
            style={{ width: 150 }}
            allowClear
            value={equipmentType || undefined}
            onChange={setEquipmentType}
          >
            <Select.Option value="camera">相机</Select.Option>
            <Select.Option value="lens">镜头</Select.Option>
            <Select.Option value="other">其他</Select.Option>
          </Select>

          <Select
            placeholder="成色"
            style={{ width: 150 }}
            allowClear
            value={conditionLevel || undefined}
            onChange={setConditionLevel}
          >
            <Select.Option value="excellent">99新</Select.Option>
            <Select.Option value="good">95新</Select.Option>
            <Select.Option value="fair">9成新</Select.Option>
            <Select.Option value="used">8成新</Select.Option>
          </Select>
        </div>
      </div>

      <div className="market-list">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : (
          <div className="market-grid">
            {items.map(renderMarketCard)}
          </div>
        )}
      </div>
    </div>
  );
}

export default MarketPlace;
