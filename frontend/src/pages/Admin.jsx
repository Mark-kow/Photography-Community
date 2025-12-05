import { useState, useEffect } from 'react';
import { Layout, Menu, Card, Statistic, Table, Button, Input, Select, Space, Tag, Modal, Form, message, Popconfirm } from 'antd';
import {
  DashboardOutlined,
  EnvironmentOutlined,
  UserOutlined,
  FileImageOutlined,
  LogoutOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store';
import api from '../utils/api';
import './Admin.css';

const { Header, Sider, Content } = Layout;
const { Option } = Select;

function Admin() {
  const navigate = useNavigate();
  const { accessToken, logout, user: currentUser } = useUserStore();
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [locations, setLocations] = useState([]);
  const [courses, setCourses] = useState([]);
  const [tips, setTips] = useState([]);
  const [activities, setActivities] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [lenses, setLenses] = useState([]);
  const [users, setUsers] = useState([]);
  const [works, setWorks] = useState([]);
  const [comments, setComments] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({ keyword: '', category: '', city: '' });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [chapterModalVisible, setChapterModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingTip, setEditingTip] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [editingCamera, setEditingCamera] = useState(null);
  const [editingLens, setEditingLens] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingWork, setEditingWork] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editingChapter, setEditingChapter] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [form] = Form.useForm();
  const [chapterForm] = Form.useForm();

  // 获取当前用户角色
  const userRole = currentUser?.role || 'user';
  const isAdmin = userRole === 'admin';
  const isEditor = userRole === 'editor';
  const canAccessAdmin = isAdmin || isEditor;

  useEffect(() => {
    if (!accessToken) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    // 检查权限
    if (!canAccessAdmin) {
      message.error('无权访问管理后台');
      navigate('/');
      return;
    }
    fetchDashboardStats();
  }, [accessToken, canAccessAdmin]);

  useEffect(() => {
    if (selectedMenu === 'locations') {
      fetchLocations();
    } else if (selectedMenu === 'courses') {
      fetchCourses();
    } else if (selectedMenu === 'tips') {
      fetchTips();
    } else if (selectedMenu === 'activities') {
      fetchActivities();
    } else if (selectedMenu === 'challenges') {
      fetchChallenges();
    } else if (selectedMenu === 'cameras') {
      fetchCameras();
    } else if (selectedMenu === 'lenses') {
      fetchLenses();
    } else if (selectedMenu === 'users') {
      fetchUsers();
    } else if (selectedMenu === 'works') {
      fetchWorks();
    } else if (selectedMenu === 'comments') {
      fetchComments();
    }
  }, [selectedMenu, pagination.current, filters]);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/admin/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/locations', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
          ...filters
        }
      });
      setLocations(response.data.items || []);
      setPagination({
        ...pagination,
        total: response.data.pagination?.total || 0
      });
    } catch (error) {
      message.error('获取地点列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/courses', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
          ...filters
        }
      });
      setCourses(response.data.items || []);
      setPagination({
        ...pagination,
        total: response.data.pagination?.total || 0
      });
    } catch (error) {
      message.error('获取课程列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchTips = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/tips', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
          ...filters
        }
      });
      setTips(response.data.items || []);
      setPagination({
        ...pagination,
        total: response.data.pagination?.total || 0
      });
    } catch (error) {
      message.error('获取技巧列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/activities', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
          ...filters
        }
      });
      setActivities(response.data.items || []);
      setPagination({
        ...pagination,
        total: response.data.pagination?.total || 0
      });
    } catch (error) {
      message.error('获取活动列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/challenges', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
          ...filters
        }
      });
      setChallenges(response.data.items || []);
      setPagination({
        ...pagination,
        total: response.data.pagination?.total || 0
      });
    } catch (error) {
      message.error('获取挑战赛列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCameras = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/cameras', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
          ...filters
        }
      });
      setCameras(response.data.items || []);
      setPagination({
        ...pagination,
        total: response.data.pagination?.total || 0
      });
    } catch (error) {
      message.error('获取相机列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchLenses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/lenses', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
          ...filters
        }
      });
      setLenses(response.data.items || []);
      setPagination({
        ...pagination,
        total: response.data.pagination?.total || 0
      });
    } catch (error) {
      message.error('获取镜头列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
          ...filters
        }
      });
      setUsers(response.data.items || []);
      setPagination({
        ...pagination,
        total: response.data.pagination?.total || 0
      });
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/works', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
          ...filters
        }
      });
      setWorks(response.data.items || []);
      setPagination({
        ...pagination,
        total: response.data.pagination?.total || 0
      });
    } catch (error) {
      message.error('获取作品列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/comments', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
          ...filters
        }
      });
      setComments(response.data.items || []);
      setPagination({
        ...pagination,
        total: response.data.pagination?.total || 0
      });
    } catch (error) {
      message.error('获取评论列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleEdit = (record) => {
    if (selectedMenu === 'locations') {
      setEditingLocation(record);
      form.setFieldsValue({
        ...record,
        images: record.images ? JSON.parse(record.images) : []
      });
    }
    setEditModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/locations/${id}`);
      message.success('删除成功');
      fetchLocations();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (selectedMenu === 'locations') {
        if (editingLocation) {
          await api.put(`/admin/locations/${editingLocation.id}`, values);
          message.success('更新成功');
        } else {
          await api.post('/admin/locations', values);
          message.success('创建成功');
        }
        fetchLocations();
      } else if (selectedMenu === 'courses') {
        if (editingCourse) {
          await api.put(`/admin/courses/${editingCourse.id}`, values);
          message.success('更新成功');
        } else {
          await api.post('/admin/courses', values);
          message.success('创建成功');
        }
        fetchCourses();
      } else if (selectedMenu === 'tips') {
        if (editingTip) {
          await api.put(`/admin/tips/${editingTip.id}`, values);
          message.success('更新成功');
        } else {
          await api.post('/admin/tips', values);
          message.success('创建成功');
        }
        fetchTips();
      } else if (selectedMenu === 'activities') {
        if (editingActivity) {
          await api.put(`/admin/activities/${editingActivity.id}`, values);
          message.success('更新成功');
        } else {
          await api.post('/admin/activities', values);
          message.success('创建成功');
        }
        fetchActivities();
      } else if (selectedMenu === 'challenges') {
        if (editingChallenge) {
          await api.put(`/admin/challenges/${editingChallenge.id}`, values);
          message.success('更新成功');
        } else {
          await api.post('/admin/challenges', values);
          message.success('创建成功');
        }
        fetchChallenges();
      } else if (selectedMenu === 'cameras') {
        if (editingCamera) {
          await api.put(`/admin/cameras/${editingCamera.id}`, values);
          message.success('更新成功');
        } else {
          await api.post('/admin/cameras', values);
          message.success('创建成功');
        }
        fetchCameras();
      } else if (selectedMenu === 'lenses') {
        if (editingLens) {
          await api.put(`/admin/lenses/${editingLens.id}`, values);
          message.success('更新成功');
        } else {
          await api.post('/admin/lenses', values);
          message.success('创建成功');
        }
        fetchLenses();
      } else if (selectedMenu === 'users') {
        if (editingUser) {
          await api.put(`/admin/users/${editingUser.id}`, values);
          message.success('更新成功');
        }
        fetchUsers();
      }
      
      setEditModalVisible(false);
      setEditingLocation(null);
      setEditingCourse(null);
      setEditingTip(null);
      setEditingActivity(null);
      setEditingChallenge(null);
      setEditingCamera(null);
      setEditingLens(null);
      setEditingUser(null);
      setEditingWork(null);
      setEditingComment(null);
      form.resetFields();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleModalCancel = () => {
    setEditModalVisible(false);
    setEditingLocation(null);
    setEditingCourse(null);
    setEditingTip(null);
    setEditingActivity(null);
    setEditingChallenge(null);
    setEditingCamera(null);
    setEditingLens(null);
    setEditingUser(null);
    setEditingWork(null);
    setEditingComment(null);
    form.resetFields();
  };

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    fetchLocations();
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '封面',
      dataIndex: 'cover_image',
      width: 100,
      render: (text) => text ? <img src={text} alt="cover" className="location-cover" /> : '-'
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '地址',
      dataIndex: 'address',
      width: 200,
      ellipsis: true,
    },
    {
      title: '城市',
      dataIndex: 'city',
      width: 100,
    },
    {
      title: '类型',
      dataIndex: 'category',
      width: 120,
      render: (text) => {
        const categoryMap = {
          'natural': { text: '自然风光', color: 'green' },
          'architecture': { text: '建筑', color: 'blue' },
          'modern': { text: '现代建筑', color: 'purple' },
          'park': { text: '公园', color: 'cyan' }
        };
        const cat = categoryMap[text] || { text, color: 'default' };
        return <Tag color={cat.color}>{cat.text}</Tag>;
      }
    },
    {
      title: '打卡数',
      dataIndex: 'checkin_count',
      width: 100,
      sorter: (a, b) => a.checkin_count - b.checkin_count,
    },
    {
      title: '作品数',
      dataIndex: 'work_count',
      width: 100,
      sorter: (a, b) => a.work_count - b.work_count,
    },
    {
      title: '评分',
      dataIndex: 'rating',
      width: 100,
      render: (text) => text ? `${text} ⭐` : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (text) => (
        <Tag color={text === 1 ? 'success' : 'default'}>
          {text === 1 ? '正常' : '已删除'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <div className="action-buttons">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个地点吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: 'locations',
      icon: <EnvironmentOutlined />,
      label: '拍摄地管理',
    },
    {
      key: 'courses',
      icon: <FileImageOutlined />,
      label: '课程管理',
    },
    {
      key: 'tips',
      icon: <FileImageOutlined />,
      label: '技巧库管理',
    },
    {
      key: 'activities',
      icon: <FileImageOutlined />,
      label: '约拍活动管理',
    },
    {
      key: 'challenges',
      icon: <FileImageOutlined />,
      label: '挑战赛管理',
    },
    {
      key: 'cameras',
      icon: <FileImageOutlined />,
      label: '相机管理',
    },
    {
      key: 'lenses',
      icon: <FileImageOutlined />,
      label: '镜头管理',
    },
    // 用户管理仅admin可见
    ...(isAdmin ? [{
      key: 'users',
      icon: <UserOutlined />,
      label: '用户管理',
    }] : []),
    {
      key: 'works',
      icon: <FileImageOutlined />,
      label: '作品管理',
    },
    {
      key: 'comments',
      icon: <FileImageOutlined />,
      label: '评论管理',
    },
  ];

  const renderContent = () => {
    switch (selectedMenu) {
      case 'dashboard':
        return (
          <div>
            <h2>数据概览</h2>
            {stats && (
              <div className="stats-cards">
                <Card className="stat-card">
                  <div className="stat-label">总用户数</div>
                  <div className="stat-value">{stats.users?.total_users || 0}</div>
                  <div className="stat-extra">
                    本周新增: {stats.users?.new_users_week || 0}
                  </div>
                </Card>
                <Card className="stat-card">
                  <div className="stat-label">总作品数</div>
                  <div className="stat-value">{stats.works?.total_works || 0}</div>
                  <div className="stat-extra">
                    本周新增: {stats.works?.new_works_week || 0}
                  </div>
                </Card>
                <Card className="stat-card">
                  <div className="stat-label">拍摄地数</div>
                  <div className="stat-value">{stats.locations?.total_locations || 0}</div>
                  <div className="stat-extra">
                    本周新增: {stats.locations?.new_locations_week || 0}
                  </div>
                </Card>
                <Card className="stat-card">
                  <div className="stat-label">打卡总数</div>
                  <div className="stat-value">{stats.checkins?.total_checkins || 0}</div>
                </Card>
              </div>
            )}
          </div>
        );

      case 'locations':
        return (
          <div>
            <div className="page-header">
              <h2>拍摄地管理</h2>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setEditModalVisible(true)}
              >
                添加地点
              </Button>
            </div>

            <div className="filters">
              <Input
                placeholder="搜索地点名称或地址"
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                onPressEnter={handleSearch}
              />
              <Select
                placeholder="选择类型"
                style={{ width: 150 }}
                allowClear
                value={filters.category}
                onChange={(value) => setFilters({ ...filters, category: value })}
              >
                <Option value="natural">自然风光</Option>
                <Option value="architecture">建筑</Option>
                <Option value="modern">现代建筑</Option>
                <Option value="park">公园</Option>
              </Select>
              <Input
                placeholder="城市"
                style={{ width: 120 }}
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              />
              <Button type="primary" onClick={handleSearch}>
                搜索
              </Button>
              <Button onClick={() => {
                setFilters({ keyword: '', category: '', city: '' });
                setTimeout(handleSearch, 0);
              }}>
                重置
              </Button>
            </div>

            <Table
              columns={columns}
              dataSource={locations}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1500 }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: (page) => setPagination({ ...pagination, current: page }),
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
            />
          </div>
        );

      case 'courses':
        return (
          <div>
            <div className="page-header">
              <h2>课程管理</h2>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingCourse(null);
                  form.resetFields();
                  setEditModalVisible(true);
                }}
              >
                添加课程
              </Button>
            </div>

            <div className="filters">
              <Input
                placeholder="搜索课程名称"
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                onPressEnter={handleSearch}
              />
              <Select
                placeholder="选择分类"
                style={{ width: 150 }}
                allowClear
                value={filters.category}
                onChange={(value) => setFilters({ ...filters, category: value })}
              >
                <Option value="shooting">拍摄</Option>
                <Option value="post">后期</Option>
                <Option value="equipment">器材</Option>
              </Select>
              <Button type="primary" onClick={handleSearch}>搜索</Button>
              <Button onClick={() => {
                setFilters({ keyword: '', category: '' });
                setTimeout(handleSearch, 0);
              }}>重置</Button>
            </div>

            <Table
              dataSource={courses}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1200 }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: (page) => setPagination({ ...pagination, current: page }),
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              columns={[
                { title: 'ID', dataIndex: 'id', width: 80 },
                {
                  title: '封面',
                  dataIndex: 'cover_image',
                  width: 100,
                  render: (text) => text ? <img src={text} alt="cover" className="location-cover" /> : '-'
                },
                { title: '课程名称', dataIndex: 'title', width: 200 },
                {
                  title: '分类',
                  dataIndex: 'category',
                  width: 100,
                  render: (text) => {
                    const map = { shooting: '拍摄', post: '后期', equipment: '器材' };
                    return <Tag color="blue">{map[text] || text}</Tag>;
                  }
                },
                {
                  title: '难度',
                  dataIndex: 'difficulty',
                  width: 100,
                  render: (text) => {
                    const map = { beginner: '入门', intermediate: '进阶', advanced: '高级' };
                    const colors = { beginner: 'green', intermediate: 'orange', advanced: 'red' };
                    return <Tag color={colors[text]}>{map[text] || text}</Tag>;
                  }
                },
                { title: '讲师', dataIndex: 'instructor_name', width: 120 },
                { title: '章节数', dataIndex: 'chapter_count', width: 100 },
                { title: '学习人数', dataIndex: 'student_count', width: 100 },
                {
                  title: '状态',
                  dataIndex: 'status',
                  width: 100,
                  render: (text) => {
                    const map = { 0: '草稿', 1: '已发布', 2: '已下架' };
                    const colors = { 0: 'default', 1: 'success', 2: 'error' };
                    return <Tag color={colors[text]}>{map[text]}</Tag>;
                  }
                },
                {
                  title: '操作',
                  fixed: 'right',
                  width: 150,
                  render: (_, record) => (
                    <div className="action-buttons">
                      <Button type="link" size="small" icon={<EditOutlined />}
                        onClick={() => {
                          setEditingCourse(record);
                          form.setFieldsValue(record);
                          setEditModalVisible(true);
                        }}
                      >编辑</Button>
                      <Popconfirm
                        title="确定删除这个课程吗？"
                        onConfirm={async () => {
                          try {
                            await api.delete(`/admin/courses/${record.id}`);
                            message.success('删除成功');
                            fetchCourses();
                          } catch (error) {
                            message.error('删除失败');
                          }
                        }}
                      >
                        <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
                      </Popconfirm>
                    </div>
                  )
                }
              ]}
            />
          </div>
        );

      case 'tips':
        return (
          <div>
            <div className="page-header">
              <h2>技巧库管理</h2>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingTip(null);
                  form.resetFields();
                  setEditModalVisible(true);
                }}
              >
                添加技巧
              </Button>
            </div>

            <div className="filters">
              <Input
                placeholder="搜索技巧名称"
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                onPressEnter={handleSearch}
              />
              <Select
                placeholder="选择分类"
                style={{ width: 150 }}
                allowClear
                value={filters.category}
                onChange={(value) => setFilters({ ...filters, category: value })}
              >
                <Option value="portrait">人像</Option>
                <Option value="landscape">风光</Option>
                <Option value="street">街拍</Option>
                <Option value="architecture">建筑</Option>
              </Select>
              <Button type="primary" onClick={handleSearch}>搜索</Button>
              <Button onClick={() => {
                setFilters({ keyword: '', category: '' });
                setTimeout(handleSearch, 0);
              }}>重置</Button>
            </div>

            <Table
              dataSource={tips}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1200 }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: (page) => setPagination({ ...pagination, current: page }),
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              columns={[
                { title: 'ID', dataIndex: 'id', width: 80 },
                {
                  title: '封面',
                  dataIndex: 'cover_image',
                  width: 100,
                  render: (text) => text ? <img src={text} alt="cover" className="location-cover" /> : '-'
                },
                { title: '标题', dataIndex: 'title', width: 200 },
                {
                  title: '分类',
                  dataIndex: 'category',
                  width: 100,
                  render: (text) => {
                    const map = { portrait: '人像', landscape: '风光', street: '街拍', architecture: '建筑' };
                    return <Tag color="purple">{map[text] || text}</Tag>;
                  }
                },
                {
                  title: '技术类型',
                  dataIndex: 'technique_type',
                  width: 120,
                  render: (text) => {
                    const map = { exposure: '曝光', focus: '对焦', composition: '构图', lighting: '用光' };
                    return map[text] || text;
                  }
                },
                { title: '作者', dataIndex: 'author_name', width: 120 },
                { title: '点赞数', dataIndex: 'like_count', width: 100 },
                { title: '浏览量', dataIndex: 'view_count', width: 100 },
                {
                  title: '状态',
                  dataIndex: 'status',
                  width: 100,
                  render: (text) => {
                    const map = { 0: '草稿', 1: '已发布', 2: '已删除' };
                    const colors = { 0: 'default', 1: 'success', 2: 'error' };
                    return <Tag color={colors[text]}>{map[text]}</Tag>;
                  }
                },
                {
                  title: '操作',
                  fixed: 'right',
                  width: 150,
                  render: (_, record) => (
                    <div className="action-buttons">
                      <Button type="link" size="small" icon={<EditOutlined />}
                        onClick={() => {
                          setEditingTip(record);
                          form.setFieldsValue(record);
                          setEditModalVisible(true);
                        }}
                      >编辑</Button>
                      <Popconfirm
                        title="确定删除这个技巧吗？"
                        onConfirm={async () => {
                          try {
                            await api.delete(`/admin/tips/${record.id}`);
                            message.success('删除成功');
                            fetchTips();
                          } catch (error) {
                            message.error('删除失败');
                          }
                        }}
                      >
                        <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
                      </Popconfirm>
                    </div>
                  )
                }
              ]}
            />
          </div>
        );

      case 'activities':
        return (
          <div>
            <div className="page-header">
              <h2>约拍活动管理</h2>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingActivity(null);
                  form.resetFields();
                  setEditModalVisible(true);
                }}
              >
                添加活动
              </Button>
            </div>

            <div className="filters">
              <Input
                placeholder="搜索活动名称或地点"
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                onPressEnter={handleSearch}
              />
              <Select
                placeholder="选择活动类型"
                style={{ width: 150 }}
                allowClear
                value={filters.activity_type}
                onChange={(value) => setFilters({ ...filters, activity_type: value })}
              >
                <Option value="sunrise">晨拍</Option>
                <Option value="sunset">日落</Option>
                <Option value="night">夜拍</Option>
                <Option value="theme">主题拍摄</Option>
              </Select>
              <Button type="primary" onClick={handleSearch}>搜索</Button>
              <Button onClick={() => {
                setFilters({ keyword: '', activity_type: '' });
                setTimeout(handleSearch, 0);
              }}>重置</Button>
            </div>

            <Table
              dataSource={activities}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1400 }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: (page) => setPagination({ ...pagination, current: page }),
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              columns={[
                { title: 'ID', dataIndex: 'id', width: 80 },
                {
                  title: '封面',
                  dataIndex: 'cover_image',
                  width: 100,
                  render: (text) => text ? <img src={text} alt="cover" className="location-cover" /> : '-'
                },
                { title: '活动标题', dataIndex: 'title', width: 200 },
                {
                  title: '活动类型',
                  dataIndex: 'activity_type',
                  width: 100,
                  render: (text) => {
                    const map = { sunrise: '晨拍', sunset: '日落', night: '夜拍', theme: '主题拍摄' };
                    return <Tag color="blue">{map[text] || text}</Tag>;
                  }
                },
                { title: '地点', dataIndex: 'location', width: 150, ellipsis: true },
                { title: '开始时间', dataIndex: 'start_time', width: 180, render: (text) => new Date(text).toLocaleString('zh-CN') },
                { title: '创建者', dataIndex: 'creator_name', width: 120 },
                { title: '人数限制', dataIndex: 'max_participants', width: 100 },
                { title: '当前人数', dataIndex: 'current_participants', width: 100 },
                {
                  title: '状态',
                  dataIndex: 'status',
                  width: 100,
                  render: (text) => {
                    const map = { 0: '已取消', 1: '招募中', 2: '已满员', 3: '进行中', 4: '已结束' };
                    const colors = { 0: 'default', 1: 'success', 2: 'orange', 3: 'blue', 4: 'default' };
                    return <Tag color={colors[text]}>{map[text]}</Tag>;
                  }
                },
                {
                  title: '操作',
                  fixed: 'right',
                  width: 150,
                  render: (_, record) => (
                    <div className="action-buttons">
                      <Button type="link" size="small" icon={<EditOutlined />}
                        onClick={() => {
                          setEditingActivity(record);
                          form.setFieldsValue(record);
                          setEditModalVisible(true);
                        }}
                      >编辑</Button>
                      <Popconfirm
                        title="确定删除这个活动吗？"
                        onConfirm={async () => {
                          try {
                            await api.delete(`/admin/activities/${record.id}`);
                            message.success('删除成功');
                            fetchActivities();
                          } catch (error) {
                            message.error('删除失败');
                          }
                        }}
                      >
                        <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
                      </Popconfirm>
                    </div>
                  )
                }
              ]}
            />
          </div>
        );

      case 'challenges':
        return (
          <div>
            <div className="page-header">
              <h2>挑战赛管理</h2>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingChallenge(null);
                  form.resetFields();
                  setEditModalVisible(true);
                }}
              >
                添加挑战赛
              </Button>
            </div>

            <div className="filters">
              <Input
                placeholder="搜索挑战赛名称或主题"
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                onPressEnter={handleSearch}
              />
              <Select
                placeholder="选择难度"
                style={{ width: 150 }}
                allowClear
                value={filters.difficulty}
                onChange={(value) => setFilters({ ...filters, difficulty: value })}
              >
                <Option value="beginner">入门</Option>
                <Option value="intermediate">进阶</Option>
                <Option value="advanced">专业</Option>
              </Select>
              <Button type="primary" onClick={handleSearch}>搜索</Button>
              <Button onClick={() => {
                setFilters({ keyword: '', difficulty: '' });
                setTimeout(handleSearch, 0);
              }}>重置</Button>
            </div>

            <Table
              dataSource={challenges}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1400 }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: (page) => setPagination({ ...pagination, current: page }),
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              columns={[
                { title: 'ID', dataIndex: 'id', width: 80 },
                {
                  title: '封面',
                  dataIndex: 'cover_image',
                  width: 100,
                  render: (text) => text ? <img src={text} alt="cover" className="location-cover" /> : '-'
                },
                { title: '挑战赛标题', dataIndex: 'title', width: 200 },
                { title: '主题', dataIndex: 'theme', width: 120 },
                {
                  title: '难度',
                  dataIndex: 'difficulty',
                  width: 100,
                  render: (text) => {
                    const map = { beginner: '入门', intermediate: '进阶', advanced: '专业' };
                    const colors = { beginner: 'green', intermediate: 'orange', advanced: 'red' };
                    return <Tag color={colors[text]}>{map[text] || text}</Tag>;
                  }
                },
                { title: '开始时间', dataIndex: 'start_time', width: 180, render: (text) => new Date(text).toLocaleString('zh-CN') },
                { title: '结束时间', dataIndex: 'end_time', width: 180, render: (text) => new Date(text).toLocaleString('zh-CN') },
                { title: '参与人数', dataIndex: 'participant_count', width: 100 },
                { title: '作品数', dataIndex: 'work_count', width: 100 },
                {
                  title: '状态',
                  dataIndex: 'status',
                  width: 100,
                  render: (text) => {
                    const map = { 0: '草稿', 1: '报名中', 2: '进行中', 3: '评选中', 4: '已结束' };
                    const colors = { 0: 'default', 1: 'success', 2: 'blue', 3: 'orange', 4: 'default' };
                    return <Tag color={colors[text]}>{map[text]}</Tag>;
                  }
                },
                {
                  title: '操作',
                  fixed: 'right',
                  width: 150,
                  render: (_, record) => (
                    <div className="action-buttons">
                      <Button type="link" size="small" icon={<EditOutlined />}
                        onClick={() => {
                          setEditingChallenge(record);
                          form.setFieldsValue(record);
                          setEditModalVisible(true);
                        }}
                      >编辑</Button>
                      <Popconfirm
                        title="确定删除这个挑战赛吗？"
                        onConfirm={async () => {
                          try {
                            await api.delete(`/admin/challenges/${record.id}`);
                            message.success('删除成功');
                            fetchChallenges();
                          } catch (error) {
                            message.error('删除失败');
                          }
                        }}
                      >
                        <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
                      </Popconfirm>
                    </div>
                  )
                }
              ]}
            />
          </div>
        );

      case 'cameras':
        return (
          <div>
            <div className="page-header">
              <h2>相机管理</h2>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingCamera(null);
                  form.resetFields();
                  setEditModalVisible(true);
                }}
              >
                添加相机
              </Button>
            </div>

            <div className="filters">
              <Input
                placeholder="搜索相机型号"
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                onPressEnter={handleSearch}
              />
              <Select
                placeholder="选择品牌"
                style={{ width: 150 }}
                allowClear
                value={filters.brand}
                onChange={(value) => setFilters({ ...filters, brand: value })}
              >
                <Option value="Canon">佳能</Option>
                <Option value="Nikon">尼康</Option>
                <Option value="Sony">索尼</Option>
                <Option value="Fujifilm">富士</Option>
                <Option value="Panasonic">松下</Option>
              </Select>
              <Select
                placeholder="选择传感器类型"
                style={{ width: 150 }}
                allowClear
                value={filters.sensor_type}
                onChange={(value) => setFilters({ ...filters, sensor_type: value })}
              >
                <Option value="full-frame">全画幅</Option>
                <Option value="aps-c">APS-C</Option>
                <Option value="m43">M4/3</Option>
                <Option value="medium-format">中画幅</Option>
              </Select>
              <Button type="primary" onClick={handleSearch}>搜索</Button>
              <Button onClick={() => {
                setFilters({ keyword: '', brand: '', sensor_type: '' });
                setTimeout(handleSearch, 0);
              }}>重置</Button>
            </div>

            <Table
              dataSource={cameras}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1600 }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: (page) => setPagination({ ...pagination, current: page }),
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              columns={[
                { title: 'ID', dataIndex: 'id', width: 80 },
                { title: '品牌', dataIndex: 'brand', width: 100 },
                { title: '型号', dataIndex: 'model', width: 150 },
                {
                  title: '传感器类型',
                  dataIndex: 'sensor_type',
                  width: 120,
                  render: (text) => {
                    const map = { 'full-frame': '全画幅', 'aps-c': 'APS-C', 'm43': 'M4/3', 'medium-format': '中画幅' };
                    return <Tag color="blue">{map[text] || text}</Tag>;
                  }
                },
                { title: '像素', dataIndex: 'megapixels', width: 100, render: (text) => text ? `${text}MP` : '-' },
                { title: 'ISO范围', dataIndex: 'iso_range', width: 150 },
                { title: '连拍速度', dataIndex: 'continuous_shooting', width: 100, render: (text) => text ? `${text}fps` : '-' },
                { title: '对焦点', dataIndex: 'focus_points', width: 100 },
                { title: '视频规格', dataIndex: 'video_spec', width: 120 },
                { title: '重量(g)', dataIndex: 'weight', width: 100 },
                { title: '价格(￥)', dataIndex: 'price', width: 120, render: (text) => text ? `￥${text}` : '-' },
                {
                  title: '状态',
                  dataIndex: 'status',
                  width: 100,
                  render: (text) => (
                    <Tag color={text === 1 ? 'success' : 'default'}>
                      {text === 1 ? '在售' : '停产'}
                    </Tag>
                  )
                },
                {
                  title: '创建时间',
                  dataIndex: 'created_at',
                  width: 180,
                  render: (text) => new Date(text).toLocaleString('zh-CN')
                },
                {
                  title: '操作',
                  fixed: 'right',
                  width: 150,
                  render: (_, record) => (
                    <div className="action-buttons">
                      <Button type="link" size="small" icon={<EditOutlined />}
                        onClick={() => {
                          setEditingCamera(record);
                          form.setFieldsValue(record);
                          setEditModalVisible(true);
                        }}
                      >编辑</Button>
                      <Popconfirm
                        title="确定删除这个相机吗？"
                        onConfirm={async () => {
                          try {
                            await api.delete(`/admin/cameras/${record.id}`);
                            message.success('删除成功');
                            fetchCameras();
                          } catch (error) {
                            message.error('删除失败');
                          }
                        }}
                      >
                        <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
                      </Popconfirm>
                    </div>
                  )
                }
              ]}
            />
          </div>
        );

      case 'lenses':
        return (
          <div>
            <div className="page-header">
              <h2>镜头管理</h2>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingLens(null);
                  form.resetFields();
                  setEditModalVisible(true);
                }}
              >
                添加镜头
              </Button>
            </div>

            <div className="filters">
              <Input
                placeholder="搜索镜头型号"
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                onPressEnter={handleSearch}
              />
              <Select
                placeholder="选择品牌"
                style={{ width: 150 }}
                allowClear
                value={filters.brand}
                onChange={(value) => setFilters({ ...filters, brand: value })}
              >
                <Option value="Canon">佳能</Option>
                <Option value="Nikon">尼康</Option>
                <Option value="Sony">索尼</Option>
                <Option value="Sigma">适马</Option>
                <Option value="Tamron">腾龙</Option>
              </Select>
              <Select
                placeholder="选择镜头类型"
                style={{ width: 150 }}
                allowClear
                value={filters.lens_type}
                onChange={(value) => setFilters({ ...filters, lens_type: value })}
              >
                <Option value="prime">定焦</Option>
                <Option value="zoom">变焦</Option>
              </Select>
              <Button type="primary" onClick={handleSearch}>搜索</Button>
              <Button onClick={() => {
                setFilters({ keyword: '', brand: '', lens_type: '' });
                setTimeout(handleSearch, 0);
              }}>重置</Button>
            </div>

            <Table
              dataSource={lenses}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1500 }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: (page) => setPagination({ ...pagination, current: page }),
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              columns={[
                { title: 'ID', dataIndex: 'id', width: 80 },
                { title: '品牌', dataIndex: 'brand', width: 100 },
                { title: '型号', dataIndex: 'model', width: 150 },
                { title: '卡口', dataIndex: 'mount', width: 120 },
                { title: '焦距', dataIndex: 'focal_length', width: 120 },
                { title: '最大光圈', dataIndex: 'max_aperture', width: 100 },
                {
                  title: '镜头类型',
                  dataIndex: 'lens_type',
                  width: 100,
                  render: (text) => {
                    const map = { 'prime': '定焦', 'zoom': '变焦' };
                    return <Tag color={text === 'prime' ? 'blue' : 'green'}>{map[text] || text}</Tag>;
                  }
                },
                {
                  title: '防抖',
                  dataIndex: 'image_stabilization',
                  width: 80,
                  render: (text) => <Tag color={text ? 'success' : 'default'}>{text ? '支持' : '不支持'}</Tag>
                },
                {
                  title: '自动对焦',
                  dataIndex: 'autofocus',
                  width: 100,
                  render: (text) => <Tag color={text ? 'success' : 'default'}>{text ? '支持' : '不支持'}</Tag>
                },
                { title: '价格(￥)', dataIndex: 'price', width: 120, render: (text) => text ? `￥${text}` : '-' },
                {
                  title: '状态',
                  dataIndex: 'status',
                  width: 100,
                  render: (text) => (
                    <Tag color={text === 1 ? 'success' : 'default'}>
                      {text === 1 ? '在售' : '停产'}
                    </Tag>
                  )
                },
                {
                  title: '创建时间',
                  dataIndex: 'created_at',
                  width: 180,
                  render: (text) => new Date(text).toLocaleString('zh-CN')
                },
                {
                  title: '操作',
                  fixed: 'right',
                  width: 150,
                  render: (_, record) => (
                    <div className="action-buttons">
                      <Button type="link" size="small" icon={<EditOutlined />}
                        onClick={() => {
                          setEditingLens(record);
                          form.setFieldsValue(record);
                          setEditModalVisible(true);
                        }}
                      >编辑</Button>
                      <Popconfirm
                        title="确定删除这个镜头吗？"
                        onConfirm={async () => {
                          try {
                            await api.delete(`/admin/lenses/${record.id}`);
                            message.success('删除成功');
                            fetchLenses();
                          } catch (error) {
                            message.error('删除失败');
                          }
                        }}
                      >
                        <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
                      </Popconfirm>
                    </div>
                  )
                }
              ]}
            />
          </div>
        );

      case 'users':
        return (
          <div>
            <div className="page-header">
              <h2>用户管理</h2>
            </div>

            <div className="filters">
              <Input
                placeholder="搜索用户昵称或手机号"
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                onPressEnter={handleSearch}
              />
              <Select
                placeholder="选择状态"
                style={{ width: 120 }}
                allowClear
                value={filters.status}
                onChange={(value) => setFilters({ ...filters, status: value })}
              >
                <Option value={1}>正常</Option>
                <Option value={0}>禁用</Option>
              </Select>
              <Select
                placeholder="选择角色"
                style={{ width: 120 }}
                allowClear
                value={filters.role}
                onChange={(value) => setFilters({ ...filters, role: value })}
              >
                <Option value="user">普通用户</Option>
                <Option value="editor">平台编辑</Option>
                <Option value="admin">管理员</Option>
              </Select>
              <Button type="primary" onClick={handleSearch}>搜索</Button>
              <Button onClick={() => {
                setFilters({ keyword: '', status: '', role: '' });
                setTimeout(handleSearch, 0);
              }}>重置</Button>
            </div>

            <Table
              dataSource={users}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1400 }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: (page) => setPagination({ ...pagination, current: page }),
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              columns={[
                { title: 'ID', dataIndex: 'id', width: 80 },
                {
                  title: '头像',
                  dataIndex: 'avatar',
                  width: 80,
                  render: (text) => text ? <img src={text} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%' }} /> : '-'
                },
                { title: '昵称', dataIndex: 'nickname', width: 120 },
                { title: '手机号', dataIndex: 'phone', width: 120 },
                { title: '简介', dataIndex: 'bio', width: 200, ellipsis: true },
                {
                  title: '角色',
                  dataIndex: 'role',
                  width: 100,
                  render: (text) => {
                    const roleMap = {
                      'admin': { label: '管理员', color: 'red' },
                      'editor': { label: '平台编辑', color: 'orange' },
                      'user': { label: '普通用户', color: 'blue' }
                    };
                    const role = roleMap[text] || { label: text, color: 'default' };
                    return <Tag color={role.color}>{role.label}</Tag>;
                  }
                },
                { title: '粉丝数', dataIndex: 'followers_count', width: 100 },
                { title: '关注数', dataIndex: 'following_count', width: 100 },
                { title: '作品数', dataIndex: 'works_count', width: 100 },
                {
                  title: '状态',
                  dataIndex: 'status',
                  width: 100,
                  render: (text) => <Tag color={text === 1 ? 'success' : 'error'}>{text === 1 ? '正常' : '禁用'}</Tag>
                },
                { title: '创建时间', dataIndex: 'created_at', width: 180, render: (text) => new Date(text).toLocaleString('zh-CN') },
                {
                  title: '操作',
                  fixed: 'right',
                  width: 200,
                  render: (_, record) => (
                    <div className="action-buttons">
                      <Button type="link" size="small" icon={<EditOutlined />}
                        onClick={() => {
                          setEditingUser(record);
                          form.setFieldsValue(record);
                          setEditModalVisible(true);
                        }}
                      >编辑</Button>
                      <Popconfirm
                        title={`确定${record.status === 1 ? '禁用' : '启用'}该用户吗？`}
                        onConfirm={async () => {
                          try {
                            await api.put(`/admin/users/${record.id}/status`, { status: record.status === 1 ? 0 : 1 });
                            message.success('操作成功');
                            fetchUsers();
                          } catch (error) {
                            message.error('操作失败');
                          }
                        }}
                      >
                        <Button type="link" danger={record.status === 1} size="small">
                          {record.status === 1 ? '禁用' : '启用'}
                        </Button>
                      </Popconfirm>
                    </div>
                  )
                }
              ]}
            />
          </div>
        );

      case 'works':
        return (
          <div>
            <div className="page-header">
              <h2>作品管理</h2>
            </div>

            <div className="filters">
              <Input
                placeholder="搜索作品标题"
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                onPressEnter={handleSearch}
              />
              <Select
                placeholder="选择状态"
                style={{ width: 120 }}
                allowClear
                value={filters.status}
                onChange={(value) => setFilters({ ...filters, status: value })}
              >
                <Option value={0}>草稿</Option>
                <Option value={1}>已发布</Option>
                <Option value={2}>已删除</Option>
              </Select>
              <Button type="primary" onClick={handleSearch}>搜索</Button>
              <Button onClick={() => {
                setFilters({ keyword: '', status: '' });
                setTimeout(handleSearch, 0);
              }}>重置</Button>
            </div>

            <Table
              dataSource={works}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1400 }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: (page) => setPagination({ ...pagination, current: page }),
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              columns={[
                { title: 'ID', dataIndex: 'id', width: 80 },
                { title: '作品标题', dataIndex: 'title', width: 200, ellipsis: true },
                { title: '作者', dataIndex: 'author_name', width: 120 },
                { title: '拍摄地点', dataIndex: 'location', width: 150, ellipsis: true },
                { title: '浏览量', dataIndex: 'view_count', width: 100 },
                { title: '点赞数', dataIndex: 'like_count', width: 100 },
                { title: '评论数', dataIndex: 'comment_count', width: 100 },
                { title: '收藏数', dataIndex: 'collect_count', width: 100 },
                {
                  title: '状态',
                  dataIndex: 'status',
                  width: 100,
                  render: (text) => {
                    const map = { 0: '草稿', 1: '已发布', 2: '已删除' };
                    const colors = { 0: 'default', 1: 'success', 2: 'error' };
                    return <Tag color={colors[text]}>{map[text]}</Tag>;
                  }
                },
                { title: '创建时间', dataIndex: 'created_at', width: 180, render: (text) => new Date(text).toLocaleString('zh-CN') },
                {
                  title: '操作',
                  fixed: 'right',
                  width: 150,
                  render: (_, record) => (
                    <div className="action-buttons">
                      {isAdmin && (
                        <Popconfirm
                          title="确定删除该作品吗？"
                          onConfirm={async () => {
                            try {
                              await api.delete(`/admin/works/${record.id}`);
                              message.success('删除成功');
                              fetchWorks();
                            } catch (error) {
                              message.error('删除失败');
                            }
                          }}
                        >
                          <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
                        </Popconfirm>
                      )}
                      {!isAdmin && <span style={{ color: '#999' }}>无权限</span>}
                    </div>
                  )
                }
              ]}
            />
          </div>
        );

      case 'comments':
        return (
          <div>
            <div className="page-header">
              <h2>评论管理</h2>
            </div>

            <div className="filters">
              <Input
                placeholder="搜索评论内容"
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                onPressEnter={handleSearch}
              />
              <Select
                placeholder="选择状态"
                style={{ width: 120 }}
                allowClear
                value={filters.status}
                onChange={(value) => setFilters({ ...filters, status: value })}
              >
                <Option value={1}>正常</Option>
                <Option value={0}>已删除</Option>
              </Select>
              <Button type="primary" onClick={handleSearch}>搜索</Button>
              <Button onClick={() => {
                setFilters({ keyword: '', status: '' });
                setTimeout(handleSearch, 0);
              }}>重置</Button>
            </div>

            <Table
              dataSource={comments}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1200 }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: (page) => setPagination({ ...pagination, current: page }),
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              columns={[
                { title: 'ID', dataIndex: 'id', width: 80 },
                { title: '评论内容', dataIndex: 'content', width: 300, ellipsis: true },
                { title: '用户', dataIndex: 'user_name', width: 120 },
                { title: '作品标题', dataIndex: 'work_title', width: 200, ellipsis: true },
                { title: '点赞数', dataIndex: 'like_count', width: 100 },
                {
                  title: '状态',
                  dataIndex: 'status',
                  width: 100,
                  render: (text) => <Tag color={text === 1 ? 'success' : 'default'}>{text === 1 ? '正常' : '已删除'}</Tag>
                },
                { title: '创建时间', dataIndex: 'created_at', width: 180, render: (text) => new Date(text).toLocaleString('zh-CN') },
                {
                  title: '操作',
                  fixed: 'right',
                  width: 100,
                  render: (_, record) => record.status === 1 ? (
                    isAdmin ? (
                      <Popconfirm
                        title="确定删除该评论吗？"
                        onConfirm={async () => {
                          try {
                            await api.delete(`/admin/comments/${record.id}`);
                            message.success('删除成功');
                            fetchComments();
                          } catch (error) {
                            message.error('删除失败');
                          }
                        }}
                      >
                        <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
                      </Popconfirm>
                    ) : <span style={{ color: '#999' }}>无权限</span>
                  ) : '-'
                }
              ]}
            />
          </div>
        );

      default:
        return <div>功能开发中...</div>;
    }
  };

  return (
    <div className="admin-container">
      <Layout className="admin-layout">
        <Header className="admin-header">
          <div className="admin-logo">📸 摄影社区后台管理</div>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            退出登录
          </Button>
        </Header>
        <Layout>
          <Sider className="admin-sider" width={200}>
            <Menu
              mode="inline"
              selectedKeys={[selectedMenu]}
              items={menuItems}
              onClick={({ key }) => setSelectedMenu(key)}
              style={{ height: '100%', borderRight: 0 }}
              theme="dark"
            />
          </Sider>
          <Layout style={{ padding: 0 }}>
            <Content className="admin-content">
              {renderContent()}
            </Content>
          </Layout>
        </Layout>
      </Layout>

      <Modal
        title={
          selectedMenu === 'courses' 
            ? (editingCourse ? '编辑课程' : '添加课程')
            : selectedMenu === 'tips'
            ? (editingTip ? '编辑技巧' : '添加技巧')
            : selectedMenu === 'activities'
            ? (editingActivity ? '编辑活动' : '添加活动')
            : selectedMenu === 'challenges'
            ? (editingChallenge ? '编辑挑战赛' : '添加挑战赛')
            : selectedMenu === 'cameras'
            ? (editingCamera ? '编辑相机' : '添加相机')
            : selectedMenu === 'lenses'
            ? (editingLens ? '编辑镜头' : '添加镜头')
            : selectedMenu === 'users'
            ? '编辑用户'
            : (editingLocation ? '编辑地点' : '添加地点')
        }
        open={editModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 1 }}
        >
          {selectedMenu === 'locations' && (
            <>
              <Form.Item
                label="地点名称"
                name="name"
                rules={[{ required: true, message: '请输入地点名称' }]}
              >
                <Input placeholder="请输入地点名称" />
              </Form.Item>

              <Form.Item
                label="详细地址"
                name="address"
                rules={[{ required: true, message: '请输入详细地址' }]}
              >
                <Input placeholder="请输入详细地址" />
              </Form.Item>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="省份"
                  name="province"
                  style={{ width: 180 }}
                >
                  <Input placeholder="省份" />
                </Form.Item>

                <Form.Item
                  label="城市"
                  name="city"
                  style={{ width: 180 }}
                >
                  <Input placeholder="城市" />
                </Form.Item>

                <Form.Item
                  label="区县"
                  name="district"
                  style={{ width: 180 }}
                >
                  <Input placeholder="区县" />
                </Form.Item>
              </Space>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="纬度"
                  name="latitude"
                  rules={[{ required: true, message: '请输入纬度' }]}
                  style={{ width: 240 }}
                >
                  <Input type="number" placeholder="例: 31.239854" />
                </Form.Item>

                <Form.Item
                  label="经度"
                  name="longitude"
                  rules={[{ required: true, message: '请输入经度' }]}
                  style={{ width: 240 }}
                >
                  <Input type="number" placeholder="例: 121.490637" />
                </Form.Item>
              </Space>

              <Form.Item
                label="地点类型"
                name="category"
              >
                <Select placeholder="选择地点类型">
                  <Option value="natural">自然风光</Option>
                  <Option value="architecture">建筑</Option>
                  <Option value="modern">现代建筑</Option>
                  <Option value="park">公园</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="封面图片URL"
                name="cover_image"
              >
                <Input placeholder="封面图片URL" />
              </Form.Item>

              <Form.Item
                label="地点描述"
                name="description"
              >
                <Input.TextArea rows={4} placeholder="地点描述" />
              </Form.Item>

              <Form.Item
                label="最佳拍摄时段"
                name="best_time"
              >
                <Input placeholder="例: sunrise,sunset,night" />
              </Form.Item>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="开放时间"
                  name="opening_hours"
                  style={{ width: 240 }}
                >
                  <Input placeholder="例: 全天开放" />
                </Form.Item>

                <Form.Item
                  label="门票价格"
                  name="ticket_price"
                  style={{ width: 240 }}
                >
                  <Input placeholder="例: 免费 或 50元" />
                </Form.Item>
              </Space>

              <Form.Item
                label="拍摄建议"
                name="tips"
              >
                <Input.TextArea rows={3} placeholder="拍摄建议和注意事项" />
              </Form.Item>

              <Form.Item
                label="状态"
                name="status"
              >
                <Select>
                  <Option value={1}>正常</Option>
                  <Option value={0}>已删除</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {selectedMenu === 'courses' && (
            <>
              <Form.Item
                label="课程标题"
                name="title"
                rules={[{ required: true, message: '请输入课程标题' }]}
              >
                <Input placeholder="请输入课程标题" />
              </Form.Item>

              <Form.Item
                label="封面图片URL"
                name="cover_image"
                rules={[{ required: true, message: '请输入封面图片URL' }]}
              >
                <Input placeholder="封面图片URL" />
              </Form.Item>

              <Form.Item
                label="课程描述"
                name="description"
              >
                <Input.TextArea rows={4} placeholder="课程描述" />
              </Form.Item>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="分类"
                  name="category"
                  rules={[{ required: true, message: '请选择分类' }]}
                  style={{ width: 240 }}
                >
                  <Select placeholder="选择分类">
                    <Option value="shooting">拍摄</Option>
                    <Option value="post">后期</Option>
                    <Option value="equipment">器材</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="难度"
                  name="difficulty"
                  rules={[{ required: true, message: '请选择难度' }]}
                  style={{ width: 240 }}
                >
                  <Select placeholder="选择难度">
                    <Option value="beginner">入门</Option>
                    <Option value="intermediate">进阶</Option>
                    <Option value="advanced">高级</Option>
                  </Select>
                </Form.Item>
              </Space>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="类型"
                  name="type"
                  style={{ width: 240 }}
                >
                  <Select placeholder="选择类型">
                    <Option value="video">视频</Option>
                    <Option value="article">文章</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="讲师ID"
                  name="instructor_id"
                  style={{ width: 240 }}
                >
                  <Input type="number" placeholder="讲师用户ID" />
                </Form.Item>
              </Space>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="课程时长(分钟)"
                  name="duration"
                  style={{ width: 160 }}
                >
                  <Input type="number" placeholder="分钟" />
                </Form.Item>

                <Form.Item
                  label="价格(元)"
                  name="price"
                  style={{ width: 160 }}
                >
                  <Input type="number" step="0.01" placeholder="0.00" />
                </Form.Item>

                <Form.Item
                  label="是否免费"
                  name="is_free"
                  style={{ width: 160 }}
                  valuePropName="checked"
                >
                  <Select>
                    <Option value={1}>免费</Option>
                    <Option value={0}>付费</Option>
                  </Select>
                </Form.Item>
              </Space>

              <Form.Item
                label="状态"
                name="status"
              >
                <Select>
                  <Option value={0}>草稿</Option>
                  <Option value={1}>已发布</Option>
                  <Option value={2}>已下架</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {selectedMenu === 'tips' && (
            <>
              <Form.Item
                label="技巧标题"
                name="title"
                rules={[{ required: true, message: '请输入技巧标题' }]}
              >
                <Input placeholder="请输入技巧标题" />
              </Form.Item>

              <Form.Item
                label="封面图片URL"
                name="cover_image"
              >
                <Input placeholder="封面图片URL" />
              </Form.Item>

              <Form.Item
                label="内容"
                name="content"
                rules={[{ required: true, message: '请输入内容' }]}
              >
                <Input.TextArea rows={6} placeholder="技巧详细内容" />
              </Form.Item>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="分类"
                  name="category"
                  rules={[{ required: true, message: '请选择分类' }]}
                  style={{ width: 240 }}
                >
                  <Select placeholder="选择分类">
                    <Option value="portrait">人像</Option>
                    <Option value="landscape">风光</Option>
                    <Option value="street">街拍</Option>
                    <Option value="architecture">建筑</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="技术类型"
                  name="technique_type"
                  style={{ width: 240 }}
                >
                  <Select placeholder="选择技术类型">
                    <Option value="exposure">曝光</Option>
                    <Option value="focus">对焦</Option>
                    <Option value="composition">构图</Option>
                    <Option value="lighting">用光</Option>
                  </Select>
                </Form.Item>
              </Space>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="难度"
                  name="difficulty"
                  style={{ width: 240 }}
                >
                  <Select placeholder="选择难度">
                    <Option value="beginner">入门</Option>
                    <Option value="intermediate">进阶</Option>
                    <Option value="advanced">高级</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="阅读时间(分钟)"
                  name="reading_time"
                  style={{ width: 240 }}
                >
                  <Input type="number" placeholder="预计阅读时间" />
                </Form.Item>
              </Space>

              <Form.Item
                label="作者ID"
                name="author_id"
              >
                <Input type="number" placeholder="作者用户ID" />
              </Form.Item>

              <Form.Item
                label="状态"
                name="status"
              >
                <Select>
                  <Option value={0}>草稿</Option>
                  <Option value={1}>已发布</Option>
                  <Option value={2}>已删除</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {selectedMenu === 'activities' && (
            <>
              <Form.Item
                label="活动标题"
                name="title"
                rules={[{ required: true, message: '请输入活动标题' }]}
              >
                <Input placeholder="请输入活动标题" />
              </Form.Item>

              <Form.Item
                label="封面图片URL"
                name="cover_image"
              >
                <Input placeholder="封面图片URL" />
              </Form.Item>

              <Form.Item
                label="活动描述"
                name="description"
              >
                <Input.TextArea rows={4} placeholder="活动描述" />
              </Form.Item>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="活动类型"
                  name="activity_type"
                  style={{ width: 240 }}
                >
                  <Select placeholder="选择活动类型">
                    <Option value="sunrise">晨拍</Option>
                    <Option value="sunset">日落</Option>
                    <Option value="night">夜拍</Option>
                    <Option value="theme">主题拍摄</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="费用类型"
                  name="fee_type"
                  style={{ width: 240 }}
                >
                  <Select placeholder="选择费用类型">
                    <Option value="free">免费</Option>
                    <Option value="aa">AA制</Option>
                    <Option value="paid">收费</Option>
                  </Select>
                </Form.Item>
              </Space>

              <Form.Item
                label="活动地点"
                name="location"
                rules={[{ required: true, message: '请输入活动地点' }]}
              >
                <Input placeholder="例如: 上海外滩" />
              </Form.Item>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="纬度"
                  name="latitude"
                  style={{ width: 240 }}
                >
                  <Input type="number" placeholder="例: 31.239854" />
                </Form.Item>

                <Form.Item
                  label="经度"
                  name="longitude"
                  style={{ width: 240 }}
                >
                  <Input type="number" placeholder="例: 121.490637" />
                </Form.Item>
              </Space>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="开始时间"
                  name="start_time"
                  rules={[{ required: true, message: '请选择开始时间' }]}
                  style={{ width: 240 }}
                >
                  <Input type="datetime-local" />
                </Form.Item>

                <Form.Item
                  label="结束时间"
                  name="end_time"
                  style={{ width: 240 }}
                >
                  <Input type="datetime-local" />
                </Form.Item>
              </Space>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="人数限制"
                  name="max_participants"
                  style={{ width: 240 }}
                >
                  <Input type="number" placeholder="0为不限制" />
                </Form.Item>

                <Form.Item
                  label="费用金额"
                  name="fee_amount"
                  style={{ width: 240 }}
                >
                  <Input type="number" step="0.01" placeholder="0.00" />
                </Form.Item>
              </Space>

              <Form.Item
                label="创建者ID"
                name="creator_id"
                rules={[{ required: true, message: '请输入创建者ID' }]}
              >
                <Input type="number" placeholder="创建者用户ID" />
              </Form.Item>

              <Form.Item
                label="活动要求"
                name="requirements"
              >
                <Input.TextArea rows={3} placeholder="活动要求" />
              </Form.Item>

              <Form.Item
                label="活动流程"
                name="schedule"
              >
                <Input.TextArea rows={3} placeholder="活动流程安排" />
              </Form.Item>

              <Form.Item
                label="注意事项"
                name="notes"
              >
                <Input.TextArea rows={3} placeholder="注意事项" />
              </Form.Item>

              <Form.Item
                label="状态"
                name="status"
              >
                <Select>
                  <Option value={0}>已取消</Option>
                  <Option value={1}>招募中</Option>
                  <Option value={2}>已满员</Option>
                  <Option value={3}>进行中</Option>
                  <Option value={4}>已结束</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {selectedMenu === 'challenges' && (
            <>
              <Form.Item
                label="挑战赛标题"
                name="title"
                rules={[{ required: true, message: '请输入挑战赛标题' }]}
              >
                <Input placeholder="请输入挑战赛标题" />
              </Form.Item>

              <Form.Item
                label="封面图片URL"
                name="cover_image"
              >
                <Input placeholder="封面图片URL" />
              </Form.Item>

              <Form.Item
                label="挑战赛描述"
                name="description"
              >
                <Input.TextArea rows={4} placeholder="挑战赛描述" />
              </Form.Item>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="主题"
                  name="theme"
                  style={{ width: 240 }}
                >
                  <Input placeholder="例如: 冬季" />
                </Form.Item>

                <Form.Item
                  label="难度"
                  name="difficulty"
                  style={{ width: 240 }}
                >
                  <Select placeholder="选择难度">
                    <Option value="beginner">入门</Option>
                    <Option value="intermediate">进阶</Option>
                    <Option value="advanced">专业</Option>
                  </Select>
                </Form.Item>
              </Space>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="主办方类型"
                  name="organizer_type"
                  style={{ width: 240 }}
                >
                  <Select placeholder="选择主办方类型">
                    <Option value="official">官方</Option>
                    <Option value="brand">品牌</Option>
                    <Option value="user">用户</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="主办方ID"
                  name="organizer_id"
                  style={{ width: 240 }}
                >
                  <Input type="number" placeholder="主办方ID" />
                </Form.Item>
              </Space>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="开始时间"
                  name="start_time"
                  rules={[{ required: true, message: '请选择开始时间' }]}
                  style={{ width: 240 }}
                >
                  <Input type="datetime-local" />
                </Form.Item>

                <Form.Item
                  label="结束时间"
                  name="end_time"
                  rules={[{ required: true, message: '请选择结束时间' }]}
                  style={{ width: 240 }}
                >
                  <Input type="datetime-local" />
                </Form.Item>
              </Space>

              <Form.Item
                label="参赛要求"
                name="requirements"
              >
                <Input.TextArea rows={3} placeholder="参赛要求" />
              </Form.Item>

              <Form.Item
                label="评选标准"
                name="rules"
              >
                <Input.TextArea rows={3} placeholder="评选标准" />
              </Form.Item>

              <Form.Item
                label="奖品设置(JSON格式)"
                name="prizes"
              >
                <Input.TextArea rows={3} placeholder='例: [{"rank":"一等奖","prize":"相机","description":"1名"}]' />
              </Form.Item>

              <Form.Item
                label="状态"
                name="status"
              >
                <Select>
                  <Option value={0}>草稿</Option>
                  <Option value={1}>报名中</Option>
                  <Option value={2}>进行中</Option>
                  <Option value={3}>评选中</Option>
                  <Option value={4}>已结束</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {selectedMenu === 'cameras' && (
            <>
              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="品牌"
                  name="brand"
                  rules={[{ required: true, message: '请输入品牌' }]}
                  style={{ width: 240 }}
                >
                  <Input placeholder="例: Canon, Nikon, Sony" />
                </Form.Item>

                <Form.Item
                  label="型号"
                  name="model"
                  rules={[{ required: true, message: '请输入型号' }]}
                  style={{ width: 240 }}
                >
                  <Input placeholder="例: EOS R5" />
                </Form.Item>
              </Space>

              <Form.Item
                label="描述"
                name="description"
              >
                <Input.TextArea rows={3} placeholder="相机描述" />
              </Form.Item>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="传感器类型"
                  name="sensor_type"
                  style={{ width: 240 }}
                >
                  <Select placeholder="选择传感器类型">
                    <Option value="full-frame">全画幅</Option>
                    <Option value="aps-c">APS-C</Option>
                    <Option value="m43">M4/3</Option>
                    <Option value="medium-format">中画幅</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="像素(MP)"
                  name="megapixels"
                  style={{ width: 240 }}
                >
                  <Input type="number" step="0.1" placeholder="例: 45.0" />
                </Form.Item>
              </Space>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="ISO范围"
                  name="iso_range"
                  style={{ width: 240 }}
                >
                  <Input placeholder="例: 100-51200" />
                </Form.Item>

                <Form.Item
                  label="连拍速度(fps)"
                  name="continuous_shooting"
                  style={{ width: 240 }}
                >
                  <Input type="number" step="0.1" placeholder="例: 12.0" />
                </Form.Item>
              </Space>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="对焦点数"
                  name="focus_points"
                  style={{ width: 240 }}
                >
                  <Input type="number" placeholder="例: 693" />
                </Form.Item>

                <Form.Item
                  label="视频规格"
                  name="video_spec"
                  style={{ width: 240 }}
                >
                  <Input placeholder="例: 8K 30p" />
                </Form.Item>
              </Space>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="重量(g)"
                  name="weight"
                  style={{ width: 240 }}
                >
                  <Input type="number" placeholder="例: 738" />
                </Form.Item>

                <Form.Item
                  label="价格(￥)"
                  name="price"
                  style={{ width: 240 }}
                >
                  <Input type="number" step="0.01" placeholder="例: 25999.00" />
                </Form.Item>
              </Space>

              <Form.Item
                label="状态"
                name="status"
              >
                <Select>
                  <Option value={0}>停产</Option>
                  <Option value={1}>在售</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {selectedMenu === 'lenses' && (
            <>
              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="品牌"
                  name="brand"
                  rules={[{ required: true, message: '请输入品牌' }]}
                  style={{ width: 240 }}
                >
                  <Input placeholder="例: Canon, Sigma, Tamron" />
                </Form.Item>

                <Form.Item
                  label="型号"
                  name="model"
                  rules={[{ required: true, message: '请输入型号' }]}
                  style={{ width: 240 }}
                >
                  <Input placeholder="例: RF 70-200mm f/2.8L IS USM" />
                </Form.Item>
              </Space>

              <Form.Item
                label="描述"
                name="description"
              >
                <Input.TextArea rows={3} placeholder="镜头描述" />
              </Form.Item>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="卡口"
                  name="mount"
                  style={{ width: 240 }}
                >
                  <Input placeholder="例: Canon RF, Nikon Z" />
                </Form.Item>

                <Form.Item
                  label="焦距"
                  name="focal_length"
                  style={{ width: 240 }}
                >
                  <Input placeholder="例: 70-200mm, 50mm" />
                </Form.Item>
              </Space>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="最大光圈"
                  name="max_aperture"
                  style={{ width: 240 }}
                >
                  <Input placeholder="例: f/2.8, f/1.4" />
                </Form.Item>

                <Form.Item
                  label="镜头类型"
                  name="lens_type"
                  style={{ width: 240 }}
                >
                  <Select placeholder="选择镜头类型">
                    <Option value="prime">定焦</Option>
                    <Option value="zoom">变焦</Option>
                  </Select>
                </Form.Item>
              </Space>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="防抖"
                  name="image_stabilization"
                  style={{ width: 240 }}
                >
                  <Select placeholder="选择是否支持防抖">
                    <Option value={0}>不支持</Option>
                    <Option value={1}>支持</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="自动对焦"
                  name="autofocus"
                  style={{ width: 240 }}
                >
                  <Select placeholder="选择是否支持自动对焦">
                    <Option value={0}>不支持</Option>
                    <Option value={1}>支持</Option>
                  </Select>
                </Form.Item>
              </Space>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="重量(g)"
                  name="weight"
                  style={{ width: 240 }}
                >
                  <Input type="number" placeholder="例: 1070" />
                </Form.Item>

                <Form.Item
                  label="价格(￥)"
                  name="price"
                  style={{ width: 240 }}
                >
                  <Input type="number" step="0.01" placeholder="例: 15999.00" />
                </Form.Item>
              </Space>

              <Form.Item
                label="状态"
                name="status"
              >
                <Select>
                  <Option value={0}>停产</Option>
                  <Option value={1}>在售</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {selectedMenu === 'users' && (
            <>
              <Form.Item
                label="昵称"
                name="nickname"
                rules={[{ required: true, message: '请输入昵称' }]}
              >
                <Input placeholder="请输入昵称" />
              </Form.Item>

              <Form.Item
                label="个人简介"
                name="bio"
              >
                <Input.TextArea rows={3} placeholder="个人简介" />
              </Form.Item>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="性别"
                  name="gender"
                  style={{ width: 240 }}
                >
                  <Select placeholder="选择性别">
                    <Option value={0}>未知</Option>
                    <Option value={1}>男</Option>
                    <Option value={2}>女</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="所在地"
                  name="location"
                  style={{ width: 240 }}
                >
                  <Input placeholder="例: 北京" />
                </Form.Item>
              </Space>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="角色"
                  name="role"
                  style={{ width: 240 }}
                >
                  <Select placeholder="选择角色">
                    <Option value="user">普通用户</Option>
                    <Option value="editor">平台编辑</Option>
                    <Option value="admin">管理员</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="状态"
                  name="status"
                  style={{ width: 240 }}
                >
                  <Select>
                    <Option value={0}>禁用</Option>
                    <Option value={1}>正常</Option>
                  </Select>
                </Form.Item>
              </Space>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}

export default Admin;
