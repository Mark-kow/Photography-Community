import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Tag, Descriptions, Divider, message, Spin, Tabs } from 'antd';
import { 
  CameraOutlined, DollarOutlined, StarOutlined, 
  HeartOutlined, ShoppingCartOutlined, ArrowLeftOutlined 
} from '@ant-design/icons';
import { useUserStore } from '../store';
import api from '../utils/api';
import './EquipmentDetail.css';

function EquipmentDetail() {
  const { type, id } = useParams(); // type: 'camera' or 'lens'
  const navigate = useNavigate();
  const { accessToken } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [equipment, setEquipment] = useState(null);

  useEffect(() => {
    fetchEquipmentDetail();
  }, [type, id]);

  const fetchEquipmentDetail = async () => {
    try {
      setLoading(true);
      const endpoint = type === 'camera' ? 'cameras' : 'lenses';
      const response = await api.get(`/equipments/${endpoint}/${id}`);
      setEquipment(response.data);
    } catch (error) {
      console.error('获取器材详情失败:', error);
      message.error('获取器材详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToMyEquipments = async () => {
    if (!accessToken) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    try {
      await api.post('/equipments/user/add', {
        equipmentType: type,
        equipmentId: id
      });
      message.success('已添加到我的器材库');
    } catch (error) {
      message.error(error.response?.data?.message || '添加失败');
    }
  };

  const getSensorTypeText = (sensorType) => {
    const typeMap = {
      'full-frame': '全画幅',
      'aps-c': 'APS-C',
      'm43': 'M4/3'
    };
    return typeMap[sensorType] || sensorType;
  };

  if (loading || !equipment) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  const isCameraType = type === 'camera';

  const cameraItems = [
    { key: '1', label: '品牌', children: equipment.brand },
    { key: '2', label: '型号', children: equipment.model },
    { key: '3', label: '传感器类型', children: equipment.sensor_type ? getSensorTypeText(equipment.sensor_type) : '-' },
    { key: '4', label: '像素', children: equipment.megapixels ? `${equipment.megapixels} MP` : '-' },
    { key: '5', label: 'ISO范围', children: equipment.iso_range || '-' },
    { key: '6', label: '对焦点数', children: equipment.focus_points ? `${equipment.focus_points}点` : '-' },
    { key: '7', label: '连拍速度', children: equipment.continuous_shooting ? `${equipment.continuous_shooting} fps` : '-' },
    { key: '8', label: '视频规格', children: equipment.video_spec || '-' },
    { key: '9', label: '重量', children: equipment.weight ? `${equipment.weight}g` : '-' },
    { key: '10', label: '价格', children: equipment.price ? `¥${parseFloat(equipment.price).toLocaleString()}` : '-' },
  ];

  const getLensTypeText = (type) => {
    const typeMap = {
      'prime': '定焦',
      'zoom': '变焦'
    };
    return typeMap[type] || type;
  };

  const lensItems = [
    { key: '1', label: '品牌', children: equipment.brand },
    { key: '2', label: '型号', children: equipment.model },
    { key: '3', label: '焦距', children: equipment.focal_length || '-' },
    { key: '4', label: '最大光圈', children: equipment.max_aperture ? `f/${equipment.max_aperture}` : '-' },
    { key: '5', label: '卡口', children: equipment.mount || '-' },
    { key: '6', label: '类型', children: equipment.lens_type ? getLensTypeText(equipment.lens_type) : '-' },
    { key: '7', label: '防抖', children: equipment.image_stabilization ? '支持' : '不支持' },
    { key: '8', label: '自动对焦', children: equipment.autofocus ? '支持' : '不支持' },
    { key: '9', label: '滤镜口径', children: equipment.filter_diameter ? `${equipment.filter_diameter}mm` : '-' },
    { key: '10', label: '重量', children: equipment.weight ? `${equipment.weight}g` : '-' },
    { key: '11', label: '价格', children: equipment.price ? `¥${parseFloat(equipment.price).toLocaleString()}` : '-' },
  ];

  const tabItems = [
    {
      key: 'specs',
      label: '规格参数',
      children: (
        <div className="specs-section">
          <Descriptions
            bordered
            column={1}
            items={isCameraType ? cameraItems : lensItems}
          />
        </div>
      )
    },
    {
      key: 'description',
      label: '详细介绍',
      children: (
        <div className="description-section">
          <p>{equipment.description || '暂无详细介绍'}</p>
        </div>
      )
    }
  ];

  return (
    <div className="equipment-detail-container">
      <div className="equipment-detail-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/equipments')}
        >
          返回器材库
        </Button>
      </div>

      <Card className="equipment-detail-card">
        <div className="equipment-main">
          <div className="equipment-image">
            <img 
              src={equipment.cover_image || `https://picsum.photos/500/400?random=${id}`} 
              alt={`${equipment.brand} ${equipment.model}`}
            />
          </div>

          <div className="equipment-info">
            <h1 className="equipment-name">
              <CameraOutlined style={{ marginRight: 8 }} />
              {equipment.brand} {equipment.model}
            </h1>

            <div className="equipment-tags">
              {isCameraType ? (
                <>
                  {equipment.sensor_type && (
                    <Tag color="blue">{getSensorTypeText(equipment.sensor_type)}</Tag>
                  )}
                  {equipment.megapixels && (
                    <Tag>{equipment.megapixels} MP</Tag>
                  )}
                </>
              ) : (
                <>
                  {equipment.focal_length && (
                    <Tag color="purple">{equipment.focal_length}</Tag>
                  )}
                  {equipment.max_aperture && (
                    <Tag>f/{equipment.max_aperture}</Tag>
                  )}
                  {equipment.lens_type && (
                    <Tag color="green">{equipment.lens_type}</Tag>
                  )}
                </>
              )}
            </div>

            <div className="equipment-price">
              <DollarOutlined />
              <span className="price-amount">
                ¥{parseFloat(equipment.price).toLocaleString()}
              </span>
            </div>

            <Divider />

            <div className="equipment-actions">
              <Button 
                type="primary" 
                size="large"
                icon={<HeartOutlined />}
                onClick={handleAddToMyEquipments}
                block
              >
                加入我的器材库
              </Button>
              <Button 
                size="large"
                icon={<ShoppingCartOutlined />}
                block
                style={{ marginTop: 10 }}
                onClick={() => navigate('/market')}
              >
                查看二手市场
              </Button>
            </div>
          </div>
        </div>

        <Divider />

        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}

export default EquipmentDetail;
