import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Avatar, Typography, Statistic, Row, Col, Tabs, Button, Spin, Empty, Modal, message } from 'antd';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons';
import { userAPI, workAPI } from '../utils/api';
import { useUserStore } from '../store';
import './Profile.css';

const { Title, Text, Paragraph } = Typography;

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useUserStore();
  const [profile, setProfile] = useState(null);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
    loadWorks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProfile = async () => {
    try {
      const res = await userAPI.getUserProfile(id);
      setProfile(res.data);
    } catch (error) {
      console.error('加载用户资料失败', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorks = async () => {
    try {
      const res = await userAPI.getUserWorks(id, { page: 1, pageSize: 20 });
      setWorks(res.data.items || []);
    } catch (error) {
      console.error('加载用户作品失败', error);
      setWorks([]);
      message.error('获取用户作品失败');
    }
  };

  const handleFollow = async () => {
    try {
      if (profile.is_following) {
        await userAPI.unfollowUser(id);
      } else {
        await userAPI.followUser(id);
      }
      
      setProfile({
        ...profile,
        is_following: !profile.is_following,
        followers_count: profile.followers_count + (profile.is_following ? -1 : 1)
      });
    } catch (error) {
      console.error('关注操作失败', error);
    }
  };

  const handleDeleteWork = (workId) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后将无法恢复，确定要删除这个作品吗？',
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await workAPI.deleteWork(workId);
          message.success('删除成功');
          // 重新加载作品列表
          loadWorks();
          // 更新用户统计信息
          loadProfile();
        } catch (error) {
          console.error('删除失败', error);
          message.error('删除失败');
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (!profile) {
    return <Empty description="用户不存在" />;
  }

  const isOwnProfile = currentUser && currentUser.id === parseInt(id);

  return (
    <div className="profile-container">
      <div className="profile-content">
        <Card>
          <div className="profile-header">
            <Avatar size={120} src={profile.avatar} icon={<UserOutlined />} />
            
            <div className="profile-info">
              <div className="profile-name">
                <Title level={2}>{profile.nickname}</Title>
                {!isOwnProfile && (
                  <Button 
                    type={profile.is_following ? 'default' : 'primary'}
                    onClick={handleFollow}
                  >
                    {profile.is_following ? '已关注' : '关注'}
                  </Button>
                )}
              </div>
              
              {profile.bio && <Paragraph>{profile.bio}</Paragraph>}
              
              <Row gutter={32} style={{ marginTop: 16 }}>
                <Col>
                  <Statistic title="作品" value={profile.works_count || 0} />
                </Col>
                <Col>
                  <Statistic title="粉丝" value={profile.followers_count || 0} />
                </Col>
                <Col>
                  <Statistic title="关注" value={profile.following_count || 0} />
                </Col>
                <Col>
                  <Statistic title="获赞" value={profile.likes_count || 0} />
                </Col>
              </Row>
            </div>
          </div>
        </Card>

        <Card style={{ marginTop: 24 }}>
          <Tabs
            defaultActiveKey="works"
            items={[
              {
                key: 'works',
                label: '作品',
                children: works.length > 0 ? (
                  <Row gutter={[16, 16]}>
                    {works.map(work => (
                      <Col key={work.id} xs={24} sm={12} md={8} lg={6}>
                        <div className="profile-work-item">
                          <div onClick={() => navigate(`/work/${work.id}`)}>
                            <img src={work.images[0]} alt={work.title} />
                            <div className="work-overlay">
                              <Text style={{ color: '#fff' }}>{work.title || '无标题'}</Text>
                            </div>
                          </div>
                          {isOwnProfile && (
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              size="small"
                              className="delete-work-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWork(work.id);
                              }}
                            >
                              删除
                            </Button>
                          )}
                        </div>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <Empty description="暂无作品" />
                )
              }
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default Profile;
