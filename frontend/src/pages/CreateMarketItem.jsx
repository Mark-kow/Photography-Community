import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, InputNumber, Select, Button, Upload, message, Card } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import api from '../utils/api';
import './CreateMarketItem.css';

const { TextArea } = Input;

function CreateMarketItem() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await api.post('/works/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.url;
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (values) => {
    if (fileList.length === 0) {
      message.warning('请至少上传一张图片');
      return;
    }

    setLoading(true);
    try {
      const imageUrls = await Promise.all(
        fileList.map(file => 
          file.url ? Promise.resolve(file.url) : uploadImage(file.originFileObj)
        )
      );

      await api.post('/equipments/market', {
        ...values,
        images: imageUrls
      });

      message.success('发布成功！');
      navigate('/market');
    } catch (error) {
      message.error(error.response?.data?.message || '发布失败');
    } finally {
      setLoading(false);
    }
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传图片</div>
    </div>
  );

  return (
    <div className="create-market-item-container">
      <div className="create-market-item-content">
        <Card title="发布二手商品">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              equipmentType: 'camera',
              conditionLevel: 'good',
              tradeMethod: 'both'
            }}
          >
            <Form.Item
              name="equipmentType"
              label="器材类型"
              rules={[{ required: true, message: '请选择器材类型' }]}
            >
              <Select>
                <Select.Option value="camera">相机</Select.Option>
                <Select.Option value="lens">镜头</Select.Option>
                <Select.Option value="other">其他</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="title"
              label="商品标题"
              rules={[
                { required: true, message: '请输入商品标题' },
                { max: 100, message: '标题不能超过100字' }
              ]}
            >
              <Input placeholder="请输入商品标题" />
            </Form.Item>

            <Form.Item
              name="description"
              label="商品描述"
              rules={[{ max: 1000, message: '描述不能超过1000字' }]}
            >
              <TextArea 
                rows={4} 
                placeholder="详细描述器材的使用情况、外观成色等" 
                maxLength={1000}
                showCount
              />
            </Form.Item>

            <Form.Item label="商品图片" required>
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
              name="conditionLevel"
              label="成色"
              rules={[{ required: true, message: '请选择成色' }]}
            >
              <Select>
                <Select.Option value="excellent">99新</Select.Option>
                <Select.Option value="good">95新</Select.Option>
                <Select.Option value="fair">9成新</Select.Option>
                <Select.Option value="used">8成新</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="shutterCount"
              label="快门数（相机）"
            >
              <InputNumber 
                style={{ width: '100%' }} 
                placeholder="输入快门数"
                min={0}
              />
            </Form.Item>

            <Form.Item
              name="accessories"
              label="配件清单"
            >
              <TextArea 
                rows={3} 
                placeholder="例如：原装包装盒、说明书、充电器、数据线等" 
              />
            </Form.Item>

            <Form.Item
              name="price"
              label="售价（元）"
              rules={[
                { required: true, message: '请输入售价' },
                { type: 'number', min: 0, message: '价格不能为负数' }
              ]}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                placeholder="输入售价"
                min={0}
                precision={2}
              />
            </Form.Item>

            <Form.Item
              name="originalPrice"
              label="原价（元）"
            >
              <InputNumber 
                style={{ width: '100%' }} 
                placeholder="输入原价"
                min={0}
                precision={2}
              />
            </Form.Item>

            <Form.Item
              name="tradeMethod"
              label="交易方式"
              rules={[{ required: true, message: '请选择交易方式' }]}
            >
              <Select>
                <Select.Option value="face">面交</Select.Option>
                <Select.Option value="ship">邮寄</Select.Option>
                <Select.Option value="both">面交或邮寄</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="location"
              label="所在地"
            >
              <Input placeholder="例如：北京市朝阳区" />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                size="large"
                block
              >
                发布商品
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export default CreateMarketItem;
