import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Upload, Button, message, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { workAPI } from '../utils/api';
import SmartTagSelector from '../components/SmartTagSelector';
import './CreateWork.css';

const { TextArea } = Input;

const CreateWork = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [tags, setTags] = useState([]);
  const [workInfo, setWorkInfo] = useState({});

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

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await workAPI.uploadImage(formData);
      return res.data.url;
    } catch (error) {
      message.error('上传失败');
      throw error;
    }
  };

  const onFinish = async (values) => {
    if (fileList.length === 0) {
      message.warning('请至少上传一张图片');
      return;
    }

    setUploading(true);
    try {
      // 上传所有图片
      const uploadPromises = fileList.map(file => 
        file.url ? Promise.resolve(file.url) : handleUpload(file.originFileObj)
      );
      
      const images = await Promise.all(uploadPromises);

      // 创建作品
      await workAPI.createWork({
        ...values,
        images,
        tags // 直接使用数组
      });

      message.success('发布成功');
      navigate('/');
    } catch (error) {
      console.error('发布失败', error);
    } finally {
      setUploading(false);
    }
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传图片</div>
    </div>
  );

  return (
    <div className="create-work-container">
      <div className="create-work-content">
        <Card title="发布作品">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onValuesChange={handleFormChange}
          >
            <Form.Item label="上传图片" required>
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                beforeUpload={() => false}
                maxCount={9}
              >
                {fileList.length < 9 && uploadButton}
              </Upload>
            </Form.Item>

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
                loading={uploading}
                size="large"
                block
              >
                发布作品
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default CreateWork;
