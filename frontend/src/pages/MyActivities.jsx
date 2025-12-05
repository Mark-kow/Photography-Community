import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tabs, Tag, Button, message, Spin, Empty } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, TeamOutlined, PlusOutlined } from '@ant-design/icons';
import { useUserStore } from '../store';
import api from '../utils/api';
import './MyActivities.css';

function MyActivities() {
  const navigate = useNavigate();
  const { accessToken } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('joined');
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!accessToken) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    fetchMyActivities();
  }, [accessToken, activeTab]);

  const fetchMyActivities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/activities/my/list', {
        params: { type: activeTab }
      });
      setActivities(response.data.items || []);
    } catch (error) {
      console.error('获取我的活动失败:', error);
      message.error('获取我的活动失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      0: '已取消',
      1: '招募中',
      2: '已满员',
      3: '进行中',
      4: '已结束'
    };
    return statusMap[status] || '未知';
  };

  const getStatusColor = (status) => {
    const colorMap = {
      0: 'default',
      1: 'green',
      2: 'orange',
      3: 'blue',
      4: 'default'
    };
    return colorMap[status] || 'default';
  };

  const getActivityTypeText = (type) => {
    const typeMap = {
      sunrise: '晨拍',
      sunset: '日落',
      night: '夜拍',
      theme: '主题拍摄'
    };
    return typeMap[type] || type;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderActivityCard = (activity) => (
    <Card
      key={activity.id}
      hoverable
      className="my-activity-card"
      onClick={() => navigate(`/activity/${activity.id}`)}
    >
      <div className="my-activity-content">
        <div className="my-activity-cover">
          <img 
            src={activity.cover_image || `https://picsum.photos/200/120?random=${activity.id}`} 
            alt={activity.title}
          />
          <div className="my-activity-badge">
            <Tag color={getStatusColor(activity.status)}>{getStatusText(activity.status)}</Tag>
            {activity.activity_type && (
              <Tag color="blue">{getActivityTypeText(activity.activity_type)}</Tag>
            )}
          </div>
        </div>

        <div className="my-activity-info">
          <h3 className="my-activity-title">{activity.title}</h3>
          <p className="my-activity-description">{activity.description}</p>
          
          <div className="my-activity-meta">
            <div className="meta-item">
              <CalendarOutlined />
              <span>{formatDate(activity.start_time)}</span>
            </div>
            <div className="meta-item">
              <EnvironmentOutlined />
              <span>{activity.location}</span>
            </div>
            <div className="meta-item">
              <TeamOutlined />
              <span>
                {activity.current_participants || 0}
                {activity.max_participants > 0 && `/${activity.max_participants}`}人
              </span>
            </div>
          </div>

          {activeTab === 'created' && (
            <div className="my-activity-creator-info">
              <span className="creator-badge">我发起的</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  const tabItems = [
    {
      key: 'joined',
      label: '我参与的',
      children: (
        <div className="activity-list">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : activities.length > 0 ? (
            <div className="activity-grid">
              {activities.map(renderActivityCard)}
            </div>
          ) : (
            <Empty 
              description="暂无参与的活动"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" onClick={() => navigate('/activities')}>
                去参加活动
              </Button>
            </Empty>
          )}
        </div>
      )
    },
    {
      key: 'created',
      label: '我发起的',
      children: (
        <div className="activity-list">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : activities.length > 0 ? (
            <div className="activity-grid">
              {activities.map(renderActivityCard)}
            </div>
          ) : (
            <Empty 
              description="暂无发起的活动"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/activities/create')}
              >
                发起活动
              </Button>
            </Empty>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="my-activities-container">
      <div className="my-activities-header">
        <h1>📅 我的活动</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => navigate('/activities/create')}
        >
          发起新活动
        </Button>
      </div>

      <Card className="my-activities-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </div>
  );
}

export default MyActivities;
