import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Image, Avatar, Typography, Space, Button, Divider, List, Input, message, Spin, Modal, Dropdown, Alert, Tag } from 'antd';
import { ArrowLeftOutlined, HeartOutlined, HeartFilled, StarOutlined, StarFilled, MessageOutlined, EyeOutlined, MoreOutlined, DeleteOutlined, EditOutlined, RobotOutlined, BulbOutlined, TagOutlined } from '@ant-design/icons';
import { workAPI, commentAPI } from '../utils/api';
import api from '../utils/api';
import { useUserStore } from '../store';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import './WorkDetail.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const WorkDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, user: currentUser } = useUserStore();
  const [work, setWork] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  useEffect(() => {
    loadWorkDetail();
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadWorkDetail = async () => {
    try {
      const res = await workAPI.getWorkDetail(id);
      setWork(res.data);
    } catch (error) {
      console.error('加载作品详情失败', error);
      message.error('作品不存在');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const res = await commentAPI.getWorkComments(id, { page: 1, pageSize: 20 });
      setComments(res.data.items || []);
    } catch (error) {
      console.error('加载评论失败', error);
      setComments([]);
    }
  };

  const handleLike = async () => {
    if (!accessToken) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    try {
      if (work.is_liked) {
        await workAPI.unlikeWork(id);
      } else {
        await workAPI.likeWork(id);
      }
      
      setWork({
        ...work,
        is_liked: !work.is_liked,
        like_count: work.like_count + (work.is_liked ? -1 : 1)
      });
    } catch (error) {
      console.error('点赞失败', error);
    }
  };

  const handleCollect = async () => {
    if (!accessToken) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    try {
      if (work.is_collected) {
        await workAPI.uncollectWork(id);
      } else {
        await workAPI.collectWork(id);
      }
      
      setWork({
        ...work,
        is_collected: !work.is_collected
      });
      message.success(work.is_collected ? '已取消收藏' : '收藏成功');
    } catch (error) {
      console.error('收藏失败', error);
    }
  };

  const handleComment = async () => {
    if (!accessToken) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    if (!commentText.trim()) {
      message.warning('请输入评论内容');
      return;
    }

    setCommenting(true);
    try {
      await commentAPI.createComment({
        workId: id,
        content: commentText
      });
      
      message.success('评论成功');
      setCommentText('');
      loadComments();
      
      setWork({
        ...work,
        comment_count: work.comment_count + 1
      });
    } catch (error) {
      console.error('评论失败', error);
    } finally {
      setCommenting(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后将无法恢复，确定要删除这个作品吗？',
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setDeleting(true);
        try {
          await workAPI.deleteWork(id);
          message.success('删除成功');
          navigate('/');
        } catch (error) {
          console.error('删除失败', error);
          message.error('删除失败');
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  const handleCommentAreaClick = () => {
    if (!accessToken) {
      setLoginModalVisible(true);
    }
  };

  const handleLoginModalOk = () => {
    setLoginModalVisible(false);
    navigate('/login');
  };

  const handleAIAnalysis = async () => {
    if (!accessToken) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    setAiAnalyzing(true);
    try {
      // 构建作品描述
      let description = `标题：${work.title || '无标题'}\n`;
      if (work.description) {
        description += `描述：${work.description}\n`;
      }
      if (work.camera) {
        description += `相机：${work.camera}\n`;
      }
      if (work.location) {
        description += `地点：${work.location}\n`;
      }
      description += `图片数量：${work.images.length}张`;

      const response = await api.post('/ai/analyze-work', {
        workId: work.id,
        description
      });

      setAiAnalysis(response.data.analysis);
      message.success('AI点评生成成功！');
    } catch (error) {
      console.error('AI点评失败:', error);
      const errorMsg = error.response?.data?.message || error.message || 'AI点评失败';
      message.error(errorMsg);
      
      if (error.response?.data?.code === 50000) {
        message.warning('请确认千问API密钥已配置', 5);
      }
    } finally {
      setAiAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (!work) {
    return null;
  }

  return (
    <div className="work-detail-container">
      <div className="work-detail-content">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
          style={{ marginBottom: 16, fontSize: 16 }}
        >
          返回首页
        </Button>
        <Card>
          <div className="work-images">
            <Image.PreviewGroup>
              {work.images.map((img, index) => (
                <Image key={index} src={img} alt={work.title} />
              ))}
            </Image.PreviewGroup>
          </div>

          <div className="work-info">
            <div className="work-header">
              <Avatar 
                size={48}
                src={work.avatar}
                onClick={() => navigate(`/profile/${work.user_id}`)}
                style={{ cursor: 'pointer' }}
              />
              <div className="work-author">
                <Text strong onClick={() => navigate(`/profile/${work.user_id}`)} style={{ cursor: 'pointer' }}>
                  {work.nickname}
                </Text>
                <Text type="secondary">{dayjs(work.created_at).format('YYYY-MM-DD HH:mm')}</Text>
              </div>
              {currentUser && (currentUser.id === work.user_id || currentUser.role === 'admin' || currentUser.role === 'editor') && (
                <Dropdown
                  menu={{
                    items: [
                      // 作品所有者、editor和admin可以编辑
                      {
                        key: 'edit',
                        label: '编辑作品',
                        icon: <EditOutlined />,
                        onClick: () => navigate(`/work/${id}/edit`)
                      },
                      // 只有作品所有者和admin可以删除
                      ...(currentUser.id === work.user_id || currentUser.role === 'admin' ? [{
                        key: 'delete',
                        label: '删除作品',
                        icon: <DeleteOutlined />,
                        danger: true,
                        onClick: handleDelete
                      }] : [])
                    ]
                  }}
                  placement="bottomRight"
                >
                  <Button 
                    type="text" 
                    icon={<MoreOutlined />} 
                    loading={deleting}
                    style={{ marginLeft: 'auto' }}
                  />
                </Dropdown>
              )}
            </div>

            <Title level={3}>{work.title || '无标题'}</Title>
            
            {work.description && (
              <Paragraph>{work.description}</Paragraph>
            )}

            {/* 标签展示 */}
            {work.tags && work.tags.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Space size={[0, 8]} wrap>
                  <TagOutlined style={{ color: '#1890ff', fontSize: 16 }} />
                  {work.tags.map((tag, index) => (
                    <Tag 
                      key={index} 
                      color="blue"
                      style={{ 
                        fontSize: '14px',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate(`/search?keyword=${encodeURIComponent(tag)}`)}
                    >
                      {tag}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}

            <div className="work-meta">
              {work.location && <Text type="secondary">📍 {work.location}</Text>}
              {work.camera && <Text type="secondary">📷 {work.camera}</Text>}
            </div>

            <div className="work-actions">
              <Space size="large">
                <Button 
                  type={work.is_liked ? 'primary' : 'default'}
                  icon={work.is_liked ? <HeartFilled /> : <HeartOutlined />}
                  onClick={handleLike}
                >
                  {work.like_count || 0}
                </Button>
                
                <Button icon={<MessageOutlined />}>
                  {work.comment_count || 0}
                </Button>
                
                <Button 
                  type={work.is_collected ? 'primary' : 'default'}
                  icon={work.is_collected ? <StarFilled /> : <StarOutlined />}
                  onClick={handleCollect}
                >
                  收藏
                </Button>
                
                <Text type="secondary">
                  <EyeOutlined /> {work.view_count || 0}
                </Text>
              </Space>
            </div>

            <Divider />

            {/* AI点评区域 */}
            <div className="ai-analysis-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>
                  <RobotOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  AI专业点评
                </Title>
                {!aiAnalysis && (
                  <Button 
                    type="primary"
                    icon={<BulbOutlined />}
                    onClick={handleAIAnalysis}
                    loading={aiAnalyzing}
                  >
                    {aiAnalyzing ? '分析中...' : '获取AI点评'}
                  </Button>
                )}
              </div>

              {aiAnalysis ? (
                <Card className="ai-analysis-card" style={{ background: '#f6f8fa' }}>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                    {aiAnalysis}
                  </div>
                  <Divider style={{ margin: '16px 0' }} />
                  <div style={{ textAlign: 'center' }}>
                    <Button 
                      size="small"
                      onClick={() => setAiAnalysis(null)}
                      style={{ marginRight: 8 }}
                    >
                      隐藏AI点评
                    </Button>
                    <Button 
                      type="primary"
                      size="small"
                      icon={<BulbOutlined />}
                      onClick={handleAIAnalysis}
                      loading={aiAnalyzing}
                    >
                      重新分析
                    </Button>
                  </div>
                </Card>
              ) : (
                <Alert
                  message="专业摄影AI分析"
                  description="点击按钮，AI将从构图、用光、色彩等维度对作品进行专业点评，并提供改进建议。"
                  type="info"
                  showIcon
                  icon={<RobotOutlined />}
                  style={{ marginBottom: 16 }}
                />
              )}
            </div>

            <Divider />

            <div className="work-comments">
              <Title level={4}>评论 ({comments.length})</Title>
              
              <div className="comment-input" onClick={handleCommentAreaClick}>
                {accessToken ? (
                  <>
                    <TextArea
                      rows={3}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="写下你的评论..."
                      maxLength={500}
                    />
                    <Button 
                      type="primary" 
                      onClick={handleComment}
                      loading={commenting}
                      style={{ marginTop: 8 }}
                    >
                      发表评论
                    </Button>
                  </>
                ) : (
                  <div 
                    style={{
                      padding: '20px',
                      border: '1px dashed #d9d9d9',
                      borderRadius: '8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      color: '#999'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#1890ff';
                      e.currentTarget.style.color = '#1890ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#d9d9d9';
                      e.currentTarget.style.color = '#999';
                    }}
                  >
                    <MessageOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                    <div>点击登录后发表评论</div>
                  </div>
                )}
              </div>

              <List
                dataSource={comments}
                renderItem={(comment) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar src={comment.avatar} />}
                      title={comment.nickname}
                      description={
                        <div>
                          <div>{comment.content}</div>
                          <Text type="secondary">
                            {dayjs(comment.created_at).fromNow()}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          </div>
        </Card>

        <Modal
          title="需要登录"
          open={loginModalVisible}
          onOk={handleLoginModalOk}
          onCancel={() => setLoginModalVisible(false)}
          okText="去登录"
          cancelText="取消"
        >
          <p>您需要登录后才能发表评论</p>
        </Modal>
      </div>
    </div>
  );
};

export default WorkDetail;
