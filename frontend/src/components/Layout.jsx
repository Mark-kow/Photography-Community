import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Avatar, Dropdown } from 'antd';
import {
  HomeOutlined,
  PlusCircleOutlined,
  UserOutlined,
  SearchOutlined,
  LogoutOutlined,
  CameraOutlined,
  EnvironmentOutlined,
  BookOutlined,
  ToolOutlined,
  CalendarOutlined,
  TrophyOutlined,
  AppstoreOutlined,
  RobotOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useUserStore } from '../store';
import { authAPI } from '../utils/api';
import './Layout.css';

const { Header, Content } = AntLayout;

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, accessToken, logout } = useUserStore();

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('登出失败', error);
    } finally {
      logout();
      localStorage.clear();
      navigate('/login');
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '我的主页',
      onClick: () => navigate(`/profile/${user?.id}`)
    },
    {
      key: 'my-activities',
      icon: <CalendarOutlined />,
      label: '我的活动',
      onClick: () => navigate('/my-activities')
    },
    {
      key: 'my-challenges',
      icon: <TrophyOutlined />,
      label: '我的挑战赛',
      onClick: () => navigate('/my-challenges')
    },
    {
      key: 'my-equipments',
      icon: <ToolOutlined />,
      label: '我的器材库',
      onClick: () => navigate('/my-equipments')
    },
    {
      key: 'admin',
      icon: <SettingOutlined />,
      label: '后台管理',
      onClick: () => navigate('/admin')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  return (
    <AntLayout className="layout">
      <Header className="header">
        <div className="header-content">
          <div className="logo" onClick={() => navigate('/')}>
            <CameraOutlined style={{ fontSize: 24, marginRight: 8 }} />
            <span>摄影社区</span>
          </div>

          <div className="header-menu">
            <Button 
              type="text" 
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
              className={location.pathname === '/' ? 'active' : ''}
            >
              首页
            </Button>
            
            <Dropdown menu={{ items: [
              {
                key: 'locations',
                icon: <EnvironmentOutlined />,
                label: '拍摄地',
                onClick: () => navigate('/locations')
              },
              {
                key: 'courses',
                icon: <BookOutlined />,
                label: '学院',
                onClick: () => navigate('/courses')
              },
              {
                key: 'equipments',
                icon: <ToolOutlined />,
                label: '器材库',
                onClick: () => navigate('/equipments')
              },
              {
                key: 'activities',
                icon: <CalendarOutlined />,
                label: '约拍活动',
                onClick: () => navigate('/activities')
              },
              {
                key: 'challenges',
                icon: <TrophyOutlined />,
                label: '挑战赛',
                onClick: () => navigate('/challenges')
              },
              {
                type: 'divider'
              },
              {
                key: 'ai-assistant',
                icon: <RobotOutlined />,
                label: 'AI问答助手',
                onClick: () => navigate('/ai-assistant')
              },
              {
                key: 'equipment-advisor',
                icon: <RobotOutlined />,
                label: 'AI选购助手',
                onClick: () => navigate('/equipment-advisor')
              }
            ] }} placement="bottomLeft">
              <Button 
                type="text" 
                icon={<AppstoreOutlined />}
              >
                探索
              </Button>
            </Dropdown>
            
            <Button 
              type="text" 
              icon={<SearchOutlined />}
              onClick={() => navigate('/search')}
              className={location.pathname === '/search' ? 'active' : ''}
            >
              搜索
            </Button>
            
            {accessToken && (
              <Button 
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={() => navigate('/create')}
              >
                发布作品
              </Button>
            )}
          </div>

          <div className="header-right">
            {accessToken ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Avatar 
                  src={user?.avatar} 
                  icon={<UserOutlined />}
                  style={{ cursor: 'pointer' }}
                />
              </Dropdown>
            ) : (
              <div>
                <Button onClick={() => navigate('/login')}>登录</Button>
                <Button 
                  type="primary" 
                  onClick={() => navigate('/register')}
                  style={{ marginLeft: 8 }}
                >
                  注册
                </Button>
              </div>
            )}
          </div>
        </div>
      </Header>

      <Content className="content">
        <Outlet />
      </Content>
    </AntLayout>
  );
};

export default Layout;
