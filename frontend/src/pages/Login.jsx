import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { authAPI } from '../utils/api';
import { useUserStore } from '../store';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { setUser, setAccessToken } = useUserStore();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await authAPI.login(values);
      
      setUser(res.data.user);
      setAccessToken(res.data.accessToken);
      
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('userInfo', JSON.stringify(res.data.user));
      
      message.success('登录成功');
      navigate('/');
    } catch (error) {
      console.error('登录失败', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <h1>📸 摄影社区</h1>
          <p>欢迎回来！登录发现更多精彩作品</p>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]}
          >
            <Input 
              prefix={<PhoneOutlined />} 
              placeholder="手机号" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>

          <div className="login-footer">
            还没有账号？ <Link to="/register">立即注册</Link>
          </div>

          <div className="login-tip">
            测试账号：13800138001 / 密码：123456
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
