import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tag, Empty, Button, message, Spin } from 'antd';
import { TrophyOutlined, CalendarOutlined, StarOutlined, FireOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';
import './MyChallenges.css';

function MyChallenges() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [challenges, setChallenges] = useState([]);

  useEffect(() => {
    fetchMyChallenges();
  }, []);

  const fetchMyChallenges = async () => {
    try {
      setLoading(true);
      const response = await api.get('/challenges/my/list');
      setChallenges(response.data.items || []);
    } catch (error) {
      console.error('获取我的挑战赛失败:', error);
      message.error('获取我的挑战赛失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      0: '草稿',
      1: '报名中',
      2: '进行中',
      3: '评选中',
      4: '已结束'
    };
    return statusMap[status] || '未知';
  };

  const getStatusColor = (status) => {
    const colorMap = {
      0: 'default',
      1: 'green',
      2: 'blue',
      3: 'orange',
      4: 'default'
    };
    return colorMap[status] || 'default';
  };

  const renderChallengeCard = (challenge) => {
    const coverImage = challenge.cover_image || `https://picsum.photos/400/200?random=${challenge.id}`;
    
    return (
      <Card
        key={challenge.id}
        hoverable
        className="my-challenge-card"
        onClick={() => navigate(`/challenge/${challenge.id}`)}
      >
        <div className="my-challenge-content">
          <div className="my-challenge-cover">
            <img src={coverImage} alt={challenge.title} />
          </div>
          
          <div className="my-challenge-info">
            <div className="my-challenge-header">
              <h3>
                <TrophyOutlined style={{ color: '#faad14', marginRight: 8 }} />
                {challenge.title}
              </h3>
              <Tag color={getStatusColor(challenge.status)}>
                {getStatusText(challenge.status)}
              </Tag>
            </div>

            <div className="my-challenge-meta">
              <div className="meta-row">
                <CalendarOutlined />
                <span>
                  {dayjs(challenge.start_time).format('YYYY-MM-DD')} ~ {dayjs(challenge.end_time).format('YYYY-MM-DD')}
                </span>
              </div>
              
              {challenge.theme && (
                <div className="meta-row">
                  <Tag color="purple">{challenge.theme}</Tag>
                </div>
              )}
            </div>

            <div className="my-challenge-stats">
              <div className="stat-box">
                <span className="stat-value">{challenge.vote_count || 0}</span>
                <span className="stat-label">
                  <StarOutlined /> 得票
                </span>
              </div>
              
              <div className="stat-box">
                <span className="stat-value">{challenge.score || 0}</span>
                <span className="stat-label">
                  <FireOutlined /> 评分
                </span>
              </div>
              
              {challenge.ranking && (
                <div className="stat-box ranking-box">
                  <span className="stat-value">#{challenge.ranking}</span>
                  <span className="stat-label">排名</span>
                </div>
              )}
            </div>

            {challenge.work_id && (
              <div className="my-challenge-work">
                <Button 
                  size="small" 
                  type="link"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/work/${challenge.work_id}`);
                  }}
                >
                  查看我的参赛作品 →
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="my-challenges-container">
      <div className="my-challenges-header">
        <div>
          <h1>🏆 我的挑战赛</h1>
          <p>管理我参与的摄影挑战赛</p>
        </div>
        <Button 
          type="primary" 
          icon={<TrophyOutlined />}
          onClick={() => navigate('/challenges')}
        >
          浏览更多挑战赛
        </Button>
      </div>

      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      ) : challenges.length === 0 ? (
        <div className="empty-container">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="还没有参与任何挑战赛"
          >
            <Button 
              type="primary" 
              icon={<TrophyOutlined />}
              onClick={() => navigate('/challenges')}
            >
              去参加挑战赛
            </Button>
          </Empty>
        </div>
      ) : (
        <div className="my-challenges-list">
          {challenges.map(renderChallengeCard)}
        </div>
      )}
    </div>
  );
}

export default MyChallenges;
