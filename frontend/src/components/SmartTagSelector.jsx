import React, { useState, useEffect } from 'react';
import { Tag, Input, Button, Space, Spin, message, Tooltip } from 'antd';
import { PlusOutlined, CloseCircleOutlined, BulbOutlined, FireOutlined, SyncOutlined } from '@ant-design/icons';
import axios from 'axios';
import './SmartTagSelector.css';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
});

// 请求拦截器
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器（处理错误）
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { code, message: msg } = error.response.data;
      
      // Token过期
      if (code === 40101 || code === 40102) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * 智能标签选择器组件
 * 支持：AI标签推荐、热门标签、手动输入、搜索补全
 */
const SmartTagSelector = ({ 
  value = [], 
  onChange, 
  workInfo = {}, // { title, description, exifData, location }
  maxTags = 10 
}) => {
  const [tags, setTags] = useState(value || []);
  const [inputValue, setInputValue] = useState('');
  const [inputVisible, setInputVisible] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // 初始化：加载热门标签
  useEffect(() => {
    loadPopularTags();
  }, []);

  // 监听tags变化，通知父组件
  useEffect(() => {
    if (onChange) {
      onChange(tags);
    }
  }, [tags]);

  // 加载热门标签
  const loadPopularTags = async () => {
    try {
      const res = await api.get('/ai/popular-tags?limit=20');
      if (res.data.code === 200) {
        setPopularTags(res.data.data.tags || []);
      }
    } catch (error) {
      console.error('加载热门标签失败:', error);
    }
  };

  // AI智能生成标签
  const generateAITags = async () => {
    if (!workInfo.title && !workInfo.description && !workInfo.location) {
      message.warning('请先填写标题、描述或地点，以便AI生成更准确的标签');
      return;
    }

    setAiLoading(true);
    try {
      const res = await api.post('/ai/generate-tags', {
        title: workInfo.title,
        description: workInfo.description,
        exifData: workInfo.exifData,
        location: workInfo.location,
        existingTags: tags
      });

      if (res.data.code === 200) {
        const { suggestedTags } = res.data.data;
        setAiSuggestions(suggestedTags || []);
        message.success(`AI生成了 ${suggestedTags.length} 个标签建议`);
      }
    } catch (error) {
      console.error('AI生成标签失败:', error);
      message.error('AI生成标签失败，请稍后重试');
    } finally {
      setAiLoading(false);
    }
  };

  // 搜索标签（自动补全）
  const searchTags = async (keyword) => {
    if (!keyword || keyword.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await api.get(`/ai/search-tags?keyword=${keyword}&limit=5`);
      if (res.data.code === 200) {
        setSearchResults(res.data.data.tags || []);
      }
    } catch (error) {
      console.error('搜索标签失败:', error);
    }
  };

  // 添加标签
  const handleAddTag = (tag) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;

    if (tags.length >= maxTags) {
      message.warning(`最多只能添加 ${maxTags} 个标签`);
      return;
    }

    if (tags.includes(trimmedTag)) {
      message.warning('标签已存在');
      return;
    }

    if (trimmedTag.length > 10) {
      message.warning('标签长度不能超过10个字符');
      return;
    }

    setTags([...tags, trimmedTag]);
    setInputValue('');
    setInputVisible(false);
    setSearchResults([]);
  };

  // 删除标签
  const handleRemoveTag = (removedTag) => {
    setTags(tags.filter(tag => tag !== removedTag));
  };

  // 输入变化
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // 触发搜索
    if (value.trim()) {
      searchTags(value.trim());
    } else {
      setSearchResults([]);
    }
  };

  // 输入确认
  const handleInputConfirm = () => {
    if (inputValue) {
      handleAddTag(inputValue);
    }
  };

  // 从AI建议添加标签
  const handleAddFromSuggestion = (tag) => {
    handleAddTag(tag);
    setAiSuggestions(aiSuggestions.filter(t => t !== tag));
  };

  return (
    <div className="smart-tag-selector">
      {/* 已选标签 */}
      <div className="selected-tags">
        <Space size={[0, 8]} wrap>
          {tags.map((tag, index) => (
            <Tag
              key={index}
              closable
              onClose={() => handleRemoveTag(tag)}
              className="selected-tag"
            >
              {tag}
            </Tag>
          ))}
          
          {/* 添加按钮 */}
          {tags.length < maxTags && !inputVisible && (
            <Tag
              className="add-tag-btn"
              onClick={() => setInputVisible(true)}
            >
              <PlusOutlined /> 添加标签
            </Tag>
          )}

          {/* 输入框 */}
          {inputVisible && (
            <div style={{ position: 'relative' }}>
              <Input
                type="text"
                size="small"
                style={{ width: 120 }}
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputConfirm}
                onPressEnter={handleInputConfirm}
                placeholder="输入标签"
                autoFocus
              />
              
              {/* 搜索结果下拉 */}
              {searchResults.length > 0 && (
                <div className="tag-search-dropdown">
                  {searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="tag-search-item"
                      onMouseDown={() => handleAddTag(item.tag)}
                    >
                      <span>{item.tag}</span>
                      <span className="tag-count">({item.count}次使用)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Space>
      </div>

      {/* AI智能推荐 */}
      <div className="ai-section">
        <div className="section-header">
          <BulbOutlined style={{ color: '#1890ff' }} />
          <span>AI智能推荐</span>
          <Button
            type="link"
            size="small"
            icon={aiLoading ? <SyncOutlined spin /> : <SyncOutlined />}
            onClick={generateAITags}
            loading={aiLoading}
            disabled={aiLoading}
          >
            {aiLoading ? '生成中...' : '生成标签'}
          </Button>
        </div>

        {aiSuggestions.length > 0 && (
          <div className="suggestion-tags">
            <Space size={[0, 8]} wrap>
              {aiSuggestions.map((tag, index) => (
                <Tag
                  key={index}
                  className="suggestion-tag"
                  onClick={() => handleAddFromSuggestion(tag)}
                  style={{ cursor: 'pointer' }}
                >
                  <PlusOutlined style={{ fontSize: '12px', marginRight: '4px' }} />
                  {tag}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {aiSuggestions.length === 0 && !aiLoading && (
          <div className="empty-hint">
            点击"生成标签"按钮，AI会根据作品信息智能推荐标签
          </div>
        )}
      </div>

      {/* 热门标签 */}
      <div className="popular-section">
        <div className="section-header">
          <FireOutlined style={{ color: '#ff4d4f' }} />
          <span>热门标签</span>
        </div>
        
        {popularTags.length > 0 && (
          <div className="popular-tags">
            <Space size={[0, 8]} wrap>
              {popularTags.slice(0, 15).map((item, index) => {
                const isSelected = tags.includes(item.tag);
                return (
                  <Tooltip key={index} title={`${item.count}次使用`}>
                    <Tag
                      className={`popular-tag ${isSelected ? 'selected' : ''}`}
                      onClick={() => !isSelected && handleAddTag(item.tag)}
                      style={{ 
                        cursor: isSelected ? 'not-allowed' : 'pointer',
                        opacity: isSelected ? 0.5 : 1
                      }}
                    >
                      {item.tag}
                    </Tag>
                  </Tooltip>
                );
              })}
            </Space>
          </div>
        )}
      </div>

      {/* 提示文字 */}
      <div className="tag-hint">
        已添加 {tags.length}/{maxTags} 个标签
      </div>
    </div>
  );
};

export default SmartTagSelector;
