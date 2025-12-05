import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Select, Tag, Button, message, Spin } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import { useUserStore } from '../store';
import api from '../utils/api';
import './Activities.css';

function Activities() {
  const navigate = useNavigate();
  const { accessToken } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activityType, setActivityType] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchActivities();
  }, [activityType, status]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = {
        activityType: activityType || undefined,
        status: status || undefined
      };
      const response = await api.get('/activities', { params });
      setActivities(response.data.items || []);
    } catch (error) {
      message.error('获取活动列表失败');
    } finally {
      setLoading(false);
    }
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

  const getFeeTypeText = (feeType) => {
    const typeMap = {
      free: '免费',
      aa: 'AA制',
      paid: '收费'
    };
    return typeMap[feeType] || feeType;
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

  const handleCreateActivity = () => {
    if (!accessToken) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    navigate('/activities/create');
  };

  const renderActivityCard = (activity) => (
    <Card
      key={activity.id}
      hoverable
      className="activity-card"
      cover={
        <div className="activity-cover">
          <img alt={activity.title} src={activity.cover_image || 'https://picsum.photos/800/400?random=' + activity.id} />
          <div className="activity-overlay">
            <Tag color={getStatusColor(activity.status)}>{getStatusText(activity.status)}</Tag>
            {activity.activity_type && (
              <Tag color="blue">{getActivityTypeText(activity.activity_type)}</Tag>
            )}
          </div>
        </div>
      }
      onClick={() => navigate(`/activity/${activity.id}`)}
    >
      <Card.Meta
        title={
          <div className="activity-title">
            <span>{activity.title}</span>
          </div>
        }
        description={
          <div className="activity-info">
            <div className="activity-description">{activity.description}</div>
            <div className="activity-meta">
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
              <div className="meta-item">
                <Tag color="red">{getFeeTypeText(activity.fee_type)}</Tag>
                {activity.fee_amount > 0 && <span>¥{activity.fee_amount}</span>}
              </div>
            </div>
            <div className="activity-creator">
              <UserOutlined />
              <span>发起人: {activity.creator_name}</span>
            </div>
          </div>
        }
      />
    </Card>
  );

  return (
    <div className="activities-container">
      <div className="activities-header">
        <div>
          <h1>📅 约拍活动</h1>
          <p>找到志同道合的摄影伙伴，一起出去拍摄</p>
        </div>
        <Button type="primary" size="large" onClick={handleCreateActivity}>
          发起活动
        </Button>
      </div>

      <div className="activities-filters">
        <div className="filter-group">
          <Select
            placeholder="活动类型"
            style={{ width: 150 }}
            allowClear
            value={activityType || undefined}
            onChange={setActivityType}
          >
            <Select.Option value="sunrise">晨拍</Select.Option>
            <Select.Option value="sunset">日落</Select.Option>
            <Select.Option value="night">夜拍</Select.Option>
            <Select.Option value="theme">主题拍摄</Select.Option>
          </Select>

          <Select
            placeholder="活动状态"
            style={{ width: 150 }}
            allowClear
            value={status || undefined}
            onChange={setStatus}
          >
            <Select.Option value="1">招募中</Select.Option>
            <Select.Option value="2">已满员</Select.Option>
            <Select.Option value="3">进行中</Select.Option>
            <Select.Option value="4">已结束</Select.Option>
          </Select>
        </div>
      </div>

      <div className="activity-list">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : (
          <div className="activity-grid">
            {activities.map(renderActivityCard)}
          </div>
        )}
      </div>
    </div>
  );
}

export default Activities;
