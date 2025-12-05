import { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, message, InputNumber, Result, Tag, Row, Col, Divider } from 'antd';
import { ShoppingOutlined, RobotOutlined, CameraOutlined, ToolOutlined, SwapOutlined } from '@ant-design/icons';
import { useUserStore } from '../store';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './EquipmentAdvisor.css';

const { TextArea } = Input;
const { Option } = Select;

function EquipmentAdvisor() {
  const navigate = useNavigate();
  const { accessToken } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState(null);
  const [recommendedEquipments, setRecommendedEquipments] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!accessToken) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
  }, [accessToken]);

  const handleSubmit = async (values) => {
    setLoading(true);
    setAdvice(null);
    setRecommendedEquipments(null);

    try {
      console.log('发送器材推荐请求:', values);
      const response = await api.post('/ai/equipment-advice', values);
      console.log('收到器材推荐响应:', response);
      setAdvice(response.data);
      setRecommendedEquipments(response.data.recommendedEquipments);
      message.success('获取推荐成功！');
    } catch (error) {
      console.error('器材推荐错误:', error);
      console.error('错误响应:', error.response);
      const errorMsg = error.response?.data?.message || error.message || '获取推荐失败';
      message.error(errorMsg);
      
      // 如果是AI服务错误，提示用户检查配置
      if (error.response?.data?.code === 50000) {
        message.warning('请确认千问API密钥已配置，详见AI_FEATURES_GUIDE.md', 5);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setAdvice(null);
    setRecommendedEquipments(null);
  };

  return (
    <div className="equipment-advisor-container">
      <div className="equipment-advisor-header">
        <h1><ShoppingOutlined /> AI器材选购助手</h1>
        <p>根据你的需求和预算，为你推荐最合适的摄影器材</p>
      </div>

      <div className="equipment-advisor-content">
        <div className="form-section">
          <Card title={<span><RobotOutlined /> 告诉我你的需求</span>}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                label="预算范围"
                name="budget"
                rules={[{ required: true, message: '请输入预算' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1000}
                  max={100000}
                  step={1000}
                  placeholder="例如: 10000"
                  addonAfter="元"
                />
              </Form.Item>

              <Form.Item
                label="主要拍摄场景"
                name="scene"
                rules={[{ required: true, message: '请选择拍摄场景' }]}
              >
                <Select placeholder="选择你最常拍摄的场景" mode="multiple">
                  <Option value="人像">人像摄影</Option>
                  <Option value="风光">风光摄影</Option>
                  <Option value="街拍">街拍纪实</Option>
                  <Option value="旅行">旅行摄影</Option>
                  <Option value="静物">静物产品</Option>
                  <Option value="运动">体育运动</Option>
                  <Option value="野生动物">野生动物</Option>
                  <Option value="建筑">建筑摄影</Option>
                  <Option value="微距">微距摄影</Option>
                  <Option value="星空">星空摄影</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="摄影经验"
                name="experience"
                rules={[{ required: true, message: '请选择经验水平' }]}
              >
                <Select placeholder="选择你的摄影经验">
                  <Option value="新手">新手（刚入门）</Option>
                  <Option value="入门">入门（1年以内）</Option>
                  <Option value="进阶">进阶（1-3年）</Option>
                  <Option value="资深">资深（3年以上）</Option>
                  <Option value="专业">专业摄影师</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="现有器材"
                name="currentGear"
              >
                <TextArea
                  rows={3}
                  placeholder="例如: 佳能 EOS R6 + 24-70mm f/2.8&#10;或者: 无（首次购买）"
                />
              </Form.Item>

              <Form.Item
                label="其他要求"
                name="question"
              >
                <TextArea
                  rows={4}
                  placeholder="有什么特殊需求或疑问？例如：&#10;- 需要轻便易携带&#10;- 对焦性能要好&#10;- 视频拍摄能力强&#10;- 品牌偏好等"
                />
              </Form.Item>

              <Form.Item>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Button type="primary" htmlType="submit" loading={loading} block>
                    获取推荐方案
                  </Button>
                  <Button onClick={handleReset}>
                    重置
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </Card>
        </div>

        <div className="result-section">
          {advice ? (
            <>
              <Card title="📋 推荐方案" className="advice-card">
                <div className="requirement-summary">
                  <h4>需求总结</h4>
                  <div className="requirement-text">{advice.requirement}</div>
                </div>
                <div className="advice-content">
                  <h4>AI推荐建议</h4>
                  <div className="advice-text">{advice.advice}</div>
                </div>
                <div className="advice-footer">
                  <p style={{ color: '#999', fontSize: 12, marginTop: 20 }}>
                    ⚠️ 以上建议仅供参考，实际购买时请根据自己的实际情况和市场价格做出决策
                  </p>
                </div>
              </Card>

              {/* 推荐器材卡片 */}
              {recommendedEquipments && (recommendedEquipments.cameras?.length > 0 || recommendedEquipments.lenses?.length > 0) && (
                <Card title="📦 推荐器材" className="equipment-cards" style={{ marginTop: 20 }}>
                  <div style={{ marginBottom: 16, textAlign: 'right' }}>
                    <Button 
                      type="primary"
                      icon={<SwapOutlined />}
                      onClick={() => {
                        const cameraIds = recommendedEquipments.cameras?.map(c => c.id).join(',');
                        const lensIds = recommendedEquipments.lenses?.map(l => l.id).join(',');
                        if (cameraIds) {
                          navigate(`/equipment-compare?type=camera&ids=${cameraIds}`);
                        } else if (lensIds) {
                          navigate(`/equipment-compare?type=lens&ids=${lensIds}`);
                        }
                      }}
                      disabled={!recommendedEquipments.cameras?.length && !recommendedEquipments.lenses?.length}
                    >
                      对比推荐器材
                    </Button>
                  </div>
                  <Divider />
                  {recommendedEquipments.cameras?.length > 0 && (
                    <>
                      <h4><CameraOutlined /> 推荐相机</h4>
                      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        {recommendedEquipments.cameras.map((camera) => (
                          <Col xs={24} sm={12} lg={8} key={camera.id}>
                            <Card 
                              hoverable
                              className="equipment-item-card"
                              onClick={() => navigate(`/equipment/camera/${camera.id}`)}
                            >
                              <div className="equipment-item-header">
                                <h4>{camera.brand} {camera.model}</h4>
                                <Tag color="blue">ID: {camera.id}</Tag>
                              </div>
                              <div className="equipment-item-price">
                                ¥{parseFloat(camera.price).toLocaleString()}
                              </div>
                              <div className="equipment-item-specs">
                                {camera.sensor_type && (
                                  <Tag color="purple">{camera.sensor_type}</Tag>
                                )}
                                {camera.megapixels && (
                                  <Tag>{camera.megapixels}MP</Tag>
                                )}
                                {camera.video_spec && (
                                  <Tag color="green">{camera.video_spec}</Tag>
                                )}
                              </div>
                              {camera.description && (
                                <p className="equipment-item-desc">{camera.description}</p>
                              )}
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </>
                  )}

                  {recommendedEquipments.lenses?.length > 0 && (
                    <>
                      <h4><ToolOutlined /> 推荐镜头</h4>
                      <Row gutter={[16, 16]}>
                        {recommendedEquipments.lenses.map((lens) => (
                          <Col xs={24} sm={12} lg={8} key={lens.id}>
                            <Card 
                              hoverable
                              className="equipment-item-card"
                              onClick={() => navigate(`/equipment/lens/${lens.id}`)}
                            >
                              <div className="equipment-item-header">
                                <h4>{lens.brand} {lens.model}</h4>
                                <Tag color="blue">ID: {lens.id}</Tag>
                              </div>
                              <div className="equipment-item-price">
                                ¥{parseFloat(lens.price).toLocaleString()}
                              </div>
                              <div className="equipment-item-specs">
                                {lens.focal_length && (
                                  <Tag color="purple">{lens.focal_length}</Tag>
                                )}
                                {lens.max_aperture && (
                                  <Tag>f/{lens.max_aperture}</Tag>
                                )}
                                {lens.lens_type && (
                                  <Tag color="green">{lens.lens_type}</Tag>
                                )}
                              </div>
                              {lens.description && (
                                <p className="equipment-item-desc">{lens.description}</p>
                              )}
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </>
                  )}
                </Card>
              )}
            </>
          ) : (
            <Card>
              <Result
                icon={<ShoppingOutlined style={{ color: '#1890ff' }} />}
                title="填写需求，获取专业推荐"
                subTitle="我会根据你的预算、场景和经验，从数据库中为你筛选最合适的器材方案"
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default EquipmentAdvisor;
