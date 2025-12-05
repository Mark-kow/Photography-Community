import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tag, Avatar, Button, message, Spin } from 'antd';
import { 
  ClockCircleOutlined, StarOutlined, StarFilled, 
  TrophyOutlined, UserOutlined, ArrowLeftOutlined,
  HeartOutlined, HeartFilled
} from '@ant-design/icons';
import { useUserStore } from '../store';
import api from '../utils/api';
import './TipDetail.css';

function TipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState(null);
  const [liked, setLiked] = useState(false);
  const [collected, setCollected] = useState(false);

  useEffect(() => {
    fetchTipDetail();
  }, [id]);

  const fetchTipDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/courses/tips/${id}`);
      setTip(response.data);
    } catch (error) {
      message.error('获取技巧详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!accessToken) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    try {
      if (liked) {
        await api.delete(`/tips/${id}/like`);
        setLiked(false);
        setTip({ ...tip, like_count: tip.like_count - 1 });
        message.success('已取消点赞');
      } else {
        await api.post(`/tips/${id}/like`);
        setLiked(true);
        setTip({ ...tip, like_count: tip.like_count + 1 });
        message.success('点赞成功');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleCollect = async () => {
    if (!accessToken) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    try {
      if (collected) {
        await api.delete(`/tips/${id}/collect`);
        setCollected(false);
        setTip({ ...tip, collect_count: tip.collect_count - 1 });
        message.success('已取消收藏');
      } else {
        await api.post(`/tips/${id}/collect`);
        setCollected(true);
        setTip({ ...tip, collect_count: tip.collect_count + 1 });
        message.success('收藏成功');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handlePractice = async () => {
    if (!accessToken) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    try {
      await api.post(`/tips/${id}/practice`);
      setTip({ ...tip, practice_count: tip.practice_count + 1 });
      message.success('已标记为实践！');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getDifficultyColor = (diff) => {
    const colorMap = {
      beginner: 'green',
      intermediate: 'orange',
      advanced: 'red'
    };
    return colorMap[diff] || 'blue';
  };

  const getDifficultyText = (diff) => {
    const textMap = {
      beginner: '入门',
      intermediate: '进阶',
      advanced: '高级'
    };
    return textMap[diff] || diff;
  };

  const getCategoryText = (cat) => {
    const categoryMap = {
      shooting: '拍摄技巧',
      post: '后期处理',
      equipment: '器材知识',
      portrait: '人像摄影',
      landscape: '风光摄影',
      street: '街拍技巧',
      architecture: '建筑摄影'
    };
    return categoryMap[cat] || cat;
  };

  if (loading || !tip) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="tip-detail-container">
      <div className="tip-detail-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/courses')}
        >
          返回
        </Button>
      </div>

      <Card className="tip-detail-card">
        <div className="tip-header">
          <div className="tip-title-section">
            <h1>{tip.title}</h1>
            <div className="tip-tags">
              <Tag color={getDifficultyColor(tip.difficulty)}>
                {getDifficultyText(tip.difficulty)}
              </Tag>
              {tip.category && (
                <Tag color="blue">{getCategoryText(tip.category)}</Tag>
              )}
            </div>
          </div>

          <div className="tip-meta">
            <div className="author-info">
              <Avatar src={tip.author_avatar} icon={<UserOutlined />} />
              <span className="author-name">{tip.author_name}</span>
            </div>
            <div className="tip-stats">
              <span><ClockCircleOutlined /> {tip.reading_time} 分钟</span>
              <span><StarOutlined /> {tip.like_count || 0} 点赞</span>
              <span><TrophyOutlined /> {tip.practice_count || 0} 人实践</span>
            </div>
          </div>
        </div>

        {tip.cover_image && (
          <div className="tip-cover">
            <img src={tip.cover_image} alt={tip.title} />
          </div>
        )}

        <div className="tip-content">
          <div 
            dangerouslySetInnerHTML={{ 
              __html: tip.content?.replace(/\n/g, '<br />') || '' 
            }}
          />
        </div>

        <div className="tip-actions">
          <Button
            type={liked ? 'primary' : 'default'}
            icon={liked ? <HeartFilled /> : <HeartOutlined />}
            onClick={handleLike}
            size="large"
          >
            {liked ? '已点赞' : '点赞'} ({tip.like_count || 0})
          </Button>

          <Button
            type={collected ? 'primary' : 'default'}
            icon={collected ? <StarFilled /> : <StarOutlined />}
            onClick={handleCollect}
            size="large"
          >
            {collected ? '已收藏' : '收藏'} ({tip.collect_count || 0})
          </Button>

          <Button
            icon={<TrophyOutlined />}
            onClick={handlePractice}
            size="large"
          >
            已实践 ({tip.practice_count || 0})
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default TipDetail;
