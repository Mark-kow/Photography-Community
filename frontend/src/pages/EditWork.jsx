import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, Upload, Button, message, Row, Col, Spin } from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { workAPI } from '../utils/api';
import SmartTagSelector from '../components/SmartTagSelector';
import './CreateWork.css';

const { TextArea } = Input;

const EditWork = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [work, setWork] = useState(null);
  const [tags, setTags] = useState([]);
  const [workInfo, setWorkInfo] = useState({});

  // 加载作品详情
  useEffect(() => {
    loadWorkDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadWorkDetail = async () => {
    try {
      const res = await workAPI.getWorkDetail(id);
      const workData = res.data;
      setWork(workData);
      
      // 解析标签
      let parsedTags = [];
      if (workData.tags) {
        try {
          parsedTags = typeof workData.tags === 'string' 
            ? JSON.parse(workData.tags) 
            : workData.tags;
        } catch (e) {
          parsedTags = [];
        }
      }
      setTags(parsedTags);
      
      // 设置表单初始值
      form.setFieldsValue({
        title: workData.title || '',
        description: workData.description || '',
        location: workData.location || '',
        camera: workData.camera || '',
        lens: workData.lens || '',
        aperture: workData.aperture || '',
        shutter_speed: workData.shutter_speed || '',
        iso: workData.iso || '',
        focal_length: workData.focal_length || ''
      });
      
      // 初始化workInfo
      setWorkInfo({
        title: workData.title,
        description: workData.description,
        location: workData.location,
        exifData: {
          camera: workData.camera,
          lens: workData.lens,
          aperture: workData.aperture,
          shutterSpeed: workData.shutter_speed,
          iso: workData.iso,
          focalLength: workData.focal_length
        }
      });
      
    } catch (error) {
      console.error('加载作品失败:', error);
      message.error('作品不存在或无权限编辑');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // 监听表单变化，更新workInfo供AI生成标签使用
  const handleFormChange = (changedValues, allValues) => {
    setWorkInfo({
      title: allValues.title,
      description: allValues.description,
      location: allValues.location,
      exifData: {
        camera: allValues.camera,
        lens: allValues.lens,
        aperture: allValues.aperture,
        shutterSpeed: allValues.shutter_speed,
        iso: allValues.iso,
        focalLength: allValues.focal_length
      }
    });
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      // 更新作品
      await workAPI.updateWork(id, {
        ...values,
        tags // 直接使用标签数组
      });

      message.success('更新成功');
      navigate(`/work/${id}`);
    } catch (error) {
      console.error('更新失败', error);
      message.error('更新失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div className="create-work-container">
      <div className="create-work-content">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(`/work/${id}`)}
          style={{ marginBottom: 16 }}
        >
          返回作品详情
        </Button>
        
        <Card title="编辑作品">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onValuesChange={handleFormChange}
          >
            {/* 显示图片预览（不可编辑） */}
            {work && work.images && work.images.length > 0 && (
              <Form.Item label="作品图片">
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  flexWrap: 'wrap',
                  marginBottom: '8px' 
                }}>
                  {work.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`图片${index + 1}`}
                      style={{ 
                        width: '100px', 
                        height: '100px', 
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                    />
                  ))}
                </div>
                <div style={{ color: '#999', fontSize: '12px' }}>
                  注：图片暂不支持修改，如需更换请重新发布作品
                </div>
              </Form.Item>
            )}

            <Form.Item
              name="title"
              label="标题"
              rules={[{ max: 100, message: '标题不能超过100字' }]}
            >
              <Input placeholder="为你的作品起个标题" />
            </Form.Item>

            <Form.Item
              name="description"
              label="描述"
              rules={[{ max: 1000, message: '描述不能超过1000字' }]}
            >
              <TextArea 
                rows={4} 
                placeholder="分享你的摄影故事..."
                maxLength={1000}
                showCount
              />
            </Form.Item>

            <Form.Item name="location" label="拍摄地点">
              <Input placeholder="在哪里拍摄的？" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="camera" label="相机型号">
                  <Input placeholder="使用的相机型号" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="lens" label="镜头">
                  <Input placeholder="使用的镜头" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item name="aperture" label="光圈">
                  <Input placeholder="如：f/2.8" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="shutter_speed" label="快门速度">
                  <Input placeholder="如：1/125" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="iso" label="ISO">
                  <Input placeholder="如：100" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="focal_length" label="焦距">
              <Input placeholder="如：50mm" />
            </Form.Item>

            <Form.Item label="标签（智能推荐）">
              <SmartTagSelector
                value={tags}
                onChange={setTags}
                workInfo={workInfo}
                maxTags={10}
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitting}
                size="large"
                block
              >
                {submitting ? '保存中...' : '保存修改'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default EditWork;
