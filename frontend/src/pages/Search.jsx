import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Input, Row, Col, Card, Empty, Image, Avatar, Typography, Space, 
  Spin, message, Tag 
} from 'antd';
import { 
  HeartOutlined, HeartFilled, MessageOutlined, EyeOutlined, SearchOutlined 
} from '@ant-design/icons';
import { workAPI } from '../utils/api';
import './Search.css';

const { Title, Text } = Typography;
const { Search: AntSearch } = Input;

const Search = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setKeyword(q);
      performSearch(q);
    }
  }, [searchParams]);

  const performSearch = async (searchKeyword, pageNum = 1) => {
    if (!searchKeyword || !searchKeyword.trim()) {
      message.warning('请输入搜索关键词');
      return;
    }

    setLoading(true);
    try {
      const res = await workAPI.searchWorks({ 
        keyword: searchKeyword.trim(), 
        page: pageNum, 
        pageSize: 20 
      });
      
      setWorks(res.data.items);
      setTotal(res.data.total);
      setPage(pageNum);
    } catch (error) {
      console.error('搜索失败', error);
      message.error('搜索失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    if (value && value.trim()) {
      setSearchParams({ q: value.trim() });
      performSearch(value.trim());
    }
  };

  const handleLike = async (workId, isLiked) => {
    try {
      if (isLiked) {
        await workAPI.unlikeWork(workId);
      } else {
        await workAPI.likeWork(workId);
      }
      
      // 更新本地状态
      setWorks(works.map(work => 
        work.id === workId 
          ? { 
              ...work, 
              is_liked: !isLiked,
              like_count: work.like_count + (isLiked ? -1 : 1)
            }
          : work
      ));
    } catch (error) {
      console.error('点赞失败', error);
    }
  };

  return (
    <div className="search-container">
      <div className="search-content">
        <div className="search-header">
          <AntSearch
            placeholder="搜索作品、用户、地点..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
            style={{ maxWidth: 600 }}
          />
        </div>

        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : (
          <>
            {keyword && (
              <div className="search-info">
                <Text type="secondary">
                  搜索"{keyword}"找到 {total} 个结果
                </Text>
              </div>
            )}

            {works.length === 0 ? (
              <Empty description={keyword ? "未找到相关作品" : "输入关键词开始搜索"} />
            ) : (
              <Row gutter={[16, 16]}>
                {works.map((work) => (
                  <Col key={work.id} xs={24} sm={12} md={8} lg={6}>
                    <Card
                      hoverable
                      cover={
                        <div 
                          className="work-cover"
                          onClick={() => navigate(`/work/${work.id}`)}
                        >
                          <Image
                            src={work.images[0]}
                            alt={work.title}
                            preview={false}
                            style={{ width: '100%', height: 240, objectFit: 'cover' }}
                          />
                        </div>
                      }
                      className="work-card"
                    >
                      <Card.Meta
                        avatar={
                          <Avatar 
                            src={work.avatar} 
                            onClick={() => navigate(`/profile/${work.user_id}`)}
                            style={{ cursor: 'pointer' }}
                          />
                        }
                        title={
                          <div onClick={() => navigate(`/work/${work.id}`)} style={{ cursor: 'pointer' }}>
                            {work.title || '无标题'}
                          </div>
                        }
                        description={
                          <>
                            <div style={{ marginBottom: 8 }}>
                              <Text type="secondary">{work.nickname}</Text>
                            </div>
                            <Space size="middle">
                              <span onClick={() => handleLike(work.id, work.is_liked)} style={{ cursor: 'pointer' }}>
                                {work.is_liked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                                {' '}{work.like_count || 0}
                              </span>
                              <span>
                                <MessageOutlined /> {work.comment_count || 0}
                              </span>
                              <span>
                                <EyeOutlined /> {work.view_count || 0}
                              </span>
                            </Space>
                          </>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Search;
