import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tag, Avatar, Button, Progress, List, message, Spin, Empty } from 'antd';
import { 
  PlayCircleOutlined, ClockCircleOutlined, UserOutlined, 
  StarOutlined, ArrowLeftOutlined, CheckCircleOutlined,
  LockOutlined
} from '@ant-design/icons';
import { useUserStore } from '../store';
import api from '../utils/api';
import './CourseDetail.css';

function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState(null);

  useEffect(() => {
    fetchCourseDetail();
  }, [id]);

  const fetchCourseDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/courses/${id}`);
      setCourse(response.data);
    } catch (error) {
      message.error('获取课程详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChapterClick = (chapter) => {
    if (!accessToken) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    // 检查是否可以观看
    if (!chapter.is_free && !course.is_free) {
      message.warning('该章节需要购买课程后才能观看');
      return;
    }

    // 这里应该跳转到章节播放页面或打开播放器
    message.info('章节播放功能开发中...');
  };

  const handleEnroll = async () => {
    if (!accessToken) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    if (!course.is_free) {
      message.info('付费课程购买功能开发中...');
      return;
    }

    try {
      // 这里应该调用报名接口
      message.success('报名成功！开始学习吧');
      fetchCourseDetail(); // 刷新数据
    } catch (error) {
      message.error('报名失败');
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
      equipment: '器材知识'
    };
    return categoryMap[cat] || cat;
  };

  if (loading || !course) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  const userProgress = course.user_progress?.progress || 0;
  const isEnrolled = !!course.user_progress;

  return (
    <div className="course-detail-container">
      <div className="course-detail-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/courses')}
        >
          返回
        </Button>
      </div>

      <div className="course-detail-content">
        <div className="course-main">
          <Card className="course-info-card">
            <div className="course-cover-section">
              <img src={course.cover_image} alt={course.title} className="course-cover-large" />
              <div className="course-overlay-info">
                <Tag color={course.is_free ? 'green' : 'gold'} className="price-tag">
                  {course.is_free ? '免费课程' : `¥${parseFloat(course.price).toFixed(2)}`}
                </Tag>
              </div>
            </div>

            <div className="course-header-info">
              <h1>{course.title}</h1>
              <div className="course-tags">
                <Tag color={getDifficultyColor(course.difficulty)}>
                  {getDifficultyText(course.difficulty)}
                </Tag>
                <Tag color="blue">{getCategoryText(course.category)}</Tag>
                <Tag icon={<PlayCircleOutlined />}>
                  {course.type === 'video' ? '视频课程' : '图文课程'}
                </Tag>
              </div>

              <p className="course-description">{course.description}</p>

              <div className="course-meta-info">
                <div className="instructor-info">
                  <Avatar src={course.instructor_avatar} icon={<UserOutlined />} size={40} />
                  <div className="instructor-details">
                    <span className="instructor-label">讲师</span>
                    <span className="instructor-name">{course.instructor_name}</span>
                  </div>
                </div>

                <div className="course-stats">
                  <div className="stat-item">
                    <UserOutlined />
                    <span>{course.student_count || 0} 人学习</span>
                  </div>
                  <div className="stat-item">
                    <ClockCircleOutlined />
                    <span>{course.duration} 分钟</span>
                  </div>
                  <div className="stat-item">
                    <StarOutlined />
                    <span>{parseFloat(course.rating)?.toFixed(1) || '暂无'} 分</span>
                  </div>
                </div>
              </div>

              {isEnrolled && (
                <div className="progress-section">
                  <div className="progress-header">
                    <span>学习进度</span>
                    <span className="progress-text">{userProgress}%</span>
                  </div>
                  <Progress percent={userProgress} status="active" />
                </div>
              )}

              {!isEnrolled && (
                <div className="enroll-section">
                  <Button 
                    type="primary" 
                    size="large" 
                    onClick={handleEnroll}
                    block
                  >
                    {course.is_free ? '免费学习' : `购买课程 ¥${parseFloat(course.price).toFixed(2)}`}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card title="课程章节" className="chapters-card">
            {course.chapters && course.chapters.length > 0 ? (
              <List
                dataSource={course.chapters}
                renderItem={(chapter, index) => {
                  const isCompleted = course.user_progress?.completed_chapters?.includes(chapter.id);
                  const canWatch = chapter.is_free || course.is_free || isEnrolled;

                  return (
                    <List.Item
                      className={`chapter-item ${canWatch ? 'can-watch' : 'locked'}`}
                      onClick={() => canWatch && handleChapterClick(chapter)}
                    >
                      <div className="chapter-info">
                        <div className="chapter-number">{index + 1}</div>
                        <div className="chapter-details">
                          <div className="chapter-title">
                            {chapter.title}
                            {chapter.is_free && <Tag color="green" style={{ marginLeft: 8 }}>试看</Tag>}
                          </div>
                          {chapter.description && (
                            <div className="chapter-description">{chapter.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="chapter-meta">
                        <span className="chapter-duration">
                          <ClockCircleOutlined /> {chapter.duration} 分钟
                        </span>
                        {isCompleted ? (
                          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                        ) : !canWatch ? (
                          <LockOutlined style={{ color: '#999', fontSize: 20 }} />
                        ) : (
                          <PlayCircleOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                        )}
                      </div>
                    </List.Item>
                  );
                }}
              />
            ) : (
              <Empty description="暂无章节内容" />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CourseDetail;
