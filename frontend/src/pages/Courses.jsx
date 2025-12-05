import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tabs, Select, Tag, Rate, Progress, message, Spin } from 'antd';
import { 
  PlayCircleOutlined, FileTextOutlined, ClockCircleOutlined, 
  UserOutlined, StarOutlined, TrophyOutlined 
} from '@ant-design/icons';
import api from '../utils/api';
import './Courses.css';

function Courses() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [tips, setTips] = useState([]);
  const [activeTab, setActiveTab] = useState('courses');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');

  useEffect(() => {
    if (activeTab === 'courses') {
      fetchCourses();
    } else if (activeTab === 'tips') {
      fetchTips();
    }
  }, [activeTab, category, difficulty]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = {
        category: category || undefined,
        difficulty: difficulty || undefined
      };
      const response = await api.get('/courses', { params });
      setCourses(response.data.list);
    } catch (error) {
      message.error('获取课程列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchTips = async () => {
    try {
      setLoading(true);
      const params = {
        category: category || undefined,
        difficulty: difficulty || undefined
      };
      const response = await api.get('/courses/tips/list', { params });
      setTips(response.data.list);
    } catch (error) {
      message.error('获取技巧列表失败');
    } finally {
      setLoading(false);
    }
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

  const renderCourseCard = (course) => (
    <Card
      key={course.id}
      hoverable
      className="course-card"
      cover={
        <div className="course-cover">
          <img alt={course.title} src={course.cover_image} />
          <div className="course-overlay">
            <Tag color={course.is_free ? 'green' : 'gold'}>
              {course.is_free ? '免费' : `¥${course.price}`}
            </Tag>
            <Tag color={getDifficultyColor(course.difficulty)}>
              {getDifficultyText(course.difficulty)}
            </Tag>
          </div>
          <div className="course-type-badge">
            {course.type === 'video' ? <PlayCircleOutlined /> : <FileTextOutlined />}
          </div>
        </div>
      }
      onClick={() => navigate(`/course/${course.id}`)}
    >
      <Card.Meta
        title={course.title}
        description={
          <div className="course-info">
            <div className="course-description">{course.description}</div>
            <div className="course-meta">
              <div className="meta-row">
                <Rate disabled value={parseFloat(course.rating) || 0} style={{ fontSize: 14 }} />
                <span className="rating-text">{parseFloat(course.rating)?.toFixed(1) || '暂无评分'}</span>
              </div>
              <div className="meta-row">
                <span><UserOutlined /> {course.student_count || 0} 人学习</span>
                <span><ClockCircleOutlined /> {course.duration} 分钟</span>
              </div>
              <div className="instructor">
                讲师: {course.instructor_name || '未知'}
              </div>
            </div>
          </div>
        }
      />
    </Card>
  );

  const renderTipCard = (tip) => (
    <Card
      key={tip.id}
      hoverable
      className="tip-card"
      cover={<img alt={tip.title} src={tip.cover_image} />}
      onClick={() => navigate(`/tip/${tip.id}`)}
    >
      <Card.Meta
        title={
          <div className="tip-title">
            <span>{tip.title}</span>
            <Tag color={getDifficultyColor(tip.difficulty)}>
              {getDifficultyText(tip.difficulty)}
            </Tag>
          </div>
        }
        description={
          <div className="tip-info">
            <div className="tip-tags">
              {tip.category && <Tag>{getCategoryText(tip.category)}</Tag>}
            </div>
            <div className="tip-stats">
              <span><ClockCircleOutlined /> {tip.reading_time} 分钟</span>
              <span><StarOutlined /> {tip.like_count || 0}</span>
              <span><TrophyOutlined /> {tip.practice_count || 0} 人实践</span>
            </div>
          </div>
        }
      />
    </Card>
  );

  const tabItems = [
    {
      key: 'courses',
      label: '📚 视频课程',
      children: (
        <div className="courses-list">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : (
            <div className="courses-grid">
              {courses.map(renderCourseCard)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'tips',
      label: '💡 技巧库',
      children: (
        <div className="tips-list">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : (
            <div className="tips-grid">
              {tips.map(renderTipCard)}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="courses-container">
      <div className="courses-header">
        <h1>📖 摄影学院</h1>
        <p>系统学习摄影知识，从入门到精通</p>
      </div>

      <div className="courses-filters">
        <div className="filter-group">
          <Select
            placeholder="选择分类"
            style={{ width: 150 }}
            allowClear
            value={category || undefined}
            onChange={setCategory}
          >
            {activeTab === 'courses' ? (
              <>
                <Select.Option value="shooting">拍摄技巧</Select.Option>
                <Select.Option value="post">后期处理</Select.Option>
                <Select.Option value="equipment">器材知识</Select.Option>
              </>
            ) : (
              <>
                <Select.Option value="portrait">人像摄影</Select.Option>
                <Select.Option value="landscape">风光摄影</Select.Option>
                <Select.Option value="street">街拍技巧</Select.Option>
                <Select.Option value="architecture">建筑摄影</Select.Option>
              </>
            )}
          </Select>

          <Select
            placeholder="选择难度"
            style={{ width: 150 }}
            allowClear
            value={difficulty || undefined}
            onChange={setDifficulty}
          >
            <Select.Option value="beginner">入门</Select.Option>
            <Select.Option value="intermediate">进阶</Select.Option>
            <Select.Option value="advanced">高级</Select.Option>
          </Select>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        items={tabItems}
        onChange={setActiveTab}
        className="courses-tabs"
      />
    </div>
  );
}

export default Courses;
