import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Tag, Descriptions, Divider, message, Spin, Avatar, Modal, Input } from 'antd';
import { 
  CalendarOutlined, EnvironmentOutlined, TeamOutlined, 
  UserOutlined, ArrowLeftOutlined, DollarOutlined 
} from '@ant-design/icons';
import { useUserStore } from '../store';
import api from '../utils/api';
import './ActivityDetail.css';

const { TextArea } = Input;

function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, user } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState(null);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchActivityDetail();
  }, [id]);

  const fetchActivityDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/activities/${id}`);
      setActivity(response.data);
    } catch (error) {
      console.error('获取活动详情失败:', error);
      message.error('获取活动详情失败');
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

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleJoinActivity = () => {
    if (!accessToken) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    if (activity.status === 0) {
      message.error('活动已取消');
      return;
    }

    if (activity.status === 4) {
      message.error('活动已结束');
      return;
    }

    if (activity.user_participated === 1) {
      message.info('您已报名该活动');
      return;
    }

    setJoinModalVisible(true);
  };

  const confirmJoin = async () => {
    try {
      setJoining(true);
      await api.post(`/activities/${id}/join`, {
        message: joinMessage
      });
      message.success('报名成功');
      setJoinModalVisible(false);
      setJoinMessage('');
      fetchActivityDetail();
    } catch (error) {
      message.error(error.response?.data?.message || '报名失败');
    } finally {
      setJoining(false);
    }
  };

  const handleCancelParticipation = async () => {
    try {
      await api.delete(`/activities/${id}/join`);
      message.success('已取消报名');
      fetchActivityDetail();
    } catch (error) {
      message.error(error.response?.data?.message || '取消报名失败');
    }
  };

  if (loading || !activity) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  const activityItems = [
    { key: '1', label: '活动类型', children: getActivityTypeText(activity.activity_type) },
    { key: '2', label: '开始时间', children: formatDateTime(activity.start_time) },
    { key: '3', label: '结束时间', children: activity.end_time ? formatDateTime(activity.end_time) : '待定' },
    { key: '4', label: '活动地点', children: activity.location },
    { key: '5', label: '人数限制', children: activity.max_participants > 0 ? `${activity.max_participants}人` : '不限' },
    { key: '6', label: '当前人数', children: `${activity.current_participants || 0}人` },
    { key: '7', label: '费用', children: getFeeTypeText(activity.fee_type) + (activity.fee_amount > 0 ? ` ¥${activity.fee_amount}` : '') },
    { key: '8', label: '发起人', children: activity.creator_name },
  ];

  return (
    <div className="activity-detail-container">
      <div className="activity-detail-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/activities')}
        >
          返回活动列表
        </Button>
      </div>

      <Card className="activity-detail-card">
        <div className="activity-main">
          <div className="activity-image">
            <img 
              src={activity.cover_image || `https://picsum.photos/800/400?random=${id}`} 
              alt={activity.title}
            />
          </div>

          <div className="activity-info-section">
            <div className="activity-header-info">
              <h1 className="activity-name">
                <CalendarOutlined style={{ marginRight: 8 }} />
                {activity.title}
              </h1>
              <Tag color={getStatusColor(activity.status)} style={{ fontSize: 14 }}>
                {getStatusText(activity.status)}
              </Tag>
            </div>

            <div className="activity-description">
              <p>{activity.description}</p>
            </div>

            <Divider />

            <Descriptions
              bordered
              column={1}
              items={activityItems}
            />

            <Divider />

            {activity.requirements && (
              <div className="activity-section">
                <h3>活动要求</h3>
                <p>{activity.requirements}</p>
              </div>
            )}

            {activity.schedule && (
              <div className="activity-section">
                <h3>活动流程</h3>
                <p>{activity.schedule}</p>
              </div>
            )}

            {activity.notes && (
              <div className="activity-section">
                <h3>注意事项</h3>
                <p>{activity.notes}</p>
              </div>
            )}

            <Divider />

            <div className="activity-actions">
              {activity.user_participated === 1 ? (
                <Button 
                  size="large" 
                  danger
                  onClick={handleCancelParticipation}
                  block
                >
                  取消报名
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleJoinActivity}
                  disabled={activity.status === 0 || activity.status === 4}
                  block
                >
                  {activity.status === 2 ? '活动已满员' : '报名参加'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <Divider />

        <div className="participants-section">
          <h3>参与者 ({activity.participants?.length || 0})</h3>
          <div className="participants-list">
            {activity.participants && activity.participants.length > 0 ? (
              activity.participants.map(participant => (
                <div key={participant.id} className="participant-item">
                  <Avatar src={participant.avatar} icon={<UserOutlined />} />
                  <span>{participant.nickname}</span>
                </div>
              ))
            ) : (
              <p style={{ color: '#999' }}>暂无参与者</p>
            )}
          </div>
        </div>
      </Card>

      <Modal
        title="报名活动"
        open={joinModalVisible}
        onOk={confirmJoin}
        onCancel={() => setJoinModalVisible(false)}
        confirmLoading={joining}
        okText="确认报名"
        cancelText="取消"
      >
        <div style={{ marginBottom: 15 }}>
          <p>您确定要报名参加这个活动吗？</p>
        </div>
        <TextArea
          placeholder="给发起人留言（可选）"
          value={joinMessage}
          onChange={e => setJoinMessage(e.target.value)}
          rows={4}
          maxLength={200}
          showCount
        />
      </Modal>
    </div>
  );
}

export default ActivityDetail;
