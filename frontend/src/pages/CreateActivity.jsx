import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, Form, Input, Select, DatePicker, InputNumber, Button, 
  message, Upload, Space 
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useUserStore } from '../store';
import api from '../utils/api';
import dayjs from 'dayjs';
import './CreateActivity.css';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

function CreateActivity() {
  const navigate = useNavigate();
  const { accessToken } = useUserStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState('');

  if (!accessToken) {
    message.warning('请先登录');
    navigate('/login');
    return null;
  }

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      const activityData = {
        title: values.title,
        coverImage: coverImage || '',
        description: values.description,
        activityType: values.activityType,
        location: values.location,
        latitude: 0, // TODO: 集成地图选点
        longitude: 0,
        startTime: values.timeRange[0].format('YYYY-MM-DD HH:mm:ss'),
        endTime: values.timeRange[1] ? values.timeRange[1].format('YYYY-MM-DD HH:mm:ss') : null,
        maxParticipants: values.maxParticipants || 0,
        feeType: values.feeType,
        feeAmount: values.feeAmount || 0,
        requirements: values.requirements || '',
        schedule: values.schedule || '',
        notes: values.notes || '',
        tags: values.tags || []
      };

      const response = await api.post('/activities', activityData);
      message.success('创建成功！');
      navigate(`/activity/${response.data.id}`);
    } catch (error) {
      message.error(error.response?.data?.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadChange = (info) => {
    if (info.file.status === 'done') {
      setCoverImage(info.file.response.url);
      message.success('上传成功');
    } else if (info.file.status === 'error') {
      message.error('上传失败');
    }
  };

  return (
    <div className="create-activity-container">
      <div className="create-activity-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/activities')}
        >
          返回活动列表
        </Button>
      </div>

      <Card title="📅 发起约拍活动" className="create-activity-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            feeType: 'free',
            activityType: 'theme'
          }}
        >
          <Form.Item
            label="活动标题"
            name="title"
            rules={[
              { required: true, message: '请输入活动标题' },
              { max: 100, message: '标题不能超过100个字符' }
            ]}
          >
            <Input 
              placeholder="例如：周末外滩日落人像拍摄" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="封面图片"
            help="建议尺寸：800x400"
          >
            <Upload
              name="file"
              action="/api/v1/upload/image"
              headers={{
                Authorization: `Bearer ${accessToken}`
              }}
              listType="picture-card"
              maxCount={1}
              onChange={handleUploadChange}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传封面</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item
            label="活动描述"
            name="description"
            rules={[
              { required: true, message: '请输入活动描述' },
              { max: 500, message: '描述不能超过500个字符' }
            ]}
          >
            <TextArea 
              rows={4}
              placeholder="详细描述活动内容、目的、适合人群等"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Space size="large" style={{ width: '100%' }}>
            <Form.Item
              label="活动类型"
              name="activityType"
              style={{ width: 200 }}
              rules={[{ required: true, message: '请选择活动类型' }]}
            >
              <Select size="large">
                <Option value="sunrise">晨拍</Option>
                <Option value="sunset">日落</Option>
                <Option value="night">夜拍</Option>
                <Option value="theme">主题拍摄</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="人数限制"
              name="maxParticipants"
              help="设为0表示不限人数"
              style={{ width: 200 }}
            >
              <InputNumber
                min={0}
                max={100}
                size="large"
                style={{ width: '100%' }}
                placeholder="0"
              />
            </Form.Item>
          </Space>

          <Form.Item
            label="活动地点"
            name="location"
            rules={[{ required: true, message: '请输入活动地点' }]}
          >
            <Input 
              placeholder="例如：上海外滩" 
              size="large"
              suffix={<EnvironmentOutlined />}
            />
          </Form.Item>

          <Form.Item
            label="活动时间"
            name="timeRange"
            rules={[{ required: true, message: '请选择活动时间' }]}
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              size="large"
              style={{ width: '100%' }}
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>

          <Space size="large" style={{ width: '100%' }}>
            <Form.Item
              label="费用类型"
              name="feeType"
              style={{ width: 200 }}
              rules={[{ required: true, message: '请选择费用类型' }]}
            >
              <Select size="large">
                <Option value="free">免费</Option>
                <Option value="aa">AA制</Option>
                <Option value="paid">收费</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="费用金额"
              name="feeAmount"
              help="免费活动无需填写"
              style={{ width: 200 }}
            >
              <InputNumber
                min={0}
                max={10000}
                size="large"
                style={{ width: '100%' }}
                placeholder="0"
                prefix="¥"
              />
            </Form.Item>
          </Space>

          <Form.Item
            label="活动要求"
            name="requirements"
            help="例如：器材要求、经验要求等"
          >
            <TextArea 
              rows={3}
              placeholder="对参与者的要求，可选填"
              showCount
              maxLength={300}
            />
          </Form.Item>

          <Form.Item
            label="活动流程"
            name="schedule"
            help="活动的详细安排"
          >
            <TextArea 
              rows={4}
              placeholder="例如：&#10;09:00 集合&#10;09:30 出发&#10;10:00 开始拍摄&#10;12:00 结束"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            label="注意事项"
            name="notes"
          >
            <TextArea 
              rows={3}
              placeholder="例如：天气、安全、装备等注意事项"
              showCount
              maxLength={300}
            />
          </Form.Item>

          <Form.Item
            label="活动标签"
            name="tags"
            help="添加相关标签，方便其他人搜索"
          >
            <Select
              mode="tags"
              size="large"
              placeholder="输入后按回车添加标签"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Space size="large">
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large"
                loading={loading}
                icon={<PlusOutlined />}
              >
                发布活动
              </Button>
              <Button 
                size="large"
                onClick={() => navigate('/activities')}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default CreateActivity;
