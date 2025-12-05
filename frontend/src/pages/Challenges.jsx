import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Select, Tag, Button, message, Spin, Progress } from 'antd';
import { TrophyOutlined, CalendarOutlined, EyeOutlined, TeamOutlined, FireOutlined } from '@ant-design/icons';
import api from '../utils/api';
import './Challenges.css';

function Challenges() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [status, setStatus] = useState('');
  const [difficulty, setDifficulty] = useState('');

  useEffect(() => {
    fetchChallenges();
  }, [status, difficulty]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const params = {
        status: status || undefined,
        difficulty: difficulty || undefined
      };
      const response = await api.get('/challenges', { params });
      setChallenges(response.data.items || []);
    } catch (error) {
      message.error('获取挑战赛列表失败');
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

  const getDifficultyText = (difficulty) => {
    const difficultyMap = {
      beginner: '入门',
      intermediate: '进阶',
      advanced: '专业'
    };
    return difficultyMap[difficulty] || difficulty;
  };

  const getDifficultyColor = (difficulty) => {
    const colorMap = {
      beginner: 'green',
      intermediate: 'orange',
      advanced: 'red'
    };
    return colorMap[difficulty] || 'default';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const calculateProgress = (startTime, endTime) => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const now = Date.now();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end - start;
    const passed = now - start;
    return Math.round((passed / total) * 100);
  };

  const renderChallengeCard = (challenge) => {
    const progress = calculateProgress(challenge.start_time, challenge.end_time);
    
    return (
      <Card
        key={challenge.id}
        hoverable
        className="challenge-card"
        cover={
          <div className="challenge-cover">
            <img alt={challenge.title} src={challenge.cover_image || 'https://picsum.photos/800/400?random=' + challenge.id} />
            <div className="challenge-overlay">
              <Tag color={getStatusColor(challenge.status)}>{getStatusText(challenge.status)}</Tag>
              <Tag color={getDifficultyColor(challenge.difficulty)}>
                {getDifficultyText(challenge.difficulty)}
              </Tag>
            </div>
          </div>
        }
        onClick={() => navigate(`/challenge/${challenge.id}`)}
      >
        <Card.Meta
          title={
            <div className="challenge-title">
              <TrophyOutlined style={{ color: '#faad14', marginRight: 8 }} />
              <span>{challenge.title}</span>
            </div>
          }
          description={
            <div className="challenge-info">
              <div className="challenge-description">{challenge.description}</div>
              
              <div className="challenge-meta">
                <div className="meta-item">
                  <CalendarOutlined />
                  <span>{formatDate(challenge.start_time)} - {formatDate(challenge.end_time)}</span>
                </div>
                {challenge.theme && (
                  <div className="meta-item">
                    <Tag color="purple">{challenge.theme}</Tag>
                  </div>
                )}
              </div>

              {challenge.status === 2 && (
                <div className="challenge-progress">
                  <Progress 
                    percent={progress} 
                    size="small"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                </div>
              )}

              <div className="challenge-stats">
                <div className="stat-item">
                  <TeamOutlined />
                  <span>{challenge.participant_count || 0} 参与</span>
                </div>
                <div className="stat-item">
                  <FireOutlined />
                  <span>{challenge.work_count || 0} 作品</span>
                </div>
                <div className="stat-item">
                  <EyeOutlined />
                  <span>{challenge.view_count || 0} 浏览</span>
                </div>
              </div>

              {challenge.prizes && challenge.prizes.length > 0 && (
                <div className="challenge-prizes">
                  <Tag color="gold" icon={<TrophyOutlined />}>
                    {challenge.prizes[0].prize}
                  </Tag>
                  {challenge.prizes.length > 1 && (
                    <span style={{ color: '#999', fontSize: 12 }}>等{challenge.prizes.length}个奖项</span>
                  )}
                </div>
              )}
            </div>
          }
        />
      </Card>
    );
  };

  return (
    <div className="challenges-container">
      <div className="challenges-header">
        <div>
          <h1>🏆 挑战赛</h1>
          <p>参加摄影挑战，展示你的才华，赢取丰厚奖品</p>
        </div>
      </div>

      <div className="challenges-filters">
        <div className="filter-group">
          <Select
            placeholder="挑战赛状态"
            style={{ width: 150 }}
            allowClear
            value={status || undefined}
            onChange={setStatus}
          >
            <Select.Option value="1">报名中</Select.Option>
            <Select.Option value="2">进行中</Select.Option>
            <Select.Option value="3">评选中</Select.Option>
            <Select.Option value="4">已结束</Select.Option>
          </Select>

          <Select
            placeholder="难度等级"
            style={{ width: 150 }}
            allowClear
            value={difficulty || undefined}
            onChange={setDifficulty}
          >
            <Select.Option value="beginner">入门</Select.Option>
            <Select.Option value="intermediate">进阶</Select.Option>
            <Select.Option value="advanced">专业</Select.Option>
          </Select>
        </div>
      </div>

      <div className="challenge-list">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : (
          <div className="challenge-grid">
            {challenges.map(renderChallengeCard)}
          </div>
        )}
      </div>
    </div>
  );
}

export default Challenges;
