import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Button, Tag, Rate, Tabs, Image, Modal, Form, 
  Input, InputNumber, DatePicker, message, Spin, Avatar, Divider, Alert 
} from 'antd';
import {
  EnvironmentOutlined, ClockCircleOutlined, DollarOutlined,
  CameraOutlined, UserOutlined, HeartOutlined, StarOutlined,
  CheckCircleOutlined, RobotOutlined, BulbOutlined
} from '@ant-design/icons';
import api from '../utils/api';
import { useUserStore } from '../store';
import './LocationDetail.css';

const { TextArea } = Input;

function LocationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [aiAdvice, setAiAdvice] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchLocationDetail();
  }, [id]);

  const fetchLocationDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/locations/${id}`);
      setLocation(response.data);
    } catch (error) {
      message.error('获取地点详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async (values) => {
    if (!accessToken) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    try {
      await api.post(`/locations/${id}/checkin`, {
        content: values.content,
        rating: values.rating,
        visit_date: values.visit_date?.format('YYYY-MM-DD'),
        weather: values.weather
      });
      message.success('打卡成功！');
      setCheckinModalVisible(false);
      form.resetFields();
      fetchLocationDetail();
    } catch (error) {
      message.error('打卡失败');
    }
  };

  const getBestTimeText = (bestTime) => {
    const timeMap = {
      sunrise: '日出',
      sunset: '日落',
      night: '夜景',
      star: '星空'
    };
    if (!bestTime) return [];
    return bestTime.split(',').map(t => ({ text: timeMap[t] || t, value: t }));
  };

  const handleAIAdvice = async () => {
    if (!accessToken) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    setAiLoading(true);
    try {
      const response = await api.post('/ai/location-advice', {
        locationName: location.name,
        address: location.address,
        category: location.category,
        description: location.description,
        latitude: location.latitude,
        longitude: location.longitude
      });

      setAiAdvice(response.data.advice);
      message.success('AI拍摄建议生成成功！');
    } catch (error) {
      console.error('AI推荐失败:', error);
      const errorMsg = error.response?.data?.message || error.message || 'AI推荐失败';
      message.error(errorMsg);
      
      if (error.response?.data?.code === 50000) {
        message.warning('请确认千问API密钥已配置', 5);
      }
    } finally {
      setAiLoading(false);
    }
  };

  if (loading || !location) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'info',
      label: '地点信息',
      children: (
        <div className="location-detail-info">
          <div className="info-section">
            <h3>📝 地点介绍</h3>
            <p>{location.description}</p>
          </div>

          <div className="info-section">
            <h3>📸 拍摄建议</h3>
            <p>{location.tips}</p>
          </div>

          {location.recommended_params && (
            <div className="info-section">
              <h3>⚙️ 推荐参数</h3>
              <div className="params-grid">
                {location.recommended_params.aperture && (
                  <div className="param-item">
                    <span className="param-label">光圈:</span>
                    <span className="param-value">{location.recommended_params.aperture}</span>
                  </div>
                )}
                {location.recommended_params.shutter_speed && (
                  <div className="param-item">
                    <span className="param-label">快门:</span>
                    <span className="param-value">{location.recommended_params.shutter_speed}</span>
                  </div>
                )}
                {location.recommended_params.iso && (
                  <div className="param-item">
                    <span className="param-label">ISO:</span>
                    <span className="param-value">{location.recommended_params.iso}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="info-section">
            <h3>📍 基本信息</h3>
            <div className="basic-info">
              <div className="info-row">
                <EnvironmentOutlined /> 
                <span>{location.address}</span>
              </div>
              <div className="info-row">
                <ClockCircleOutlined /> 
                <span>开放时间: {location.opening_hours}</span>
              </div>
              <div className="info-row">
                <DollarOutlined /> 
                <span>门票价格: {location.ticket_price}</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'ai',
      label: (
        <span>
          <RobotOutlined /> AI拍摄建议
        </span>
      ),
      children: (
        <div className="location-ai-advice">
          <div style={{ marginBottom: 16 }}>
            {!aiAdvice && (
              <Alert
                message="专业摄影AI分析"
                description="点击按钮，AI将从最佳拍摄时间、机位推荐、参数设置、构图技巧等方面为您提供专业的拍摄建议。"
                type="info"
                showIcon
                icon={<RobotOutlined />}
              />
            )}
          </div>

          {!aiAdvice && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Button 
                type="primary" 
                size="large"
                icon={<BulbOutlined />}
                onClick={handleAIAdvice}
                loading={aiLoading}
              >
                {aiLoading ? '分析中...' : '获取AI拍摄建议'}
              </Button>
            </div>
          )}

          {aiAdvice && (
            <Card 
              className="ai-advice-card" 
              style={{ background: '#f6f8fa' }}
              title={(
                <span>
                  <RobotOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                  AI专业拍摄建议
                </span>
              )}
            >
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                {aiAdvice}
              </div>
              <Divider style={{ margin: '16px 0' }} />
              <div style={{ textAlign: 'center' }}>
                <Button 
                  size="small"
                  onClick={() => setAiAdvice(null)}
                  style={{ marginRight: 8 }}
                >
                  隐藏AI建议
                </Button>
                <Button 
                  type="primary"
                  size="small"
                  icon={<BulbOutlined />}
                  onClick={handleAIAdvice}
                  loading={aiLoading}
                >
                  重新分析
                </Button>
              </div>
            </Card>
          )}
        </div>
      )
    },
    {
      key: 'works',
      label: `精选作品 (${location.featured_works?.length || 0})`,
      children: (
        <div className="location-works">
          <div className="works-grid">
            {location.featured_works?.map(work => (
              <Card
                key={work.id}
                hoverable
                cover={<img alt={work.title} src={JSON.parse(work.images)[0]} />}
                onClick={() => navigate(`/work/${work.id}`)}
              >
                <Card.Meta
                  avatar={<Avatar src={work.avatar}>{work.nickname?.[0]}</Avatar>}
                  title={work.title || '无标题'}
                  description={
                    <div className="work-stats">
                      <span><HeartOutlined /> {work.like_count}</span>
                    </div>
                  }
                />
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      key: 'guides',
      label: `拍摄攻略 (${location.guides?.length || 0})`,
      children: (
        <div className="location-guides">
          {location.guides?.map(guide => (
            <Card 
              key={guide.id} 
              className="guide-card"
              onClick={() => navigate(`/location/guide/${guide.id}`)}
            >
              <Card.Meta
                avatar={<Avatar src={guide.author_avatar}>{guide.author_name?.[0]}</Avatar>}
                title={guide.title}
                description={
                  <div>
                    <div className="guide-stats">
                      <span><HeartOutlined /> {guide.like_count}</span>
                      <span><StarOutlined /> {guide.collect_count}</span>
                      <span>👁 {guide.view_count}</span>
                    </div>
                  </div>
                }
              />
            </Card>
          ))}
        </div>
      )
    },
    {
      key: 'checkins',
      label: `打卡记录 (${location.recent_checkins?.length || 0})`,
      children: (
        <div className="location-checkins">
          {location.recent_checkins?.map(checkin => (
            <Card key={checkin.id} className="checkin-card">
              <div className="checkin-header">
                <Avatar src={checkin.avatar}>{checkin.nickname?.[0]}</Avatar>
                <div className="checkin-user-info">
                  <span className="user-name">{checkin.nickname}</span>
                  {checkin.rating && <Rate disabled value={checkin.rating} style={{ fontSize: 12 }} />}
                </div>
                <span className="checkin-date">{checkin.visit_date}</span>
              </div>
              {checkin.content && (
                <div className="checkin-content">{checkin.content}</div>
              )}
            </Card>
          ))}
        </div>
      )
    }
  ];

  return (
    <div className="location-detail-container">
      <div className="location-detail-header">
        <div 
          className="location-cover-large" 
          style={{ backgroundImage: `url(${location.cover_image})` }}
        >
          <div className="cover-overlay">
            <h1>{location.name}</h1>
            <div className="location-meta">
              <Rate disabled value={parseFloat(location.rating) || 0} />
              <span className="rating-text">{parseFloat(location.rating)?.toFixed(1) || '暂无评分'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="location-detail-content">
        <div className="location-actions">
          <div className="location-tags">
            {getBestTimeText(location.best_time).map(time => (
              <Tag key={time.value} color="orange">{time.text}</Tag>
            ))}
          </div>
          <div className="action-buttons">
            <Button 
              type="primary" 
              icon={<CheckCircleOutlined />}
              onClick={() => setCheckinModalVisible(true)}
            >
              打卡
            </Button>
            <Button icon={<CameraOutlined />}>查看作品</Button>
          </div>
        </div>

        <div className="location-stats-bar">
          <div className="stat-item">
            <UserOutlined />
            <span>{location.checkin_count || 0} 次打卡</span>
          </div>
          <div className="stat-item">
            <CameraOutlined />
            <span>{location.work_count || 0} 作品</span>
          </div>
        </div>

        <Divider />

        <Tabs items={tabItems} />
      </div>

      <Modal
        title="打卡记录"
        open={checkinModalVisible}
        onCancel={() => setCheckinModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleCheckin} layout="vertical">
          <Form.Item
            name="rating"
            label="评分"
            rules={[{ required: true, message: '请为这个地点评分' }]}
          >
            <Rate />
          </Form.Item>

          <Form.Item
            name="content"
            label="打卡心得"
            rules={[{ required: true, message: '请分享你的拍摄心得' }]}
          >
            <TextArea rows={4} placeholder="分享你在这里的拍摄体验..." />
          </Form.Item>

          <Form.Item name="visit_date" label="访问日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="weather" label="天气">
            <Input placeholder="例如：晴天、多云、阴天" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交打卡
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default LocationDetail;
