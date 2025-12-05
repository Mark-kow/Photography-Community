import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Spin, Empty, Image, Avatar, Typography, Space, message } from 'antd';
import { HeartOutlined, HeartFilled, MessageOutlined, EyeOutlined } from '@ant-design/icons';
import { workAPI } from '../utils/api';
import './Home.css';

const { Title, Text, Paragraph } = Typography;

const Home = () => {
  const navigate = useNavigate();
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadWorks();
  }, []);

  const loadWorks = async () => {
    setLoading(true);
    try {
      const res = await workAPI.getFeed({ page, pageSize: 20 });
      setWorks(res.data?.items || []);
    } catch (error) {
      console.error('加载作品失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (workId, isLiked) => {
    try {
      if (isLiked) {
        await workAPI.unlikeWork(workId);
      } else {
        await workAPI.likeWork(workId);
      }
      
      // 更新本地状态
      setWorks(works.map(work => 
        work.id === workId 
          ? { 
              ...work, 
              is_liked: !isLiked,
              like_count: work.like_count + (isLiked ? -1 : 1)
            }
          : work
      ));
    } catch (error) {
      console.error('点赞失败', error);
    }
  };

  if (loading && works.length === 0) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-content">
        <Title level={2} style={{ marginBottom: 24 }}>发现</Title>
        
        {works.length === 0 ? (
          <Empty description="暂无作品" />
        ) : (
          <Row gutter={[16, 16]}>
            {works.map((work) => (
              <Col key={work.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  cover={
                    <div 
                      className="work-cover"
                      onClick={() => navigate(`/work/${work.id}`)}
                    >
                      <Image
                        src={work.images[0]}
                        alt={work.title}
                        preview={false}
                        style={{ width: '100%', height: 240, objectFit: 'cover' }}
                      />
                    </div>
                  }
                  className="work-card"
                >
                  <Card.Meta
                    avatar={
                      <Avatar 
                        src={work.avatar} 
                        onClick={() => navigate(`/profile/${work.user_id}`)}
                        style={{ cursor: 'pointer' }}
                      />
                    }
                    title={
                      <div onClick={() => navigate(`/work/${work.id}`)} style={{ cursor: 'pointer' }}>
                        {work.title || '无标题'}
                      </div>
                    }
                    description={
                      <Space size="middle">
                        <span onClick={() => handleLike(work.id, work.is_liked)}>
                          {work.is_liked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                          {' '}{work.like_count || 0}
                        </span>
                        <span>
                          <MessageOutlined /> {work.comment_count || 0}
                        </span>
                        <span>
                          <EyeOutlined /> {work.view_count || 0}
                        </span>
                      </Space>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
};

export default Home;
