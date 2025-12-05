import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tabs, Button, message, Spin, Empty, Tag, Modal } from 'antd';
import { CameraOutlined, PlusOutlined, DeleteOutlined, ToolOutlined } from '@ant-design/icons';
import { useUserStore } from '../store';
import api from '../utils/api';
import './MyEquipments.css';

function MyEquipments() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [equipments, setEquipments] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchMyEquipments();
  }, [activeTab]);

  const fetchMyEquipments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const params = activeTab !== 'all' ? { equipmentType: activeTab } : {};
      const response = await api.get(`/equipments/user/${user.id}`, { params });
      setEquipments(response.data.list || []);
    } catch (error) {
      console.error('获取器材库失败:', error);
      message.error('获取器材库失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要从器材库中删除这个器材吗？',
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await api.delete(`/equipments/user/${id}`);
          message.success('删除成功');
          fetchMyEquipments();
        } catch (error) {
          message.error(error.response?.data?.message || '删除失败');
        }
      }
    });
  };

  const renderEquipmentCard = (equipment) => {
    const displayName = equipment.custom_name || `${equipment.brand || ''} ${equipment.model || ''}`.trim() || '自定义器材';
    const equipmentTypeText = equipment.equipment_type === 'camera' ? '相机' : equipment.equipment_type === 'lens' ? '镜头' : '其他';

    return (
      <Card
        key={equipment.id}
        hoverable
        className="my-equipment-card"
        cover={
          <div className="my-equipment-cover">
            <img 
              src={equipment.cover_image || `https://picsum.photos/400/300?random=${equipment.id}`} 
              alt={displayName}
            />
          </div>
        }
        onClick={() => {
          if (equipment.equipment_id) {
            navigate(`/equipment/${equipment.equipment_type}/${equipment.equipment_id}`);
          }
        }}
      >
        <Card.Meta
          title={
            <div className="my-equipment-title">
              <span>{displayName}</span>
              <Tag color="blue">{equipmentTypeText}</Tag>
            </div>
          }
          description={
            <div className="my-equipment-info">
              {equipment.purchase_date && (
                <div className="info-row">
                  <span className="label">购买时间:</span>
                  <span>{new Date(equipment.purchase_date).toLocaleDateString()}</span>
                </div>
              )}
              {equipment.purchase_price && (
                <div className="info-row">
                  <span className="label">购买价格:</span>
                  <span>¥{parseFloat(equipment.purchase_price).toLocaleString()}</span>
                </div>
              )}
              {equipment.shutter_count && (
                <div className="info-row">
                  <span className="label">快门数:</span>
                  <span>{equipment.shutter_count.toLocaleString()}</span>
                </div>
              )}
              {equipment.notes && (
                <div className="info-row notes">
                  <span className="label">备注:</span>
                  <span>{equipment.notes}</span>
                </div>
              )}
              <div className="equipment-actions">
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(equipment.id);
                  }}
                >
                  删除
                </Button>
              </div>
            </div>
          }
        />
      </Card>
    );
  };

  const tabItems = [
    {
      key: 'all',
      label: '全部器材',
      children: (
        <div className="equipment-list">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : equipments.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="还没有添加任何器材"
            >
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/equipments')}
              >
                去浏览器材库
              </Button>
            </Empty>
          ) : (
            <div className="equipment-grid">
              {equipments.map(renderEquipmentCard)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'camera',
      label: '📷 相机',
      children: (
        <div className="equipment-list">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : equipments.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="还没有相机"
            >
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/equipments')}
              >
                去添加相机
              </Button>
            </Empty>
          ) : (
            <div className="equipment-grid">
              {equipments.map(renderEquipmentCard)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'lens',
      label: '🔭 镜头',
      children: (
        <div className="equipment-list">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : equipments.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="还没有镜头"
            >
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/equipments')}
              >
                去添加镜头
              </Button>
            </Empty>
          ) : (
            <div className="equipment-grid">
              {equipments.map(renderEquipmentCard)}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="my-equipments-container">
      <div className="my-equipments-header">
        <div>
          <h1><ToolOutlined /> 我的器材库</h1>
          <p>管理你的摄影器材</p>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => navigate('/equipments')}
        >
          添加器材
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        items={tabItems}
        onChange={setActiveTab}
        className="my-equipments-tabs"
      />
    </div>
  );
}

export default MyEquipments;
