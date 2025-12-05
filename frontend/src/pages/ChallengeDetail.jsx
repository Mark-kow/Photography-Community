import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Button, Tag, Avatar, message, Spin, Divider, List, Tabs,
  Modal, Select, Progress, Empty
} from 'antd';
import { 
  TrophyOutlined, CalendarOutlined, UserOutlined, 
  StarOutlined, FireOutlined, ArrowLeftOutlined,
  UploadOutlined, PictureOutlined, CrownOutlined, HeartOutlined, HeartFilled
} from '@ant-design/icons';
import { useUserStore } from '../store';
import api from '../utils/api';
import dayjs from 'dayjs';
import './ChallengeDetail.css';

function ChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [works, setWorks] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [hasJoined, setHasJoined] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [myWorks, setMyWorks] = useState([]);
  const [selectedWorkId, setSelectedWorkId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [votedWorks, setVotedWorks] = useState(new Set());

  useEffect(() => {
    fetchChallengeDetail();
    fetchWorks();
  }, [id]);

  const fetchChallengeDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/challenges/${id}`);
      const data = response.data;
      setChallenge(data);
      setHasJoined(data.user_participated || false);
      // 设置已投票的作品
      if (data.user_voted_works && Array.isArray(data.user_voted_works)) {
        setVotedWorks(new Set(data.user_voted_works));
      }
    } catch (error) {
      console.error('获取挑战赛详情失败:', error);
      message.error('获取挑战赛详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorks = async () => {
    try {
      const response = await api.get(`/challenges/${id}/works`);
      setWorks(response.data.items || []);
    } catch (error) {
      console.error('获取作品列表失败', error);
    }
  };

  const fetchMyWorks = async () => {
    try {
      const response = await api.get(`/users/${accessToken ? 'me' : ''}/works`);
      setMyWorks(response.data.items || []);
    } catch (error) {
      console.error('获取我的作品失败', error);
      setMyWorks([]);
    }
  };

  const handleSubmitWork = async () => {
    if (!accessToken) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    await fetchMyWorks();
    setSubmitModalVisible(true);
  };

  const confirmSubmitWork = async () => {
    if (!selectedWorkId) {
      message.warning('请选择要提交的作品');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/challenges/submit', {
        challengeId: id,
        workId: selectedWorkId
      });
      message.success('提交成功！');
      setSubmitModalVisible(false);
      setHasJoined(true);
      fetchChallengeDetail();
      fetchWorks();
    } catch (error) {
      message.error(error.response?.data?.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (workId) => {
    if (!accessToken) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    const isVoted = votedWorks.has(workId);

    try {
      if (isVoted) {
        await api.delete('/challenges/vote', {
          data: { challengeId: id, workId }
        });
        message.success('已取消投票');
        setVotedWorks(prev => {
          const newSet = new Set(prev);
          newSet.delete(workId);
          return newSet;
        });
      } else {
        await api.post('/challenges/vote', {
          challengeId: id,
          workId
        });
        message.success('投票成功');
        setVotedWorks(prev => new Set([...prev, workId]));
      }
      // 刷新作品列表
      fetchWorks();
    } catch (error) {
      message.error(error.response?.data?.message || (isVoted ? '取消投票失败' : '投票失败'));
    }
  };

  const getStatusTag = (challenge) => {
    const now = new Date();
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);
    
    if (challenge.status === 3) {
      return <Tag color="default">已结束</Tag>;
    } else if (now < startDate) {
      return <Tag color="blue">即将开始</Tag>;
    } else if (now >= startDate && now <= endDate) {
      return <Tag color="green">进行中</Tag>;
    } else {
      return <Tag color="orange">评选中</Tag>;
    }
  };

  const getRankBadge = (rank) => {
    const badges = {
      1: '🥇',
      2: '🥈',
      3: '🥉'
    };
    return badges[rank] || `#${rank}`;
  };

  if (loading || !challenge) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  const canSubmit = (challenge.status === 1 || challenge.status === 2) && !hasJoined;
  const canVote = challenge.status === 2 || challenge.status === 3;

  const tabItems = [
    {
      key: 'info',
      label: '赛事信息',
      children: (
        <div className="challenge-info-section">
          <div className="info-card">
            <h3>📋 赛事介绍</h3>
            <p>{challenge.description}</p>
          </div>

          {challenge.theme && (
            <div className="info-card">
              <h3>🎯 赛事主题</h3>
              <Tag color="purple" icon={<FireOutlined />} style={{ fontSize: 16, padding: '8px 16px' }}>
                {challenge.theme}
              </Tag>
            </div>
          )}

          {challenge.rules && (
            <div className="info-card">
              <h3>📜 参赛规则</h3>
              <div dangerouslySetInnerHTML={{ __html: challenge.rules.replace(/\n/g, '<br/>') }} />
            </div>
          )}

          {challenge.prizes && (
            <div className="info-card prizes-card">
              <h3>🎁 奖励设置</h3>
              <div className="prizes-list">
                {(() => {
                  try {
                    const prizes = typeof challenge.prizes === 'string' 
                      ? JSON.parse(challenge.prizes) 
                      : challenge.prizes;
                    return Array.isArray(prizes) ? prizes.map((prize, index) => (
                      <Tag key={index} color="gold" style={{ fontSize: 14, padding: '6px 12px', margin: '5px' }}>
                        {typeof prize === 'string' ? prize : `${prize.rank || ''} ${prize.prize || ''} ${prize.description || ''}`}
                      </Tag>
                    )) : null;
                  } catch (e) {
                    return <Tag color="gold">{challenge.prizes}</Tag>;
                  }
                })()}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'works',
      label: `参赛作品 (${works.length})`,
      children: (
        <div className="works-section">
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4 }}
            dataSource={works}
            renderItem={(work) => (
              <List.Item>
                <Card
                  hoverable
                  cover={
                    <div className="work-cover" onClick={() => navigate(`/work/${work.work_id}`)}>
                      <img alt={work.title} src={
                        (() => {
                          try {
                            const images = typeof work.images === 'string' 
                              ? JSON.parse(work.images) 
                              : work.images;
                            return Array.isArray(images) && images.length > 0 
                              ? images[0] 
                              : 'https://picsum.photos/300/200';
                          } catch (e) {
                            return 'https://picsum.photos/300/200';
                          }
                        })()
                      } />
                    </div>
                  }
                >
                  <Card.Meta
                    avatar={<Avatar src={work.avatar} onClick={(e) => { e.stopPropagation(); navigate(`/profile/${work.user_id}`); }}>{work.nickname?.[0]}</Avatar>}
                    title={<div onClick={() => navigate(`/work/${work.work_id}`)}>{work.title || '无标题'}</div>}
                    description={
                      <div className="work-stats">
                        {canVote && (
                          <Button
                            type={votedWorks.has(work.work_id) ? "primary" : "default"}
                            size="small"
                            icon={votedWorks.has(work.work_id) ? <HeartFilled /> : <HeartOutlined />}
                            onClick={(e) => { e.stopPropagation(); handleVote(work.work_id); }}
                          >
                            {work.vote_count || 0}
                          </Button>
                        )}
                        {!canVote && (
                          <span><StarOutlined /> {work.vote_count || 0} 票</span>
                        )}
                      </div>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        </div>
      )
    },

  ];

  return (
    <div className="challenge-detail-container">
      <div className="challenge-detail-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/challenges')}
        >
          返回挑战赛列表
        </Button>
      </div>

      <Card 
        className="challenge-detail-card"
        cover={
          <div className="challenge-cover-large">
            <img 
              src={challenge.cover_image || `https://picsum.photos/1200/400?random=${id}`} 
              alt={challenge.title}
            />
            <div className="cover-overlay">
              <div className="challenge-status-badge">
                {getStatusTag(challenge)}
              </div>
            </div>
          </div>
        }
      >
        <div className="challenge-header-section">
          <h1 className="challenge-title">
            <TrophyOutlined style={{ color: '#FFD700', marginRight: 10 }} />
            {challenge.title}
          </h1>

          <div className="challenge-meta-row">
            <div className="meta-item">
              <CalendarOutlined />
              <span>
                {dayjs(challenge.start_date).format('MM-DD')} ~ {dayjs(challenge.end_date).format('MM-DD')}
              </span>
            </div>
            <div className="meta-item">
              <UserOutlined />
              <span>{challenge.participant_count || 0} 人参赛</span>
            </div>
            <div className="meta-item">
              <PictureOutlined />
              <span>{challenge.work_count || 0} 作品</span>
            </div>
          </div>
        </div>

        <Divider />

        <Tabs items={tabItems} />

        <Divider />

        <div className="challenge-actions">
          {hasJoined ? (
            <div className="action-buttons">
              <Tag color="success" style={{ fontSize: 16, padding: '8px 16px' }}>
                ✓ 已参赛
              </Tag>
              {challenge.user_work_id && (
                <Button 
                  type="link"
                  onClick={() => navigate(`/work/${challenge.user_work_id}`)}
                >
                  查看我的参赛作品 →
                </Button>
              )}
            </div>
          ) : (
            <Button
              type="primary"
              size="large"
              disabled={!canSubmit}
              onClick={handleSubmitWork}
              icon={<UploadOutlined />}
              block
            >
              {canSubmit ? '提交作品参赛' : challenge.status === 4 ? '挑战赛已结束' : '报名已截止'}
            </Button>
          )}
        </div>
      </Card>

      <Modal
        title="选择参赛作品"
        open={submitModalVisible}
        onCancel={() => {
          setSubmitModalVisible(false);
          setSelectedWorkId(null);
        }}
        onOk={confirmSubmitWork}
        confirmLoading={submitting}
        okText="确认提交"
        cancelText="取消"
        width={800}
      >
        {myWorks.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="您还没有发布作品"
          >
            <Button 
              type="primary" 
              onClick={() => {
                setSubmitModalVisible(false);
                navigate('/create');
              }}
            >
              去发布作品
            </Button>
          </Empty>
        ) : (
          <div>
            <p style={{ marginBottom: 16, color: '#666' }}>从您的作品中选择一个参加挑战赛</p>
            <Select
              style={{ width: '100%', marginBottom: 16 }}
              placeholder="选择作品"
              value={selectedWorkId}
              onChange={setSelectedWorkId}
              size="large"
            >
              {myWorks.map(work => (
                <Select.Option key={work.id} value={work.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img 
                      src={Array.isArray(work.images) ? work.images[0] : JSON.parse(work.images)[0]} 
                      alt={work.title}
                      style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
                    />
                    <span>{work.title || '无标题'}</span>
                  </div>
                </Select.Option>
              ))}
            </Select>
            {selectedWorkId && (
              <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                <p style={{ margin: 0, color: '#999', fontSize: 13 }}>提示：提交后不可更改，请确认选择正确的作品</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ChallengeDetail;
