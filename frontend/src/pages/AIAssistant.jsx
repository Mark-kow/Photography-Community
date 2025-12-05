import { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, message, Spin, Tag } from 'antd';
import { SendOutlined, BulbOutlined, RobotOutlined } from '@ant-design/icons';
import { useUserStore } from '../store';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './AIAssistant.css';

const { TextArea } = Input;

function AIAssistant() {
  const navigate = useNavigate();
  const { accessToken } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [quickQuestions, setQuickQuestions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!accessToken) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    fetchQuickQuestions();
  }, [accessToken]);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchQuickQuestions = async () => {
    try {
      const response = await api.get('/ai/quick-questions');
      setQuickQuestions(response.data);
    } catch (error) {
      console.error('获取快速提问失败', error);
    }
  };

  const handleAsk = async (questionText = question) => {
    if (!questionText || questionText.trim() === '') {
      message.warning('请输入问题');
      return;
    }

    const userQuestion = questionText.trim();
    setQuestion('');
    
    // 添加用户问题到聊天记录
    const newHistory = [...chatHistory, { role: 'user', content: userQuestion }];
    setChatHistory(newHistory);
    setLoading(true);

    try {
      const response = await api.post('/ai/qa', {
        question: userQuestion,
        history: chatHistory.slice(-10).filter((item, index) => index % 2 === 0).map((item, index) => ({
          question: item.content,
          answer: chatHistory[index * 2 + 1]?.content || ''
        }))
      });

      // 添加AI回答到聊天记录
      setChatHistory([...newHistory, { 
        role: 'assistant', 
        content: response.data.answer 
      }]);
    } catch (error) {
      message.error(error.response?.data?.message || '提问失败');
      // 移除最后一条用户问题
      setChatHistory(chatHistory);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (q) => {
    setQuestion(q);
    handleAsk(q);
  };

  const handleClearHistory = () => {
    setChatHistory([]);
    message.success('对话历史已清空');
  };

  return (
    <div className="ai-assistant-container">
      <div className="ai-assistant-header">
        <h1><RobotOutlined /> AI摄影助手</h1>
        <p>专业的摄影问答，随时为你解惑</p>
      </div>

      <div className="ai-assistant-content">
        <div className="chat-section">
          <Card className="chat-box">
            <div className="messages-container">
              {chatHistory.length === 0 ? (
                <div className="welcome-message">
                  <RobotOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 20 }} />
                  <h3>你好！我是AI摄影助手</h3>
                  <p>有任何摄影相关的问题都可以问我</p>
                  <p>比如：拍摄技巧、参数设置、器材选择等</p>
                </div>
              ) : (
                <>
                  {chatHistory.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
                    >
                      <div className="message-avatar">
                        {msg.role === 'user' ? '👤' : '🤖'}
                      </div>
                      <div className="message-content">
                        <div className="message-text">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="message assistant-message">
                      <div className="message-avatar">🤖</div>
                      <div className="message-content">
                        <div className="message-text">
                          <Spin size="small" /> 正在思考中...
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="chat-input-section">
              <TextArea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
                placeholder="输入你的问题... (Shift+Enter换行)"
                autoSize={{ minRows: 2, maxRows: 4 }}
                disabled={loading}
              />
              <div className="chat-input-actions">
                <Button onClick={handleClearHistory} disabled={chatHistory.length === 0}>
                  清空历史
                </Button>
                <Button 
                  type="primary" 
                  icon={<SendOutlined />}
                  onClick={() => handleAsk()}
                  loading={loading}
                  disabled={!question.trim()}
                >
                  发送
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="quick-questions-section">
          <Card title={<span><BulbOutlined /> 快速提问</span>} className="quick-questions-card">
            {quickQuestions.map((category, idx) => (
              <div key={idx} className="question-category">
                <h4>{category.category}</h4>
                <div className="question-tags">
                  {category.questions.map((q, qIdx) => (
                    <Tag 
                      key={qIdx}
                      className="question-tag"
                      onClick={() => handleQuickQuestion(q)}
                    >
                      {q}
                    </Tag>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AIAssistant;
