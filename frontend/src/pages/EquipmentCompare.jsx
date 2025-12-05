import { useState, useEffect } from 'react';
import { Card, Select, Button, Table, Empty, message, Tag, Spin } from 'antd';
import { SwapOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import './EquipmentCompare.css';

const { Option } = Select;

function EquipmentCompare() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [equipmentType, setEquipmentType] = useState('camera'); // camera or lens
  const [selectedIds, setSelectedIds] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [compareData, setCompareData] = useState([]);

  useEffect(() => {
    // 从URL参数获取初始对比项
    const params = new URLSearchParams(location.search);
    const ids = params.get('ids');
    const type = params.get('type') || 'camera';
    
    setEquipmentType(type);
    if (ids) {
      const idList = ids.split(',').map(id => parseInt(id));
      setSelectedIds(idList);
    }
  }, [location]);

  useEffect(() => {
    fetchEquipmentList();
  }, [equipmentType]);

  useEffect(() => {
    if (selectedIds.length > 0) {
      fetchCompareData();
    } else {
      setCompareData([]);
    }
  }, [selectedIds, equipmentType]);

  const fetchEquipmentList = async () => {
    try {
      setLoading(true);
      const endpoint = equipmentType === 'camera' ? '/equipments/cameras' : '/equipments/lenses';
      const response = await api.get(endpoint, {
        params: { pageSize: 100 }
      });
      setEquipmentList(response.data.list || []);
    } catch (error) {
      console.error('获取器材列表失败:', error);
      message.error('获取器材列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompareData = async () => {
    try {
      setLoading(true);
      const promises = selectedIds.map(id => {
        const endpoint = equipmentType === 'camera' 
          ? `/equipments/cameras/${id}` 
          : `/equipments/lenses/${id}`;
        return api.get(endpoint);
      });
      const results = await Promise.all(promises);
      const data = results.map(res => res.data.data);
      setCompareData(data);
    } catch (error) {
      console.error('获取对比数据失败:', error);
      message.error('获取对比数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEquipment = (id) => {
    if (selectedIds.length >= 3) {
      message.warning('最多只能对比3个器材');
      return;
    }
    if (selectedIds.includes(id)) {
      message.warning('该器材已在对比列表中');
      return;
    }
    setSelectedIds([...selectedIds, id]);
  };

  const handleRemoveEquipment = (id) => {
    setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
  };

  const handleClearAll = () => {
    setSelectedIds([]);
    setCompareData([]);
  };

  const handleTypeChange = (value) => {
    setEquipmentType(value);
    setSelectedIds([]);
    setCompareData([]);
  };

  // 构建对比表格数据
  const buildCompareTableData = () => {
    if (compareData.length === 0) return [];

    const isCameraType = equipmentType === 'camera';
    
    const rows = [
      {
        key: 'image',
        label: '产品图片',
        render: (item) => (
          <img 
            src={item.cover_image || 'https://picsum.photos/200/150'} 
            alt={item.model}
            style={{ width: '100%', maxWidth: 200, borderRadius: 4 }}
          />
        )
      },
      {
        key: 'name',
        label: '型号',
        render: (item) => <strong>{item.brand} {item.model}</strong>
      },
      {
        key: 'price',
        label: '价格',
        render: (item) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{parseFloat(item.price).toLocaleString()}</span>
      }
    ];

    if (isCameraType) {
      rows.push(
        {
          key: 'sensor_type',
          label: '传感器类型',
          render: (item) => item.sensor_type ? <Tag color="purple">{item.sensor_type}</Tag> : '-'
        },
        {
          key: 'megapixels',
          label: '像素',
          render: (item) => item.megapixels ? `${item.megapixels} MP` : '-',
          highlight: true
        },
        {
          key: 'iso_range',
          label: 'ISO范围',
          render: (item) => item.iso_range || '-'
        },
        {
          key: 'focus_points',
          label: '对焦点',
          render: (item) => item.focus_points ? `${item.focus_points}点` : '-',
          highlight: true
        },
        {
          key: 'continuous_shooting',
          label: '连拍速度',
          render: (item) => item.continuous_shooting ? `${item.continuous_shooting} fps` : '-',
          highlight: true
        },
        {
          key: 'video_spec',
          label: '视频规格',
          render: (item) => item.video_spec || '-'
        },
        {
          key: 'weight',
          label: '重量',
          render: (item) => item.weight ? `${item.weight}g` : '-'
        }
      );
    } else {
      rows.push(
        {
          key: 'focal_length',
          label: '焦距',
          render: (item) => item.focal_length ? <Tag color="purple">{item.focal_length}</Tag> : '-'
        },
        {
          key: 'max_aperture',
          label: '最大光圈',
          render: (item) => item.max_aperture ? `f/${item.max_aperture}` : '-',
          highlight: true
        },
        {
          key: 'lens_type',
          label: '镜头类型',
          render: (item) => item.lens_type ? <Tag color="green">{item.lens_type}</Tag> : '-'
        },
        {
          key: 'mount',
          label: '卡口',
          render: (item) => item.mount || '-'
        },
        {
          key: 'image_stabilization',
          label: '防抖',
          render: (item) => item.image_stabilization ? <Tag color="success">支持</Tag> : <Tag>不支持</Tag>,
          highlight: true
        },
        {
          key: 'autofocus',
          label: '自动对焦',
          render: (item) => item.autofocus ? <Tag color="success">支持</Tag> : <Tag>不支持</Tag>
        },
        {
          key: 'filter_diameter',
          label: '滤镜口径',
          render: (item) => item.filter_diameter ? `${item.filter_diameter}mm` : '-'
        },
        {
          key: 'weight',
          label: '重量',
          render: (item) => item.weight ? `${item.weight}g` : '-'
        }
      );
    }

    rows.push({
      key: 'description',
      label: '产品描述',
      render: (item) => <div style={{ fontSize: 13, color: '#666' }}>{item.description || '-'}</div>
    });

    return rows.map(row => ({
      label: row.label,
      highlight: row.highlight,
      ...compareData.reduce((acc, item, index) => {
        acc[`item${index}`] = row.render ? row.render(item) : item[row.key] || '-';
        return acc;
      }, {})
    }));
  };

  const tableData = buildCompareTableData();

  const columns = [
    {
      title: '参数',
      dataIndex: 'label',
      key: 'label',
      width: 150,
      fixed: 'left',
      render: (text, record) => (
        <strong style={{ color: record.highlight ? '#1890ff' : '#333' }}>
          {text}
        </strong>
      )
    },
    ...compareData.map((item, index) => ({
      title: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 8 }}>
            <strong>{item.brand} {item.model}</strong>
          </div>
          <Button 
            danger 
            size="small" 
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveEquipment(item.id)}
          >
            移除
          </Button>
        </div>
      ),
      dataIndex: `item${index}`,
      key: `item${index}`,
      width: 250
    }))
  ];

  return (
    <div className="equipment-compare-container">
      <div className="compare-header">
        <h1><SwapOutlined /> 器材对比</h1>
        <p>选择最多3个器材进行详细参数对比</p>
      </div>

      <Card className="compare-controls">
        <div className="control-row">
          <div className="control-item">
            <label>器材类型：</label>
            <Select 
              value={equipmentType} 
              onChange={handleTypeChange}
              style={{ width: 150 }}
            >
              <Option value="camera">相机</Option>
              <Option value="lens">镜头</Option>
            </Select>
          </div>

          <div className="control-item">
            <label>添加对比器材：</label>
            <Select
              showSearch
              placeholder="搜索并选择器材"
              style={{ width: 300 }}
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              onChange={handleAddEquipment}
              value={null}
              disabled={selectedIds.length >= 3}
            >
              {equipmentList.map(item => (
                <Option 
                  key={item.id} 
                  value={item.id}
                  disabled={selectedIds.includes(item.id)}
                >
                  {item.brand} {item.model} - ¥{parseFloat(item.price).toLocaleString()}
                </Option>
              ))}
            </Select>
          </div>

          {selectedIds.length > 0 && (
            <Button 
              danger 
              onClick={handleClearAll}
              icon={<DeleteOutlined />}
            >
              清空所有
            </Button>
          )}
        </div>

        <div className="selected-count">
          已选择 {selectedIds.length}/3 个器材
        </div>
      </Card>

      <Spin spinning={loading}>
        {compareData.length > 0 ? (
          <Card className="compare-table-card">
            <Table
              columns={columns}
              dataSource={tableData}
              pagination={false}
              bordered
              scroll={{ x: 'max-content' }}
              rowKey={(record, index) => `row-${index}`}
            />
          </Card>
        ) : (
          <Card>
            <Empty
              image={<SwapOutlined style={{ fontSize: 64, color: '#1890ff' }} />}
              description={
                <div>
                  <h3>开始对比器材</h3>
                  <p>从上方选择框中添加器材，最多可对比3个</p>
                </div>
              }
            />
          </Card>
        )}
      </Spin>
    </div>
  );
}

export default EquipmentCompare;
